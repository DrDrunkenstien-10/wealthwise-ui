import axiosInstance from "../api/axiosInstance";
import { useEffect, useState, useCallback } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  TextField, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem,
  Grid, ToggleButtonGroup, ToggleButton, Stack
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useToast } from '../components/Layout';
import { useTheme, useMediaQuery } from '@mui/material';

const DEFAULT_TRANSACTION = {
  recurringTransactionId: '',
  recurringTransactionName: '',
  description: '',
  amount: '',
  category: '',
  paymentType: '',
  transactionType: '',
  frequency: '',
  startDate: '',
  endDate: '',
  nextOccurence: '',
  isActive: true,
};

const DEFAULT_FILTERS = {
  recurringTransactionName: '',
  minAmount: '',
  maxAmount: '',
  category: '',
  paymentType: '',
  transactionType: '',
  date: '',
  isActive: '',
  frequency: ''
};

export default function RecurringTransaction() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [transactions, setTransactions] = useState([]);
  const [editTransaction, setEditTransaction] = useState(DEFAULT_TRANSACTION);
  const [openEdit, setOpenEdit] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTransactionId, setDeleteTransactionId] = useState(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [newTransaction, setNewTransaction] = useState(DEFAULT_TRANSACTION);

  const showToast = useToast();

  const buildSearchQuery = useCallback(() => {
    const params = {
      ...filters,
      page,
      size,
      sortBy: "amount",
      direction: "desc"
    };
    Object.keys(params).forEach(key => (params[key] === '' || params[key] == null) && delete params[key]);
    return params;
  }, [filters, page, size]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let res;
        if (isSearchMode) {
          res = await axiosInstance.get(`https://api.wealthwise.ajadhav.com/api/v1/recurring-transactions/search`, {
            params: buildSearchQuery()
          });
        } else {
          res = await axiosInstance.get(`https://api.wealthwise.ajadhav.com/api/v1/recurring-transactions`, {
            params: { page, size }
          });
        }
        setTransactions(res.data.content);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        console.error("Failed to fetch recurring transactions:", err);
        showToast("Unable to load recurring transactions.", "error");
      }
    };
    fetchData();
  }, [page, size, isSearchMode, buildSearchQuery, showToast]);

  const handleInputChange = (setter) => (e) => {
    const { name, value, type, checked } = e.target;
    setter(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditTransaction = async () => {
    try {
      const payload = {
        ...editTransaction,
        amount: parseFloat(editTransaction.amount),
      };
      const { recurringTransactionId } = editTransaction;
      const response = await axiosInstance.patch(`https://api.wealthwise.ajadhav.com/api/v1/recurring-transactions/${recurringTransactionId}`, payload);
      setTransactions(prev => prev.map(t =>
        t.recurringTransactionId === recurringTransactionId ? response.data : t
      ));
      setOpenEdit(false);
      showToast("Recurring transaction updated!", "success");
    } catch (err) {
      console.error("Failed to update:", err);
      showToast("Update failed.", "error");
    }
  };

  const handleDeleteTransaction = async () => {
    try {
      await axiosInstance.delete(`https://api.wealthwise.ajadhav.com/api/v1/recurring-transactions/${deleteTransactionId}`);
      setTransactions(prev => prev.filter(t => t.recurringTransactionId !== deleteTransactionId));
      setConfirmOpen(false);
      showToast("Recurring transaction deleted!", "success");
    } catch (err) {
      console.error("Failed to delete:", err);
      showToast("Deletion failed.", "error");
    }
  };

  const handleCreateTransaction = async () => {
    try {
      const payload = {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
      };

      const res = await axiosInstance.post(`https://api.wealthwise.ajadhav.com/api/v1/recurring-transactions`, payload);
      setTransactions(prev => [res.data, ...prev]);
      setOpenAdd(false);
      setNewTransaction(DEFAULT_TRANSACTION);
      showToast("Recurring transaction created!", "success");
    } catch (err) {
      console.error("Creation failed:", err);

      if (err.response && err.response.status === 409) {
        showToast(err.response.data?.message || "Duplicate transaction name.", "warning");
      } else {
        showToast("Failed to create transaction.", "error");
      }
    }
  };

  return (
    <Box px={2} py={4}>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" onClick={() => setOpenAdd(true)}>
          Add New Recurring Transaction
        </Button>
      </Box>
      {/* 🔍 Search Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth size="small" label="Name" name="recurringTransactionName"
              value={filters.recurringTransactionName || ''} onChange={handleInputChange(setFilters)}
            />
          </Grid>
          <Grid item xs={6} md={1.5}>
            <TextField
              fullWidth size="small" type="number" label="Min ₹" name="minAmount"
              value={filters.minAmount || ''} onChange={handleInputChange(setFilters)}
            />
          </Grid>
          <Grid item xs={6} md={1.5}>
            <TextField
              fullWidth size="small" type="number" label="Max ₹" name="maxAmount"
              value={filters.maxAmount || ''} onChange={handleInputChange(setFilters)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth size="small" label="Category" name="category"
              value={filters.category || ''} onChange={handleInputChange(setFilters)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <ToggleButtonGroup
              exclusive size="small" fullWidth
              value={filters.transactionType || ''}
              onChange={(e, val) => setFilters(prev => ({ ...prev, transactionType: val || '' }))}
            >
              <ToggleButton value="">All</ToggleButton>
              <ToggleButton value="INCOME">Income</ToggleButton>
              <ToggleButton value="EXPENSE">Expense</ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ minWidth: 120 }} variant="outlined">
                <InputLabel id="frequency-label">Frequency</InputLabel>
                <Select
                  labelId="frequency-label"
                  name="frequency"
                  value={filters.frequency || ''}
                  onChange={handleInputChange(setFilters)}
                  label="Frequency"
                >
                  {/* <MenuItem value=""><em>Any</em></MenuItem> */}
                  <MenuItem value="DAILY">Daily</MenuItem>
                  <MenuItem value="WEEKLY">Weekly</MenuItem>
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                  <MenuItem value="YEARLY">Yearly</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }} variant="outlined">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="isActive"
                  value={filters.isActive || ''}
                  onChange={handleInputChange(setFilters)}
                  label="Status"
                >
                  {/* <MenuItem value=""><em>Any</em></MenuItem> */}
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6} display="flex" justifyContent="flex-end" gap={1}>
            <Button startIcon={<SearchIcon />} variant="contained" onClick={() => { setPage(0); setIsSearchMode(true); }}>
              Search
            </Button>
            <Button startIcon={<RestartAltIcon />} variant="outlined" onClick={() => {
              setFilters({ ...DEFAULT_FILTERS });
              setIsSearchMode(false);
              setPage(0);
            }}>
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {/* Table */}
      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: 'grey.100' }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Amount</TableCell>
              {!isMobile && <TableCell>Category</TableCell>}
              {!isMobile && <TableCell>Type</TableCell>}
              {!isMobile && <TableCell>Frequency</TableCell>}
              {!isMobile && <TableCell>Start</TableCell>}
              {!isMobile && <TableCell>End</TableCell>}
              <TableCell>Next</TableCell>
              {!isMobile && <TableCell>Active</TableCell>}
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map(t => (
                <TableRow key={t.recurringTransactionId} hover sx={{ '&:nth-of-type(odd)': { backgroundColor: 'grey.50' } }}>
                  <TableCell>{t.recurringTransactionName}</TableCell>
                  <TableCell>{t.amount}</TableCell>
                  {!isMobile && <TableCell>{t.category}</TableCell>}
                  {!isMobile && <TableCell>{t.transactionType}</TableCell>}
                  {!isMobile && <TableCell>{t.frequency}</TableCell>}
                  {!isMobile && <TableCell>{t.startDate}</TableCell>}
                  {!isMobile && <TableCell>{t.endDate}</TableCell>}
                  <TableCell>{t.nextOccurence || '-'}</TableCell>
                  {!isMobile && <TableCell>{t.isActive ? 'Yes' : 'No'}</TableCell>}
                  <TableCell align="center">
                    <IconButton onClick={() => { setEditTransaction(t); setOpenEdit(true); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => { setDeleteTransactionId(t.recurringTransactionId); setConfirmOpen(true); }}>
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center">No recurring transactions found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
        <FormControl size="small">
          <InputLabel>Rows</InputLabel>
          <Select
            value={size}
            label="Rows"
            onChange={(e) => {
              setSize(parseInt(e.target.value));
              setPage(0);
            }}
          >
            {[5, 10, 25].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <Button disabled={page === 0} onClick={() => setPage(prev => Math.max(prev - 1, 0))}>Previous</Button>
          <Box component="span" mx={2}>
            Page {page + 1} of {totalPages}
          </Box>
          <Button disabled={page + 1 >= totalPages} onClick={() => setPage(prev => prev + 1)}>Next</Button>
        </Box>
      </Box>

      {/* Edit and Delete Dialogs (unchanged) */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Recurring Transaction</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField
              fullWidth label="Name" name="recurringTransactionName"
              value={editTransaction.recurringTransactionName}
              onChange={handleInputChange(setEditTransaction)}
            />
            <TextField
              fullWidth type="number" label="Amount" name="amount"
              value={editTransaction.amount}
              onChange={handleInputChange(setEditTransaction)}
            />
            <TextField
              fullWidth label="Description" name="description"
              value={editTransaction.description}
              onChange={handleInputChange(setEditTransaction)}
            />
            <TextField
              fullWidth label="Category" name="category"
              value={editTransaction.category}
              onChange={handleInputChange(setEditTransaction)}
            />
            <FormControl fullWidth>
              <InputLabel>Transaction Type</InputLabel>
              <Select
                name="transactionType"
                value={editTransaction.transactionType}
                label="Transaction Type"
                onChange={handleInputChange(setEditTransaction)}
              >
                <MenuItem value="INCOME">Income</MenuItem>
                <MenuItem value="EXPENSE">Expense</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                name="frequency"
                value={editTransaction.frequency}
                label="Frequency"
                onChange={handleInputChange(setEditTransaction)}
              >
                <MenuItem value="DAILY">Daily</MenuItem>
                <MenuItem value="WEEKLY">Weekly</MenuItem>
                <MenuItem value="MONTHLY">Monthly</MenuItem>
                <MenuItem value="YEARLY">Yearly</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth type="date" label="Start Date" name="startDate"
              InputLabelProps={{ shrink: true }}
              value={editTransaction.startDate}
              onChange={handleInputChange(setEditTransaction)}
            />
            <TextField
              fullWidth type="date" label="End Date" name="endDate"
              InputLabelProps={{ shrink: true }}
              value={editTransaction.endDate}
              onChange={handleInputChange(setEditTransaction)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditTransaction}>Update</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent dividers>
          Are you sure you want to delete this recurring transaction?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteTransaction}>Delete</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Recurring Transaction</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField
              fullWidth label="Name" name="recurringTransactionName"
              value={newTransaction.recurringTransactionName}
              onChange={handleInputChange(setNewTransaction)}
            />
            <TextField
              fullWidth type="number" label="Amount" name="amount"
              value={newTransaction.amount}
              onChange={handleInputChange(setNewTransaction)}
            />
            <TextField
              fullWidth label="Description" name="description"
              value={newTransaction.description}
              onChange={handleInputChange(setNewTransaction)}
            />
            <TextField
              fullWidth label="Category" name="category"
              value={newTransaction.category}
              onChange={handleInputChange(setNewTransaction)}
            />
            <FormControl fullWidth>
              <InputLabel>Transaction Type</InputLabel>
              <Select
                name="transactionType"
                value={newTransaction.transactionType}
                label="Transaction Type"
                onChange={handleInputChange(setNewTransaction)}
              >
                <MenuItem value="INCOME">Income</MenuItem>
                <MenuItem value="EXPENSE">Expense</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                name="frequency"
                value={newTransaction.frequency}
                label="Frequency"
                onChange={handleInputChange(setNewTransaction)}
              >
                <MenuItem value="DAILY">Daily</MenuItem>
                <MenuItem value="WEEKLY">Weekly</MenuItem>
                <MenuItem value="MONTHLY">Monthly</MenuItem>
                <MenuItem value="YEARLY">Yearly</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth type="date" label="Start Date" name="startDate"
              InputLabelProps={{ shrink: true }}
              value={newTransaction.startDate}
              onChange={handleInputChange(setNewTransaction)}
            />
            <TextField
              fullWidth type="date" label="End Date" name="endDate"
              InputLabelProps={{ shrink: true }}
              value={newTransaction.endDate}
              onChange={handleInputChange(setNewTransaction)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTransaction}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
