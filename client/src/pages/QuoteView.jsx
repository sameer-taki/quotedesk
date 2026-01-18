import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { getQuote, submitQuote, approveQuote, rejectQuote, exportQuotePdf, exportQuoteExcel, generateVendorPOs } from '../services/quoteService';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { useAuth } from '../context/AuthContext';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    Divider,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tooltip,
    InputAdornment,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Edit as EditIcon,
    Send as SendIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    Link as LinkIcon,
    Visibility as ViewIcon,
    ShoppingCart as POIcon,
} from '@mui/icons-material';

const QuoteView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { canCreateQuotes, canApproveQuotes, user } = useAuth();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [approvalDialog, setApprovalDialog] = useState({ open: false, type: null });
    const [comments, setComments] = useState('');
    const [poData, setPoData] = useState([]);
    const [poDialogOpen, setPoDialogOpen] = useState(false);

    useEffect(() => {
        loadQuote();
    }, [id]);

    const handleGeneratePO = async () => {
        try {
            setActionLoading(true);
            const data = await generateVendorPOs(id);
            setPoData(data.purchaseOrders || []);
            setPoDialogOpen(true);
        } catch (err) {
            console.error(err);
            setError('Failed to generate POs');
        } finally {
            setActionLoading(false);
        }
    };

    const loadQuote = async () => {
        try {
            setLoading(true);
            const response = await getQuote(id);
            setQuote(response.data);
        } catch (err) {
            setError('Failed to load quote');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            setActionLoading(true);
            await submitQuote(id);
            await loadQuote();
        } catch (err) {
            setError('Failed to submit quote');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApproval = async () => {
        try {
            setActionLoading(true);
            if (approvalDialog.type === 'approve') {
                await approveQuote(id, comments);
            } else {
                await rejectQuote(id, comments);
            }
            setApprovalDialog({ open: false, type: null });
            setComments('');
            await loadQuote();
        } catch (err) {
            setError(`Failed to ${approvalDialog.type} quote`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleExport = async (type) => {
        try {
            setActionLoading(true);
            const data = type === 'pdf' ? await exportQuotePdf(id) : await exportQuoteExcel(id);

            // Create a blob URL and trigger download
            const blob = new Blob([data], {
                type: type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${quote.quoteNumber}.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(`Export to ${type} failed:`, err);
            setError(`Export to ${type} failed. Please try again.`);
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'error';
            case 'accepted': return 'info';
            default: return 'default';
        }
    };

    if (loading) return <LinearProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!quote) return <Alert severity="error">Quote not found</Alert>;

    const canEdit = canCreateQuotes && quote.status === 'draft';
    const canEditRejected = canCreateQuotes && quote.status === 'rejected';
    const canSubmit = canCreateQuotes && ['draft', 'rejected'].includes(quote.status) && quote.lines?.length > 0;
    const canApprove = canApproveQuotes && quote.status === 'pending';
    const canAmend = canCreateQuotes && ['approved', 'accepted'].includes(quote.status);

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Button startIcon={<BackIcon />} onClick={() => navigate('/quotes')} sx={{ mb: 1 }}>
                        Back to Quotes
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4" fontWeight={700}>
                            {quote.quoteNumber}
                        </Typography>
                        <Chip label={quote.status} color={getStatusColor(quote.status)} />
                        {quote.viewCount > 0 && (
                            <Tooltip title={`${quote.viewCount} total client views`}>
                                <Chip
                                    icon={<ViewIcon sx={{ fontSize: '1rem !important' }} />}
                                    label={quote.viewCount}
                                    size="small"
                                    variant="outlined"
                                />
                            </Tooltip>
                        )}
                    </Box>
                    <Typography color="text.secondary">
                        Created by {quote.creator?.name} on {new Date(quote.createdAt).toLocaleDateString()}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="outlined" startIcon={<PdfIcon />} onClick={() => handleExport('pdf')}>
                        PDF
                    </Button>
                    <Button variant="outlined" startIcon={<ExcelIcon />} onClick={() => handleExport('excel')}>
                        Excel
                    </Button>
                    {canEdit && (
                        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/quotes/${id}/edit`)}>
                            Edit
                        </Button>
                    )}
                    {canEditRejected && (
                        <Button
                            variant="outlined"
                            color="warning"
                            startIcon={<EditIcon />}
                            onClick={() => navigate(`/quotes/${id}/edit`)}
                        >
                            Edit & Resubmit
                        </Button>
                    )}
                    {canAmend && (
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => navigate(`/quotes/${id}/amend`)}
                        >
                            Create Amendment
                        </Button>
                    )}
                    {canSubmit && (
                        <Button
                            variant="contained"
                            startIcon={<SendIcon />}
                            onClick={handleSubmit}
                            disabled={actionLoading}
                        >
                            Submit for Approval
                        </Button>
                    )}
                    {canApprove && (
                        <>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<ApproveIcon />}
                                onClick={() => setApprovalDialog({ open: true, type: 'approve' })}
                                disabled={actionLoading}
                            >
                                Approve
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<RejectIcon />}
                                onClick={() => setApprovalDialog({ open: true, type: 'reject' })}
                                disabled={actionLoading}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                    {(canCreateQuotes || canApproveQuotes) && (quote.status === 'approved' || quote.status === 'accepted') && (
                        <Button
                            variant="outlined"
                            startIcon={<POIcon />}
                            onClick={handleGeneratePO}
                            disabled={actionLoading}
                        >
                            Generate POs
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Acceptance Info */}
            {
                quote.status === 'accepted' && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        <strong>Quote Accepted:</strong> This quote was accepted by {quote.acceptedBy} on {new Date(quote.acceptedAt).toLocaleString()}.
                    </Alert>
                )
            }

            {/* Approver Comments */}
            {
                quote.approverComments && (
                    <Alert
                        severity={quote.status === 'approved' || quote.status === 'accepted' ? 'success' : 'error'}
                        sx={{ mb: 3 }}
                    >
                        <strong>Approver Comment:</strong> {quote.approverComments}
                    </Alert>
                )
            }

            {/* Quote Details */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    {/* Client Info */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Quote Details
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Client</Typography>
                                    <Typography fontWeight={500}>{quote.clientName}</Typography>
                                </Grid>
                                <Grid item xs={3}>
                                    <Typography variant="body2" color="text.secondary">Quote Date</Typography>
                                    <Typography>{new Date(quote.quoteDate).toLocaleDateString()}</Typography>
                                </Grid>
                                <Grid item xs={3}>
                                    <Typography variant="body2" color="text.secondary">Valid Until</Typography>
                                    <Typography>{new Date(quote.validUntil).toLocaleDateString()}</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Portal Link */}
                    {(quote.status === 'approved' || quote.status === 'accepted') && (
                        <Card sx={{
                            mb: 3,
                            bgcolor: (theme) => theme.palette.mode === 'light' ? 'primary.light' : 'rgba(144, 205, 244, 0.1)',
                            color: (theme) => theme.palette.mode === 'light' ? 'primary.contrastText' : 'primary.main',
                            border: '1px solid',
                            borderColor: (theme) => theme.palette.mode === 'light' ? 'transparent' : 'primary.main'
                        }}>
                            <CardContent>
                                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Client Portal Link</Typography>
                                <Typography variant="body2" sx={{ mb: 2, opacity: theme => theme.palette.mode === 'light' ? 0.9 : 1 }}>
                                    Send this link to your client for interactive viewing and digital acceptance.
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={`${window.location.protocol}//${window.location.host}/p/${quote.publicId}`}
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Button
                                                    size="small"
                                                    variant={theme => theme.palette.mode === 'light' ? 'text' : 'outlined'}
                                                    sx={{ color: theme => theme.palette.mode === 'light' ? 'inherit' : 'primary.main' }}
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/p/${quote.publicId}`);
                                                    }}
                                                >
                                                    Copy
                                                </Button>
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            bgcolor: (theme) => theme.palette.mode === 'light' ? 'white' : 'rgba(255, 255, 255, 0.05)',
                                            '& input': {
                                                color: (theme) => theme.palette.mode === 'light' ? 'inherit' : 'primary.main',
                                                fontWeight: 500
                                            }
                                        }
                                    }}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Line Items */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Line Items
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>#</TableCell>
                                            <TableCell>Description</TableCell>
                                            <TableCell align="center">Qty</TableCell>
                                            <TableCell align="right">Unit Price</TableCell>
                                            <TableCell align="right">Total</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {quote.lines?.map((line, idx) => (
                                            <TableRow key={line.id}>
                                                <TableCell>{idx + 1}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{line.description}</Typography>
                                                    {line.partNumber && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {line.partNumber}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="center">{line.quantity}</TableCell>
                                                <TableCell align="right">{formatCurrency(line.unitSellExVat)}</TableCell>
                                                <TableCell align="right">{formatCurrency(line.lineTotalExVat)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Summary */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Summary
                            </Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography color="text.secondary">Subtotal (Ex VAT)</Typography>
                                <Typography>{formatCurrency(quote.totalSellingExVat)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography color="text.secondary">VAT (12.5%)</Typography>
                                <Typography>{formatCurrency(quote.totalVat)}</Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography fontWeight={600}>Total (Inc VAT)</Typography>
                                <Typography variant="h5" fontWeight={700} color="primary">
                                    {formatCurrency(quote.totalSellingIncVat)}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography color="text.secondary">Landed Cost</Typography>
                                <Typography>{formatCurrency(quote.totalLandedCost)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Overall GM%</Typography>
                                <Chip
                                    label={formatPercent(quote.overallGmPercent)}
                                    size="small"
                                    color={quote.overallGmPercent < 0.08 ? 'warning' : 'success'}
                                />
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    {quote.notes && (
                        <Card sx={{ mt: 3 }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Notes
                                </Typography>
                                <Typography variant="body2">{quote.notes}</Typography>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>

            {/* Approval Dialog */}
            <Dialog open={approvalDialog.open} onClose={() => setApprovalDialog({ open: false, type: null })}>
                <DialogTitle>
                    {approvalDialog.type === 'approve' ? 'Approve Quote' : 'Reject Quote'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Comments (optional)"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setApprovalDialog({ open: false, type: null })}>Cancel</Button>
                    <Button
                        onClick={handleApproval}
                        color={approvalDialog.type === 'approve' ? 'success' : 'error'}
                        variant="contained"
                        disabled={actionLoading}
                    >
                        {approvalDialog.type === 'approve' ? 'Approve' : 'Reject'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* PO Dialog */}
            <Dialog open={poDialogOpen} onClose={() => setPoDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Generated Vendor Purchase Orders</DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        These are draft POs based on the suppliers in this quote.
                    </Alert>
                    {poData.length === 0 ? (
                        <Typography>No POs generated. Ensure lines have suppliers assigned.</Typography>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {poData.map((po, index) => (
                                <Card key={index} variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>{po.supplier}</Typography>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Description</TableCell>
                                                        <TableCell>SKU</TableCell>
                                                        <TableCell align="right">Qty</TableCell>
                                                        <TableCell align="right">Cost</TableCell>
                                                        <TableCell align="right">Total</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {po.items.map((item, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell>{item.description}</TableCell>
                                                            <TableCell>{item.partNumber}</TableCell>
                                                            <TableCell align="right">{item.quantity}</TableCell>
                                                            <TableCell align="right">{formatCurrency(item.unitCost)}</TableCell>
                                                            <TableCell align="right">{formatCurrency(item.totalCost)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow>
                                                        <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Total:</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(po.totalCost)}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPoDialogOpen(false)}>Close</Button>
                    <Button variant="contained" onClick={() => window.print()}>Print</Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
};



export default QuoteView;
