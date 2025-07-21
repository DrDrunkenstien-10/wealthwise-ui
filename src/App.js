import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Transaction from './pages/Transaction';
import Dashboard from "./pages/Dashboard";
import RecurringTransaction from "./pages/RecurringTransaction";
import TransactionDetail from './pages/TransactionDetail';

const NotFound = () => {
  return <h2>404 - Page Not Found</h2>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="transactions" element={<Transaction />} />
          <Route path="recurring" element={<RecurringTransaction />} />
          <Route path="/transactions/:id" element={<TransactionDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;