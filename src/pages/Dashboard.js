import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import SavingsIcon from '@mui/icons-material/Savings';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import axiosInstance from "../api/axiosInstance";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F"];

const Dashboard = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [summaryRes, categoryRes] = await Promise.all([
          axiosInstance.get("/dashboard/transaction-summary", {
            params: { month },
          }),
          axiosInstance.get("/chart/expense-summary-by-category", {
            params: { month },
          }),
        ]);

        setSummary(summaryRes.data);
        setCategoryData(categoryRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [month]);

  const handleMonthChange = (event) => {
    setMonth(event.target.value);
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        mb={4}
        gap={2}
      >
        <Typography variant="h4" sx={{ fontSize: { xs: '1.8rem', sm: '2.2rem' } }}>Dashboard</Typography>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Month</InputLabel>
          <Select value={month} label="Month" onChange={handleMonthChange}>
            {[...Array(12)].map((_, index) => {
              const m = dayjs().month(index).format("YYYY-MM");
              return (
                <MenuItem key={m} value={m}>
                  {dayjs(m).format("MMMM YYYY")}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={3} sx={{ backgroundColor: "#e3f2fd" }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <TrendingUpIcon fontSize="large" color="primary" />
                    <Box>
                      <Typography variant="subtitle1">Income</Typography>
                      <Typography variant="h5" fontWeight="bold">
                        ₹{summary?.income?.toLocaleString() || 0}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={3} sx={{ backgroundColor: "#ffebee" }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <TrendingDownIcon fontSize="large" color="error" />
                    <Box>
                      <Typography variant="subtitle1">Expenses</Typography>
                      <Typography variant="h5" fontWeight="bold">
                        ₹{summary.expenses.toLocaleString() || 0}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={12} md={4}>
              <Card elevation={3} sx={{ backgroundColor: "#e8f5e9" }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <SavingsIcon fontSize="large" color="success" />
                    <Box>
                      <Typography variant="subtitle1">Savings</Typography>
                      <Typography variant="h5" fontWeight="bold">
                        ₹{summary.savings.toLocaleString() || 0}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Pie Chart */}
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Expense Breakdown by Category
              </Typography>
              {categoryData.length === 0 ? (
                <Typography>No data available</Typography>
              ) : (
                <ResponsiveContainer width="100%" height={isSmallScreen ? 300 : 350}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={isSmallScreen ? 80 : 120}
                      label={false}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} />
                    <Legend layout={isSmallScreen ? "horizontal" : "vertical"} verticalAlign={isSmallScreen ? "bottom" : "middle"} align={isSmallScreen ? "center" : "right"} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Container>
  );
};

export default Dashboard;
