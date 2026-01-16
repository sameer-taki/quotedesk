import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuotes, deleteQuote } from '../services/quoteService';
import { formatCurrency } from '../utils/calculations';
import { useAuth } from '../context/AuthContext';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    InputAdornment,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Checkbox,
    Stack,
    Tooltip,
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    MoreVert as MoreIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    FilterList as FilterIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
} from '@mui/icons-material';

const QuoteList = () => {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [bulkAction, setBulkAction] = useState(null); // 'approve', 'reject', 'delete'
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const { canCreateQuotes, isAdmin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadQuotes();
    }, [statusFilter, pagination.page]);

    const loadQuotes = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: 20,
                ...(statusFilter && { status: statusFilter }),
                ...(search && { client: search }),
            };
            const response = await getQuotes(params);
            setQuotes(response.data.quotes);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Failed to load quotes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadQuotes();
    };

    const handleMenuOpen = (event, quote) => {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setSelectedQuote(quote);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedQuote(null);
    };

    const handleBulkAction = async (action) => {
        try {
            setActionLoading(true);
            const { approveQuote, rejectQuote } = await import('../services/quoteService');

            for (const id of selectedIds) {
                if (action === 'approve') await approveQuote(id, 'Bulk approved');
                if (action === 'reject') await rejectQuote(id, 'Bulk rejected');
                if (action === 'delete') await deleteQuote(id);
            }

            setSelectedIds([]);
            loadQuotes();
        } catch (error) {
            console.error(`Bulk ${action} failed:`, error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSelectToggle = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(quotes.map(q => q.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleExport = (type) => {
        const url = `/api/quotes/${selectedQuote.id}/export/${type}`;
        window.open(url, '_blank');
        handleMenuClose();
    };

    const handleDelete = async () => {
        try {
            setActionLoading(true);
            await deleteQuote(selectedQuote.id);
            setDeleteDialog(false);
            setSelectedQuote(null);
            loadQuotes();
        } catch (error) {
            console.error('Failed to delete quote:', error);
            alert(error.response?.data?.message || 'Failed to delete quote. You may not have permission.');
        } finally {
            setActionLoading(false);
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

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" fontWeight={700}>
                    Quotes
                </Typography>
                <Stack direction="row" spacing={2}>
                    {selectedIds.length > 0 && (
                        <Paper
                            elevation={3}
                            sx={{
                                px: 2, py: 0.5,
                                display: 'flex', alignItems: 'center',
                                gap: 2, bgcolor: 'primary.light',
                                color: 'primary.contrastText',
                                borderRadius: 2
                            }}
                        >
                            <Typography variant="subtitle2">{selectedIds.length} Selected</Typography>
                            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'white' }} />
                            <Tooltip title="Bulk Approve">
                                <IconButton size="small" color="inherit" onClick={() => handleBulkAction('approve')} disabled={actionLoading}>
                                    <ApproveIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Bulk Reject">
                                <IconButton size="small" color="inherit" onClick={() => handleBulkAction('reject')} disabled={actionLoading}>
                                    <RejectIcon />
                                </IconButton>
                            </Tooltip>
                            {(isAdmin) && (
                                <Tooltip title="Bulk Delete">
                                    <IconButton size="small" color="inherit" onClick={() => handleBulkAction('delete')} disabled={actionLoading}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Paper>
                    )}
                    {canCreateQuotes && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/quotes/new')}>
                            New Quote
                        </Button>
                    )}
                </Stack>
            </Box>

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <TextField
                            placeholder="Search by client..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            size="small"
                            sx={{ minWidth: 250 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="draft">Draft</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="approved">Approved</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                            </Select>
                        </FormControl>
                        <Button type="submit" variant="outlined" startIcon={<FilterIcon />}>
                            Filter
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Quote List */}
            <Card>
                {loading && <LinearProgress />}
                <CardContent sx={{ p: 0 }}>
                    {quotes.length === 0 ? (
                        <Box sx={{ py: 8, textAlign: 'center' }}>
                            <Typography color="text.secondary">
                                {search || statusFilter ? 'No quotes match your filters.' : 'No quotes yet.'}
                            </Typography>
                            {canCreateQuotes && !search && !statusFilter && (
                                <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/quotes/new')}>
                                    Create First Quote
                                </Button>
                            )}
                        </Box>
                    ) : (
                        <Box>
                            {/* Table Header */}
                            <Box sx={{ display: 'flex', px: 2, py: 1.5, bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'rgba(255, 255, 255, 0.05)', borderBottom: 1, borderColor: 'divider', alignItems: 'center' }}>
                                <Box sx={{ width: '50px' }}>
                                    <Checkbox
                                        size="small"
                                        checked={selectedIds.length === quotes.length && quotes.length > 0}
                                        indeterminate={selectedIds.length > 0 && selectedIds.length < quotes.length}
                                        onChange={handleSelectAll}
                                    />
                                </Box>
                                <Typography variant="body2" fontWeight={600} sx={{ width: '15%' }}>Quote #</Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ width: '25%' }}>Client</Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ width: '15%' }}>Date</Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ width: '15%', textAlign: 'right' }}>Amount</Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ width: '15%', textAlign: 'center' }}>Status</Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ width: '10%', textAlign: 'right' }}>Actions</Typography>
                            </Box>

                            {/* Quote Rows */}
                            {quotes.map((quote) => (
                                <Box
                                    key={quote.id}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        px: 2,
                                        py: 1.5,
                                        borderBottom: 1,
                                        borderColor: 'divider',
                                        '&:hover': { bgcolor: 'action.hover' },
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => navigate(`/quotes/${quote.id}`)}
                                >
                                    <Box sx={{ width: '50px' }} onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            size="small"
                                            checked={selectedIds.includes(quote.id)}
                                            onChange={() => handleSelectToggle(quote.id)}
                                        />
                                    </Box>
                                    <Typography sx={{ width: '15%', fontWeight: 500 }}>{quote.quoteNumber}</Typography>
                                    <Box sx={{ width: '25%' }}>
                                        <Typography noWrap>{quote.clientName}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            by {quote.creator?.name}
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ width: '15%' }} color="text.secondary">
                                        {new Date(quote.quoteDate).toLocaleDateString()}
                                    </Typography>
                                    <Typography sx={{ width: '15%', textAlign: 'right', fontWeight: 500 }}>
                                        {formatCurrency(quote.totalSellingIncVat)}
                                    </Typography>
                                    <Box sx={{ width: '15%', textAlign: 'center' }}>
                                        <Chip
                                            label={quote.status}
                                            size="small"
                                            color={getStatusColor(quote.status)}
                                        />
                                    </Box>
                                    <Box sx={{ width: '10%', textAlign: 'right' }}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuOpen(e, quote)}
                                        >
                                            <MoreIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Pagination Info */}
            {pagination.total > 0 && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Showing {quotes.length} of {pagination.total} quotes
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                        >
                            Previous
                        </Button>
                        <Button
                            disabled={pagination.page >= pagination.pages}
                            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                        >
                            Next
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Actions Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => { navigate(`/quotes/${selectedQuote?.id}`); handleMenuClose(); }}>
                    <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View
                </MenuItem>
                {selectedQuote?.status === 'draft' && canCreateQuotes && (
                    <MenuItem onClick={() => { navigate(`/quotes/${selectedQuote?.id}/edit`); handleMenuClose(); }}>
                        <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
                    </MenuItem>
                )}
                <MenuItem onClick={() => handleExport('pdf')}>
                    <PdfIcon fontSize="small" sx={{ mr: 1 }} /> Export PDF
                </MenuItem>
                <MenuItem onClick={() => handleExport('excel')}>
                    <ExcelIcon fontSize="small" sx={{ mr: 1 }} /> Export Excel
                </MenuItem>
                {(isAdmin || (selectedQuote?.status === 'draft' && canCreateQuotes)) && (
                    <MenuItem onClick={() => setDeleteDialog(true)} sx={{ color: 'error.main' }}>
                        <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
                    </MenuItem>
                )}
            </Menu>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
                <DialogTitle>Delete Quote?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete quote {selectedQuote?.quoteNumber}? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default QuoteList;
