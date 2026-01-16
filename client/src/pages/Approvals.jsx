import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuotes, approveQuote, rejectQuote } from '../services/quoteService';
import { formatCurrency, formatPercent } from '../utils/calculations';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Visibility as ViewIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';

const Approvals = () => {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [dialogType, setDialogType] = useState(null);
    const [comments, setComments] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadPendingQuotes();
    }, []);

    const loadPendingQuotes = async () => {
        try {
            setLoading(true);
            const response = await getQuotes({ status: 'pending', limit: 50 });
            setQuotes(response.data.quotes);
        } catch (error) {
            console.error('Failed to load pending quotes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        try {
            setActionLoading(true);
            if (dialogType === 'approve') {
                await approveQuote(selectedQuote.id, comments);
            } else {
                await rejectQuote(selectedQuote.id, comments);
            }
            setDialogType(null);
            setSelectedQuote(null);
            setComments('');
            loadPendingQuotes();
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const openDialog = (quote, type) => {
        setSelectedQuote(quote);
        setDialogType(type);
    };

    if (loading) return <LinearProgress />;

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Pending Approvals
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Review and approve quotes that require attention.
            </Typography>

            {quotes.length === 0 ? (
                <Card>
                    <CardContent sx={{ py: 8, textAlign: 'center' }}>
                        <Typography color="text.secondary">No quotes pending approval.</Typography>
                    </CardContent>
                </Card>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {quotes.map((quote) => (
                        <Card key={quote.id}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                            <Typography variant="h6" fontWeight={600}>
                                                {quote.quoteNumber}
                                            </Typography>
                                            {quote.overallGmPercent < 0.05 && (
                                                <Chip
                                                    icon={<WarningIcon />}
                                                    label="Critical Margin"
                                                    color="error"
                                                    size="small"
                                                />
                                            )}
                                            {quote.overallGmPercent >= 0.05 && quote.overallGmPercent < 0.08 && (
                                                <Chip
                                                    icon={<WarningIcon />}
                                                    label="Low Margin"
                                                    color="warning"
                                                    size="small"
                                                />
                                            )}
                                        </Box>
                                        <Typography variant="body1">{quote.clientName}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            By {quote.creator?.name} • {new Date(quote.quoteDate).toLocaleDateString()}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="h5" fontWeight={600}>
                                            {formatCurrency(quote.totalSellingIncVat)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            GM: {formatPercent(quote.overallGmPercent)}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            variant="outlined"
                                            startIcon={<ViewIcon />}
                                            onClick={() => navigate(`/quotes/${quote.id}`)}
                                        >
                                            View
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            startIcon={<ApproveIcon />}
                                            onClick={() => openDialog(quote, 'approve')}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<RejectIcon />}
                                            onClick={() => openDialog(quote, 'reject')}
                                        >
                                            Reject
                                        </Button>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {/* Approval/Rejection Dialog */}
            <Dialog open={Boolean(dialogType)} onClose={() => setDialogType(null)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {dialogType === 'approve' ? 'Approve Quote' : 'Reject Quote'}
                </DialogTitle>
                <DialogContent>
                    {selectedQuote && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Quote: {selectedQuote.quoteNumber}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Client: {selectedQuote.clientName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Amount: {formatCurrency(selectedQuote.totalSellingIncVat)}
                            </Typography>
                        </Box>
                    )}
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label={`Comments ${dialogType === 'reject' ? '(recommended)' : '(optional)'}`}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogType(null)}>Cancel</Button>
                    <Button
                        onClick={handleAction}
                        color={dialogType === 'approve' ? 'success' : 'error'}
                        variant="contained"
                        disabled={actionLoading}
                    >
                        {dialogType === 'approve' ? 'Approve' : 'Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Approvals;
