import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SetupPassword from './pages/SetupPassword';
import ProtectedRoute from './components/ProtectedRoute';
import QuoteList from './pages/QuoteList';
import QuoteEditor from './pages/QuoteEditor';
import QuoteView from './pages/QuoteView';
import Approvals from './pages/Approvals';
import Customers from './pages/Customers';
import AdminPanel from './pages/AdminPanel';
import QuotePortal from './pages/QuotePortal';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

function App() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/setup-password/:token" element={<SetupPassword />} />
            <Route path="/quotes/public/:id" element={<QuotePortal />} />

            {/* Protected routes */}
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="quotes" element={<QuoteList />} />
                <Route path="quotes/new" element={
                    <ProtectedRoute roles={['admin', 'creator']}>
                        <QuoteEditor />
                    </ProtectedRoute>
                } />
                <Route path="quotes/:id" element={<QuoteView />} />
                <Route path="quotes/:id/edit" element={
                    <ProtectedRoute roles={['admin', 'creator']}>
                        <QuoteEditor />
                    </ProtectedRoute>
                } />
                <Route path="customers" element={<Customers />} />
                <Route path="approvals" element={
                    <ProtectedRoute roles={['admin']}>
                        <Approvals />
                    </ProtectedRoute>
                } />
                <Route path="admin" element={
                    <ProtectedRoute roles={['admin']}>
                        <AdminPanel />
                    </ProtectedRoute>
                } />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
