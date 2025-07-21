import React, { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Box,
    Grid,
    Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from "../api/axiosInstance";

const TransactionDetail = () => {
    const { id: transactionId } = useParams();
    const navigate = useNavigate();

    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [receiptUrl, setReceiptUrl] = useState(null);
    const [receiptType, setReceiptType] = useState('');
    const [receiptError, setReceiptError] = useState('');

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const txRes = await axiosInstance.get(`http://localhost:5000/api/v1/transactions/${transactionId}`);
                setTransaction(txRes.data);
            } catch (err) {
                setError("Failed to load transaction.");
            } finally {
                setLoading(false);
            }
        };

        const fetchReceipt = async () => {
            try {
                const res = await axiosInstance.get(
                    `http://localhost:5000/api/v1/receipt/view/${transactionId}`,
                    { responseType: 'blob' }
                );

                const contentType = res.headers['content-type'];
                setReceiptType(contentType);
                const url = URL.createObjectURL(res.data);
                setReceiptUrl(url);
            } catch (err) {
                console.warn("No receipt found or failed to load receipt.");
                setReceiptError("No receipt found for this transaction.");
            }
        };

        fetchTransaction();
        fetchReceipt();
    }, [transactionId]);

    const handleDownload = () => {
        window.open(`http://localhost:5000/api/v1/receipt/download/${transactionId}`, '_blank');
    };

    const handleBack = () => navigate(-1);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box m={4}>
                <Alert severity="error">{error}</Alert>
                <Box mt={2}>
                    <Button variant="contained" onClick={handleBack}>Back</Button>
                </Box>
            </Box>
        );
    }

    return (
        <Box p={2}>
            <Button variant="outlined" onClick={handleBack} sx={{ mb: 3 }}>
                Back
            </Button>

            {/* Transaction Card */}
            <Card elevation={3}>
                <CardContent sx={{ bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Transaction Details
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Name</Typography>
                            <Typography variant="subtitle1" gutterBottom>{transaction.name}</Typography>

                            <Typography variant="body2" color="text.secondary">Description</Typography>
                            <Typography variant="subtitle1" gutterBottom>{transaction.description}</Typography>

                            <Typography variant="body2" color="text.secondary">Amount</Typography>
                            <Typography variant="subtitle1" gutterBottom>₹{transaction.amount}</Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Category</Typography>
                            <Typography variant="subtitle1" gutterBottom>{transaction.category}</Typography>

                            <Typography variant="body2" color="text.secondary">Payment Type</Typography>
                            <Typography variant="subtitle1" gutterBottom>{transaction.paymentType}</Typography>

                            <Typography variant="body2" color="text.secondary">Date</Typography>
                            <Typography variant="subtitle1" gutterBottom>
                                {new Date(transaction.date).toLocaleString()}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">Type</Typography>
                            <Typography variant="subtitle1" gutterBottom>{transaction.transactionType}</Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Receipt Preview */}
            <Box mt={5}>
                <Typography variant="h6" gutterBottom>
                    Receipt Preview
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {receiptUrl && receiptType.includes('pdf') ? (
                    <Box sx={{ width: '100%', height: { xs: 300, sm: 500 } }}>
                        <iframe
                            src={receiptUrl}
                            title="Receipt PDF"
                            width="100%"
                            height="100%"
                            style={{ border: '1px solid #ccc', borderRadius: '8px' }}
                        />
                    </Box>
                ) : receiptType.includes('image') ? (
                    <Box sx={{ textAlign: 'center' }}>
                        <img
                            src={receiptUrl}
                            alt="Receipt"
                            style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #ccc' }}
                        />
                    </Box>
                ) : receiptError ? (
                    <Alert severity="info">{receiptError}</Alert>
                ) : (
                    <Alert severity="warning">No preview available for this receipt.</Alert>
                )}

                <Box mt={2}>
                    <Button
                        variant="contained"
                        onClick={handleDownload}
                        disabled={!receiptUrl}
                    >
                        Download Receipt
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default TransactionDetail;
