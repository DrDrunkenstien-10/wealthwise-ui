import React, { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Container,
    Box,
    Button,
    Snackbar,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    useMediaQuery,
    Stack
} from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useKeycloakAuth } from '../hooks/useKeycloakAuth';
import MenuIcon from '@mui/icons-material/Menu';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

const Layout = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useKeycloakAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

    const showToast = (message, severity = 'success') => {
        setToast({ open: true, message, severity });
    };

    const handleCloseToast = () => setToast(prev => ({ ...prev, open: false }));
    const handleLogout = () => setLogoutDialogOpen(true);
    const confirmLogout = () => {
        setLogoutDialogOpen(false);
        logout();
    };
    const cancelLogout = () => setLogoutDialogOpen(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('loggedOut') === 'true') {
            showToast('You have been logged out.', 'info');
            navigate(location.pathname, { replace: true });
        }
    }, [location.search, navigate, location.pathname]);

    const navLinks = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/transactions', label: 'Transactions' },
        { path: '/recurring', label: 'Recurring' },
    ];

    return (
        <ToastContext.Provider value={showToast}>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f9f9f9' }}>
                {/* AppBar */}
                <AppBar
                    position="static"
                    elevation={0}
                    sx={{
                        bgcolor: 'white',
                        color: 'text.primary',
                        borderBottom: '1px solid #e0e0e0',
                    }}
                >
                    <Toolbar
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            px: { xs: 2, sm: 3 },
                            py: { xs: 1, sm: 1.5 },
                        }}
                    >
                        {/* Left - Logo */}
                        <Typography
                            variant="h5"
                            component={Link}
                            to="/dashboard"
                            sx={{
                                fontWeight: 700,
                                color: theme.palette.primary.main,
                                textDecoration: 'none',
                                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                            }}
                        >
                            Wealthwise
                        </Typography>

                        {/* Right - Nav + Logout */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            {!isMobile && (
                                <Stack direction="row" spacing={2} alignItems="center">
                                    {navLinks.map(({ path, label }) => (
                                        <Button
                                            key={path}
                                            component={Link}
                                            to={path}
                                            disableRipple
                                            sx={{
                                                fontSize: '1rem',
                                                fontWeight: location.pathname === path ? 'bold' : 'normal',
                                                color: location.pathname === path ? theme.palette.primary.main : 'text.primary',
                                                textTransform: 'none',
                                                '&:hover': {
                                                    backgroundColor: 'transparent',
                                                    color: theme.palette.primary.main,
                                                },
                                                borderBottom:
                                                    location.pathname === path
                                                        ? `2px solid ${theme.palette.primary.main}`
                                                        : '2px solid transparent',
                                                borderRadius: 0,
                                                pb: 0.5,
                                            }}
                                        >
                                            {label}
                                        </Button>
                                    ))}
                                </Stack>
                            )}

                            {/* Mobile Menu */}
                            {isMobile && (
                                <>
                                    <IconButton
                                        edge="start"
                                        color="inherit"
                                        aria-label="menu"
                                        onClick={(e) => setAnchorEl(e.currentTarget)}
                                    >
                                        <MenuIcon />
                                    </IconButton>
                                    <Menu
                                        anchorEl={anchorEl}
                                        open={Boolean(anchorEl)}
                                        onClose={() => setAnchorEl(null)}
                                    >
                                        {navLinks.map(({ path, label }) => (
                                            <MenuItem
                                                key={path}
                                                component={Link}
                                                to={path}
                                                onClick={() => setAnchorEl(null)}
                                                selected={location.pathname === path}
                                            >
                                                {label}
                                            </MenuItem>
                                        ))}
                                        <MenuItem onClick={() => { setAnchorEl(null); handleLogout(); }}>
                                            Logout
                                        </MenuItem>
                                    </Menu>
                                </>
                            )}

                            {/* Logout (Right-aligned) */}
                            {!isMobile && (
                                <Button
                                    onClick={handleLogout}
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                        textTransform: 'none',
                                        color: theme.palette.primary.main,
                                        borderColor: theme.palette.primary.main,
                                        '&:hover': {
                                            backgroundColor: theme.palette.action.hover,
                                            borderColor: theme.palette.primary.dark,
                                        },
                                    }}
                                >
                                    Logout
                                </Button>
                            )}
                        </Box>
                    </Toolbar>
                </AppBar>

                {/* Main Content */}
                <Container maxWidth="lg" sx={{ flex: 1, py: 4, px: { xs: 2, sm: 3 } }}>
                    <Outlet />
                </Container>

                {/* Footer */}
                <Box
                    component="footer"
                    sx={{
                        py: 2,
                        textAlign: 'center',
                        bgcolor: 'grey.100',
                        px: { xs: 2, sm: 4 },
                        mt: 'auto',
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        © {new Date().getFullYear()} Wealthwise &nbsp;|&nbsp;
                        <IconButton
                            component="a"
                            href="https://www.linkedin.com/in/atharva-jadhav-491235243/"
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            sx={{ color: 'text.secondary' }}
                        >
                            <LinkedInIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            component="a"
                            href="https://github.com/DrDrunkenstien-10"
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            sx={{ color: 'text.secondary' }}
                        >
                            <GitHubIcon fontSize="small" />
                        </IconButton>
                    </Typography>
                </Box>

                {/* Toast */}
                <Snackbar
                    open={toast.open}
                    autoHideDuration={4000}
                    onClose={handleCloseToast}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert
                        onClose={handleCloseToast}
                        severity={toast.severity}
                        variant="filled"
                        sx={{ width: '100%' }}
                    >
                        {toast.message}
                    </Alert>
                </Snackbar>

                {/* Logout Confirmation */}
                <Dialog open={logoutDialogOpen} onClose={cancelLogout}>
                    <DialogTitle>Confirm Logout</DialogTitle>
                    <DialogContent>
                        <Typography variant="body1">Are you sure you want to log out?</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={cancelLogout} variant="outlined">
                            Cancel
                        </Button>
                        <Button onClick={confirmLogout} color="error" variant="contained">
                            Logout
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </ToastContext.Provider>
    );
};

export default Layout;
