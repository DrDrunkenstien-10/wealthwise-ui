import axiosInstance from "../api/axiosInstance";
import { useEffect, useState, useCallback } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack,
  Select, MenuItem, InputLabel, FormControl, Switch, FormControlLabel, Grid,
  ToggleButton, ToggleButtonGroup
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useToast } from '../components/Layout';
import { useNavigate } from "react-router-dom";
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useTheme, useMediaQuery } from '@mui/material';

const DEFAULT_TRANSACTION = {
  name: '',
  description: '',
  amount: '',
  category: '',
  paymentType: '',
  date: '',
  transactionType: '',
};

export default function Transaction() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState(DEFAULT_TRANSACTION);
  const [isRecurring, setIsRecurring] = useState(false);
  const [editTransaction, setEditTransaction] = useState(DEFAULT_TRANSACTION);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTransactionId, setDeleteTransactionId] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const navigate = useNavigate();
  const [recurringFields, setRecurringFields] = useState({
    frequency: '',
    startDate: '',
    endDate: ''
  });
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    transactionName: '',
    minAmount: '',
    maxAmount: '',
    category: '',
    paymentType: '',
    transactionType: '',
    date: '',
    dateInput: ''
  });
  const [isSearchMode, setIsSearchMode] = useState(false);

  const showToast = useToast();

  const buildSearchQuery = useCallback(() => {
    const params = {
      ...filters,
      page,
      size,
      sortBy: "amount",
      direction: "desc"
    };

    Object.keys(params).forEach(
      (key) => (params[key] === '' || params[key] == null) && delete params[key]
    );

    return params;
  }, [filters, page, size]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        let response;
        if (isSearchMode) {
          response = await axiosInstance.get(`http://localhost:5000/api/v1/transactions/search`, {
            params: buildSearchQuery()
          });
        } else {
          response = await axiosInstance.get(`http://localhost:5000/api/v1/transactions`, {
            params: { page, size }
          });
        }

        setTransactions(response.data.content);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        showToast("Unable to load transactions.", "error");
      }
    };

    fetchTransactions();
  }, [page, size, filters, isSearchMode, showToast, buildSearchQuery]);


  const handleInputChange = (setter) => (e) => {
    setter(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddTransaction = async () => {
    try {
      if (isRecurring) {
        const recurringPayload = {
          recurringTransactionName: newTransaction.name,
          description: newTransaction.description,
          amount: parseFloat(newTransaction.amount),
          category: newTransaction.category,
          paymentType: newTransaction.paymentType,
          transactionType: newTransaction.transactionType,
          frequency: recurringFields.frequency,
          startDate: recurringFields.startDate,
          endDate: recurringFields.endDate,
          nextOccurrence: null
        };

        await axiosInstance.post("http://localhost:5000/api/v1/recurring-transactions", recurringPayload);
        showToast("Recurring transaction created!", "success");
      } else {
        // Step 1: Create transaction
        const payload = { ...newTransaction, amount: parseFloat(newTransaction.amount) };
        const txnResponse = await axiosInstance.post("http://localhost:5000/api/v1/transactions", payload);
        const createdTransaction = txnResponse.data;

        // Step 2: Upload receipt if file is present
        if (receiptFile) {
          const formData = new FormData();
          formData.append("receipt", receiptFile);
          formData.append(
            "metadata",
            new Blob([JSON.stringify({
              transactionId: createdTransaction.transactionId
            })], { type: "application/json" })
          );

          await axiosInstance.post("http://localhost:5000/api/v1/receipt", formData, {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          });

          showToast("Transaction and receipt uploaded successfully!", "success");
        } else {
          showToast("Transaction added successfully!", "success");
        }

        // Add transaction to UI
        setTransactions(prev => [...prev, createdTransaction]);
        setReceiptFile(null);
      }

      // Reset state
      setNewTransaction(DEFAULT_TRANSACTION);
      setRecurringFields({ frequency: '', startDate: '', endDate: '' });
      setIsRecurring(false);
      setOpenAdd(false);
    } catch (err) {
      console.error("Creation failed:", err);

      if (err.response && err.response.status === 409) {
        // Duplicate transaction detected
        const backendMessage = err.response.data?.message || "Duplicate transaction.";
        showToast(backendMessage, "warning");
      } else {
        showToast("Failed to create transaction.", "error");
      }
    }
  };

  const handleEditTransaction = async () => {
    try {
      const payload = { ...editTransaction, amount: parseFloat(editTransaction.amount) };
      const response = await axiosInstance.patch(`http://localhost:5000/api/v1/transactions/${editTransaction.transactionId}`, payload);
      setTransactions(prev => prev.map(t => t.transactionId === editTransaction.transactionId ? response.data : t));
      setOpenEdit(false);
      showToast("Transaction updated successfully!", "success");
    } catch (err) {
      console.error("Edit failed:", err);
      showToast("Failed to update transaction.", "error");
    }
  };

  const handleDeleteTransaction = async () => {
    try {
      await axiosInstance.delete(`http://localhost:5000/api/v1/transactions/${deleteTransactionId}`);
      setTransactions(prev => prev.filter(t => t.transactionId !== deleteTransactionId));
      setConfirmOpen(false);
      showToast("Transaction deleted successfully!", "success");
    } catch (err) {
      console.error("Delete failed:", err);
      showToast("Failed to delete transaction.", "error");
    }
  };

  const renderTransactionFields = (transaction, onChange, isEdit = false) => (
    <Stack spacing={2} mt={1}>
      {!isEdit && (
        <FormControl fullWidth>
          <InputLabel>Transaction Type</InputLabel>
          <Select
            name="transactionType"
            value={transaction.transactionType}
            onChange={onChange}
            label="Transaction Type"
          >
            <MenuItem value=""><em>Select type...</em></MenuItem>
            <MenuItem value="INCOME">Income</MenuItem>
            <MenuItem value="EXPENSE">Expense</MenuItem>
          </Select>
        </FormControl>
      )}

      <TextField fullWidth name="name" label="Name" value={transaction.name} onChange={onChange} />
      <TextField fullWidth name="description" label="Description" value={transaction.description} onChange={onChange} />
      <TextField fullWidth name="amount" label="Amount" type="number" value={transaction.amount} onChange={onChange} />
      <TextField fullWidth name="category" label="Category" value={transaction.category} onChange={onChange} />
      <TextField fullWidth name="paymentType" label="Payment Type" value={transaction.paymentType} onChange={onChange} />

      {!isEdit && (
        <FormControlLabel
          control={<Switch checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />}
          label="Is Recurring?"
        />
      )}

      {!isEdit && isRecurring ? (
        <>
          <FormControl fullWidth>
            <InputLabel>Frequency</InputLabel>
            <Select
              name="frequency"
              value={recurringFields.frequency}
              onChange={(e) => setRecurringFields(prev => ({ ...prev, frequency: e.target.value }))}
              label="Frequency"
            >
              <MenuItem value="DAILY">Daily</MenuItem>
              <MenuItem value="WEEKLY">Weekly</MenuItem>
              <MenuItem value="MONTHLY">Monthly</MenuItem>
              <MenuItem value="YEARLY">Yearly</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            name="startDate"
            label="Start Date"
            type="date"
            value={recurringFields.startDate}
            onChange={(e) => setRecurringFields(prev => ({ ...prev, startDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            name="endDate"
            label="End Date"
            type="date"
            value={recurringFields.endDate}
            onChange={(e) => setRecurringFields(prev => ({ ...prev, endDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </>
      ) : (
        <>
          <TextField
            fullWidth
            name="date"
            label="Date"
            type="datetime-local"
            value={transaction.date}
            onChange={onChange}
            InputLabelProps={{ shrink: true }}
            disabled={isRecurring}
          />

          {/* Show upload field only in create mode and only if not recurring */}
          {!isEdit && !isRecurring && (
            <>
              <TextField
                fullWidth
                type="file"
                inputProps={{ accept: 'image/*,application/pdf' }}
                onChange={(e) => setReceiptFile(e.target.files[0])}
                label="Upload Receipt"
                InputLabelProps={{ shrink: true }}
              />
              {receiptFile && (
                <Box fontSize="0.875rem" color="text.secondary">
                  Selected file: {receiptFile.name}
                </Box>
              )}
            </>
          )}
        </>
      )}
    </Stack>
  );

  return (
    <Box px={2} py={4}>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAdd(true)}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          New Transaction
        </Button>
      </Box>
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={{ xs: 1, md: 2 }} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Transaction Name"
              name="transactionName"
              size="small"
              value={filters.transactionName}
              onChange={handleInputChange(setFilters)}
            />
          </Grid>

          <Grid item xs={6} md={1.5}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Min ₹"
              name="minAmount"
              value={filters.minAmount}
              onChange={handleInputChange(setFilters)}
            />
          </Grid>

          <Grid item xs={6} md={1.5}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Max ₹"
              name="maxAmount"
              value={filters.maxAmount}
              onChange={handleInputChange(setFilters)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Category"
              name="category"
              size="small"
              value={filters.category}
              onChange={handleInputChange(setFilters)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Payment Type"
              name="paymentType"
              size="small"
              value={filters.paymentType}
              onChange={handleInputChange(setFilters)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <ToggleButtonGroup
              exclusive
              size="small"
              fullWidth
              value={filters.transactionType}
              onChange={(e, val) => setFilters(prev => ({ ...prev, transactionType: val }))}
              aria-label="Transaction Type"
              color="primary"
            >
              <ToggleButton value="">All</ToggleButton>
              <ToggleButton value="INCOME">Income</ToggleButton>
              <ToggleButton value="EXPENSE">Expense</ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Date"
              name="dateInput"
              value={filters.dateInput}
              onChange={(e) => {
                const raw = e.target.value; // e.g., 2025-07-03
                const formatted = raw ? `${raw}T00:00:00` : '';
                setFilters(prev => ({ ...prev, dateInput: raw, date: formatted }));
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
            display="flex"
            justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
            gap={1}
            flexWrap="wrap"
          >
            <Button
              startIcon={<SearchIcon />}
              variant="contained"
              onClick={() => {
                setPage(0);
                setIsSearchMode(true);
              }}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Search
            </Button>
            <Button
              startIcon={<RestartAltIcon />}
              variant="outlined"
              onClick={() => {
                setFilters({
                  transactionName: '',
                  minAmount: '',
                  maxAmount: '',
                  category: '',
                  paymentType: '',
                  transactionType: '',
                  date: ''
                });
                setIsSearchMode(false);
                setPage(0);
              }}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflowX: 'auto', }}>
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: 'grey.100' }}>
            <TableRow>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Txn ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Category</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Payment</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <TableRow
                  key={t.transactionId}
                  hover
                  sx={{ '&:nth-of-type(odd)': { backgroundColor: 'grey.50' }, cursor: 'pointer' }}
                  onClick={() => navigate(`/transactions/${t.transactionId}`)}
                >
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t.transactionId}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t.description}</TableCell>
                  <TableCell align="right">{t.amount}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t.category}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t.paymentType}</TableCell>
                  <TableCell>{t.transactionType}</TableCell>
                  <TableCell>{t.date}</TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <IconButton onClick={() => { setEditTransaction(t); setOpenEdit(true); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => { setDeleteTransactionId(t.transactionId); setConfirmOpen(true); }}>
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">No transactions found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems="center"
        mt={2}
        gap={2}
      >
        <FormControl size="small">
          <InputLabel>Rows</InputLabel>
          <Select
            value={size}
            label="Rows"
            onChange={(e) => {
              setSize(parseInt(e.target.value));
              setPage(0); // reset to first page on page size change
            }}
          >
            {[5, 10, 25].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <Button
            disabled={page === 0}
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Previous
          </Button>
          <Box component="span" mx={2}>Page {page + 1} of {totalPages}</Box>
          <Button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Next
          </Button>
        </Box>
      </Box>
      {/* Delete Confirmation */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent dividers>
          Are you sure you want to delete this transaction?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteTransaction}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullScreen={isMobile} scroll="paper">
        <DialogTitle>Add Transaction</DialogTitle>
        <DialogContent dividers>{renderTransactionFields(newTransaction, handleInputChange(setNewTransaction))}</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddTransaction}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullScreen={isMobile} scroll="paper">
        <DialogTitle>Edit Transaction</DialogTitle>
        <DialogContent dividers>{renderTransactionFields(editTransaction, handleInputChange(setEditTransaction), true)}</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditTransaction}>Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
