import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getQuotes, getFxRates } from '../services/quoteService';
import { formatCurrency } from '../utils/calculations';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    LinearProgress,
    Alert,
} from '@mui/material';
import {
    Description as QuoteIcon,
    Add as AddIcon,
    Pending as PendingIcon,
    CheckCircle as ApprovedIcon,
    TrendingUp as TrendingIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';

const Dashboard = () => {
    const [stats, setStats] = useState({
        total: 0,
        draft: 0,
        pending: 0,
        approved: 0,
        totalRevenue: 0,
    });
    const [recentQuotes, setRecentQuotes] = useState([]);
    const [staleRates, setStaleRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, canCreateQuotes, isApprover } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Load quotes
            const quotesResponse = await getQuotes({ limit: 50 });
            const quotes = quotesResponse.data.quotes;

            // Calculate stats
            const draft = quotes.filter(q => q.status === 'draft').length;
            const pending = quotes.filter(q => q.status === 'pending').length;
            const approved = quotes.filter(q => q.status === 'approved').length;
            const totalRevenue = quotes
                .filter(q => q.status === 'approved')
                .reduce((sum, q) => sum + parseFloat(q.totalSellingIncVat || 0), 0);

            setStats({
                total: quotes.length,
                draft,
                pending,
                approved,
                totalRevenue,
            });

            // Get recent quotes
            setRecentQuotes(quotes.slice(0, 5));

            // Check FX rates
            const fxResponse = await getFxRates();
            const stale = fxResponse.data.filter(r => r.isStale);
            setStaleRates(stale);

        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'error';
            default: return 'default';
        }
    };

    if (loading) {
        return <LinearProgress />;
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        Welcome back, {user?.name?.split(' ')[0]}!
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Here's what's happening with your quotes today.
                    </Typography>
                </Box>
                {canCreateQuotes && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/quotes/new')}
                        size="large"
                    >
                        New Quote
                    </Button>
                )}
            </Box>

            {/* Stale FX Alert */}
            {staleRates.length > 0 && (
                <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
                    <strong>FX Rate Warning:</strong> {staleRates.length} currency rate(s) are outdated ({staleRates.map(r => r.currency).join(', ')}).
                    {user?.role === 'admin' && (
                        <Button size="small" onClick={() => navigate('/admin')} sx={{ ml: 2 }}>
                            Update Rates
                        </Button>
                    )}
                </Alert>
            )}

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card className="hover-lift stat-card-purple">
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box className="icon-container">
                                    <QuoteIcon />
                                </Box>
                                <Box>
                                    <Typography variant="h4" fontWeight={800}>{stats.total}</Typography>
                                    <Typography variant="body2" color="text.secondary">Total Quotes</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card className="hover-lift stat-card-coral">
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box className="icon-container coral">
                                    <PendingIcon />
                                </Box>
                                <Box>
                                    <Typography variant="h4" fontWeight={800}>{stats.pending}</Typography>
                                    <Typography variant="body2" color="text.secondary">Pending Approval</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card className="hover-lift stat-card-green">
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box className="icon-container green">
                                    <ApprovedIcon />
                                </Box>
                                <Box>
                                    <Typography variant="h4" fontWeight={800}>{stats.approved}</Typography>
                                    <Typography variant="body2" color="text.secondary">Approved</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card className="hover-lift stat-card-teal">
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box className="icon-container teal">
                                    <TrendingIcon />
                                </Box>
                                <Box>
                                    <Typography variant="h5" fontWeight={800}>
                                        {formatCurrency(stats.totalRevenue)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">Approved Value</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Recent Quotes */}
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight={600}>Recent Quotes</Typography>
                        <Button onClick={() => navigate('/quotes')}>View All</Button>
                    </Box>

                    {recentQuotes.length === 0 ? (
                        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                            No quotes yet. {canCreateQuotes && 'Create your first quote to get started!'}
                        </Typography>
                    ) : (
                        <Box>
                            {recentQuotes.map((quote) => (
                                <Box
                                    key={quote.id}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        py: 2,
                                        borderBottom: 1,
                                        borderColor: 'divider',
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'action.hover' },
                                        '&:last-child': { borderBottom: 0 },
                                    }}
                                    onClick={() => navigate(`/quotes/${quote.id}`)}
                                >
                                    <Box sx={{ flex: 1 }}>
                                        <Typography fontWeight={500}>{quote.quoteNumber}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {quote.clientName}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right', mr: 2 }}>
                                        <Typography fontWeight={500}>
                                            {formatCurrency(quote.totalSellingIncVat)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {new Date(quote.quoteDate).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={quote.status}
                                        size="small"
                                        color={getStatusColor(quote.status)}
                                    />
                                </Box>
                            ))}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions for Approvers */}
            {isApprover && stats.pending > 0 && (
                <Card sx={{ mt: 3, bgcolor: (theme) => theme.palette.mode === 'light' ? 'warning.50' : 'rgba(237, 137, 54, 0.1)' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <PendingIcon color="warning" />
                                <Typography>
                                    You have <strong>{stats.pending}</strong> quote(s) waiting for approval.
                                </Typography>
                            </Box>
                            <Button variant="contained" color="warning" onClick={() => navigate('/approvals')}>
                                Review Now
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default Dashboard;
