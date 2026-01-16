import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicQuote, acceptPublicQuote } from '../services/quoteService';
import { formatCurrency } from '../utils/calculations';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Container,
    Paper,
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
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    CheckCircle as AcceptIcon,
    PictureAsPdf as PdfIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';

const QuotePortal = () => {
    const { publicId } = useParams();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [acceptDialog, setAcceptDialog] = useState(false);
    const [signerName, setSignerName] = useState('');
    const [processing, setProcessing] = useState(false);
    const [accepted, setAccepted] = useState(false);

    useEffect(() => {
        loadQuote();
    }, [publicId]);

    const loadQuote = async () => {
        try {
            setLoading(true);
            const response = await getPublicQuote(publicId);
            setQuote(response.data);
            if (response.data.status === 'accepted') {
                setAccepted(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load quote details. Please check the link.');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!signerName.trim()) return;
        try {
            setProcessing(true);
            await acceptPublicQuote(publicId, signerName);
            setAccepted(true);
            setAcceptDialog(false);
            await loadQuote();
        } catch (err) {
            setError('Failed to accept quote. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <Box sx={{ mt: 10 }}><LinearProgress /><Container sx={{ mt: 4 }}><Typography align="center">Loading your secure quote...</Typography></Container></Box>;

    if (error) return (
        <Container maxWidth="sm" sx={{ mt: 10 }}>
            <Alert severity="error" variant="filled">{error}</Alert>
        </Container>
    );

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 4, md: 8 } }}>
            <Container maxWidth="lg">
                {/* Brand Header */}
                <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 2, color: 'primary.contrastText', display: 'flex' }}>
                            <BusinessIcon fontSize="large" />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">KASTEL TECHNOLOGIES</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>OFFICIAL QUOTATION PORTAL</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <Typography variant="h4" fontWeight={900} color="primary.main">{quote.quoteNumber}</Typography>
                        <Typography variant="body2" color="text.secondary">Valid until {new Date(quote.validUntil).toLocaleDateString()}</Typography>
                    </Box>
                </Box>

                {accepted && (
                    <Alert severity="success" variant="filled" sx={{ mb: 4, py: 2 }}>
                        <Typography variant="h6" fontWeight={700}>Quote Accepted</Typography>
                        This quote was digitally accepted by <strong>{quote.acceptedBy}</strong> on {new Date(quote.acceptedAt).toLocaleString()}.
                    </Alert>
                )}

                <Grid container spacing={4}>
                    {/* Main Content */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom>Quotation Details</Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={4} sx={{ mb: 4 }}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>PREPARED FOR</Typography>
                                    <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>{quote.clientName}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>PREPARED BY</Typography>
                                    <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>{quote.creator?.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">{quote.creator?.email}</Typography>
                                </Grid>
                            </Grid>

                            <TableContainer sx={{ mb: 4 }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'rgba(255, 255, 255, 0.05)' }}>
                                            <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>Price (Ex VAT)</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>Total (Ex VAT)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {quote.lines?.map((line) => (
                                            <TableRow key={line.id}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>{line.description}</Typography>
                                                    {line.partNumber && <Typography variant="caption" color="text.secondary">{line.partNumber}</Typography>}
                                                </TableCell>
                                                <TableCell align="center">{line.quantity}</TableCell>
                                                <TableCell align="right">{formatCurrency(line.unitSellExVat)}</TableCell>
                                                <TableCell align="right">{formatCurrency(line.lineTotalExVat)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {quote.notes && (
                                <Box sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'background.default', borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} gutterBottom display="block">NOTES</Typography>
                                    <Typography variant="body2">{quote.notes}</Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* Summary & Actions */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'primary.dark', color: 'primary.contrastText', mb: 3 }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom>Investment Summary</Typography>
                            <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography sx={{ opacity: 0.8 }}>Subtotal (Ex VAT)</Typography>
                                <Typography fontWeight={600}>{formatCurrency(quote.totalSellingExVat)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography sx={{ opacity: 0.8 }}>VAT (12.5%)</Typography>
                                <Typography fontWeight={600}>{formatCurrency(quote.totalVat)}</Typography>
                            </Box>

                            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" fontWeight={700}>Grand Total</Typography>
                                <Typography variant="h4" fontWeight={800}>{formatCurrency(quote.totalSellingIncVat)}</Typography>
                            </Box>
                        </Paper>

                        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Ready to proceed?</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Review the quote and click below to digitally accept and initiate the order process.
                            </Typography>

                            {!accepted ? (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    startIcon={<AcceptIcon />}
                                    onClick={() => setAcceptDialog(true)}
                                    sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                                    disabled={quote.status !== 'approved'}
                                >
                                    Digital Acceptance
                                </Button>
                            ) : (
                                <Button fullWidth variant="outlined" color="success" disabled sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}>
                                    ✓ Accepted
                                </Button>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            {/* Acceptance Dialog */}
            <Dialog open={acceptDialog} onClose={() => setAcceptDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Confirm Acceptance</DialogTitle>
                <DialogContent>
                    <Box sx={{ py: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            By entering your name, you acknowledge acceptance of this quotation and authorization to proceed.
                        </Typography>
                        <TextField
                            fullWidth
                            label="Your Full Name"
                            value={signerName}
                            onChange={(e) => setSignerName(e.target.value)}
                            autoFocus
                            required
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setAcceptDialog(false)} color="inherit">Cancel</Button>
                    <Button
                        onClick={handleAccept}
                        variant="contained"
                        disabled={!signerName.trim() || processing}
                    >
                        {processing ? 'Processing...' : 'Accept & Sign'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default QuotePortal;
