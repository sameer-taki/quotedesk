import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuote, createQuote, updateQuote, getSuppliers, getCategories, getFxRates, getSettings, getCustomers, createCustomer } from '../services/quoteService';
import { calculateLine, calculateQuoteTotals, formatCurrency, formatPercent } from '../utils/calculations';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Grid,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    LinearProgress,
    Divider,
    Paper,
    Chip,
    InputAdornment,
    Stack,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Save as SaveIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    AutoFixHigh as WizardIcon,
    NavigateNext as NextIcon,
    NavigateBefore as PrevIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { Stepper, Step, StepLabel, Dialog, DialogTitle, DialogContent, DialogActions, Collapse } from '@mui/material';
import WinProbabilityCard from '../components/intelligence/WinProbabilityCard';
import SmartBundleCarousel from '../components/intelligence/SmartBundleCarousel';
import ExcelImportButton from '../components/quotes/ExcelImportButton';
import { analyzeQuote } from '../services/quoteService';

const QuoteEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Reference data
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [fxRates, setFxRates] = useState([]);
    const [settings, setSettings] = useState({});

    // Quote data
    const [customerId, setCustomerId] = useState('');
    const [clientName, setClientName] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState([]);
    const [totals, setTotals] = useState({ totalSellingExVat: 0, totalVat: 0, totalSellingIncVat: 0, totalLandedCost: 0, overallGmPercent: 0 });
    const [expandedLine, setExpandedLine] = useState(null);

    // Wizard state
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(0);
    const [wizardData, setWizardData] = useState({ categoryId: '', supplierId: '', description: '', quantity: 1, buyPrice: 0 });

    // Customer Dialog state
    const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
    const [customerForm, setCustomerForm] = useState({ name: '', company: '', email: '', phone: '', address: '', notes: '' });
    const [customerSaving, setCustomerSaving] = useState(false);

    // Intelligence Data
    const [intelligence, setIntelligence] = useState(null);

    const runAnalysis = async (quoteId) => {
        try {
            const result = await analyzeQuote(quoteId);
            if (result.success) {
                setIntelligence(result.data);
            }
        } catch (err) {
            console.error('Failed to run intelligence analysis:', err);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    useEffect(() => {
        // Recalculate totals when lines change
        const vatRate = parseFloat(settings.vat_rate) || 0.125;
        const calculatedLines = lines.map(line => {
            if (!line.buyPrice || !line.exchangeRate || line.exchangeRate === 0) return line;
            const calcs = calculateLine(line, vatRate);
            return { ...line, ...calcs };
        });
        const newTotals = calculateQuoteTotals(calculatedLines);
        setTotals(newTotals);
    }, [lines, settings]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load reference data in parallel
            const [suppliersRes, categoriesRes, customersRes, fxRes, settingsRes] = await Promise.all([
                getSuppliers(),
                getCategories(),
                getCustomers(),
                getFxRates(),
                getSettings(),
            ]);

            setSuppliers(suppliersRes.data || []);
            setCategories(categoriesRes.data || []);
            setCustomers(customersRes.data || []);
            setFxRates(fxRes.data || []);
            setSettings(settingsRes.data || {});

            // Load quote if editing
            if (isEdit) {
                const quoteRes = await getQuote(id);
                const quote = quoteRes.data;
                setCustomerId(quote.customerId || '');
                setClientName(quote.clientName);
                setNotes(quote.notes || '');
                setLines(quote.lines || []);

                // Fetch intelligence
                if (id) runAnalysis(id);
            }
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addLine = () => {
        // Get default FX rate (NZD)
        const defaultFx = fxRates.find(r => r.currency === 'NZD');
        const newLine = {
            id: `new-${Date.now()}`,
            description: '',
            partNumber: '',
            supplierId: '',
            categoryId: '',
            quantity: 1,
            buyPrice: 0,
            currency: 'NZD',
            freightRate: 0.05,
            exchangeRate: defaultFx?.rateToBase || 1.39,
            dutyRate: 0.05,
            handlingRate: 0.02,
            targetMarkupPercent: 0.25,
            overrideMarkupPercent: null,
        };
        setLines([...lines, newLine]);
    };

    const updateLine = (index, field, value) => {
        const vatRate = parseFloat(settings.vat_rate) || 0.125;
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };

        // Auto-fill rates when supplier changes
        if (field === 'supplierId') {
            const supplier = suppliers.find(s => s.id === value);
            if (supplier) {
                newLines[index].currency = supplier.defaultCurrency;
                const rate = fxRates.find(r => r.currency === supplier.defaultCurrency);
                if (rate) {
                    newLines[index].exchangeRate = parseFloat(rate.rateToBase);
                }
            }
        }

        // Auto-fill rates when category changes
        if (field === 'categoryId') {
            const category = categories.find(c => c.id === value);
            if (category) {
                newLines[index].dutyRate = parseFloat(category.dutyRate) || 0;
                newLines[index].handlingRate = parseFloat(category.handlingRate) || 0;
                newLines[index].targetMarkupPercent = parseFloat(category.targetGmPercent) || 0.25;
            }
        }

        // Recalculate line
        const line = newLines[index];
        if (line.buyPrice && line.exchangeRate && line.exchangeRate > 0) {
            const calcs = calculateLine(line, vatRate);
            if (calcs) {
                newLines[index] = { ...newLines[index], ...calcs };
            }
        }

        setLines(newLines);
    };

    const removeLine = (index) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const handleAddBundle = (bundleItem) => {
        const vatRate = parseFloat(settings.vat_rate) || 0.125;
        // Default to NZD just like addLine
        const defaultFx = fxRates.find(r => r.currency === 'NZD');

        // Find category if possible (this logic could be improved to look up cat from product)
        // For now, leave empty or default

        const newLine = {
            id: `bundle-${Date.now()}`,
            description: bundleItem.name,
            partNumber: bundleItem.sku,
            supplierId: '', // Ideally we'd know this from the product record
            categoryId: '',
            quantity: 1,
            buyPrice: parseFloat(bundleItem.price) || 0,
            currency: 'NZD',
            freightRate: 0.05,
            exchangeRate: defaultFx?.rateToBase || 1.39,
            dutyRate: 0.05,
            handlingRate: 0.02,
            targetMarkupPercent: 0.25,
            overrideMarkupPercent: null,
        };

        const calcs = calculateLine(newLine, vatRate);
        setLines([...lines, { ...newLine, ...calcs }]);
    };

    const handleImportSuccess = (parsedLines) => {
        const vatRate = parseFloat(settings.vat_rate) || 0.125;
        const defaultFx = fxRates.find(r => r.currency === 'NZD');

        const newLines = parsedLines.map((line, idx) => {
            // Use the values from the parsed Excel, falling back to sensible defaults
            const baseLine = {
                id: `import-${Date.now()}-${idx}`,
                description: line.description,
                partNumber: line.partNumber,
                supplierId: '',
                categoryId: '',
                quantity: line.quantity || 1,
                buyPrice: line.buyPrice || 0,
                currency: line.currency || 'NZD',
                // Use parsed values if available, otherwise use 0 (user can adjust later)
                freightRate: line.freightRate ?? 0,
                exchangeRate: line.exchangeRate || defaultFx?.rateToBase || 1,
                dutyRate: line.dutyRate ?? 0,
                handlingRate: line.handlingRate ?? 0,
                targetMarkupPercent: line.targetMarkupPercent ?? 0.25,
                overrideMarkupPercent: null,
            };
            const calcs = calculateLine(baseLine, vatRate);
            return { ...baseLine, ...calcs };
        });

        setLines([...lines, ...newLines]);
    };

    const handleWizardSubmit = () => {
        const vatRate = parseFloat(settings.vat_rate) || 0.125;
        const supplier = suppliers.find(s => s.id === wizardData.supplierId);
        const category = categories.find(c => c.id === wizardData.categoryId);
        const fxRate = fxRates.find(r => r.currency === (supplier?.defaultCurrency || 'NZD'));

        const newLine = {
            id: `wiz-${Date.now()}`,
            description: wizardData.description,
            partNumber: '',
            supplierId: wizardData.supplierId,
            categoryId: wizardData.categoryId,
            quantity: wizardData.quantity,
            buyPrice: wizardData.buyPrice,
            currency: supplier?.defaultCurrency || 'NZD',
            freightRate: 0.05,
            exchangeRate: fxRate?.rateToBase || 1,
            dutyRate: category?.dutyRate || 0,
            handlingRate: category?.handlingRate || 0,
            targetMarkupPercent: category?.targetGmPercent || 0.25,
            overrideMarkupPercent: null,
        };

        const calcs = calculateLine(newLine, vatRate);
        setLines([...lines, { ...newLine, ...calcs }]);
        setWizardOpen(false);
        setWizardStep(0);
        setWizardData({ categoryId: '', supplierId: '', description: '', quantity: 1, buyPrice: 0 });
    };

    const handleSave = async () => {
        if (!clientName.trim()) {
            setError('Client name is required');
            return;
        }

        if (lines.length === 0) {
            setError('At least one line item is required');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const quoteData = {
                customerId: customerId || null,
                clientName,
                notes,
                lines: lines.map(line => ({
                    partNumber: line.partNumber,
                    description: line.description,
                    supplierId: line.supplierId || null,
                    categoryId: line.categoryId || null,
                    quantity: parseInt(line.quantity, 10) || 1,
                    buyPrice: parseFloat(line.buyPrice) || 0,
                    currency: line.currency,
                    freightRate: parseFloat(line.freightRate) || 0,
                    exchangeRate: parseFloat(line.exchangeRate) || 1,
                    dutyRate: parseFloat(line.dutyRate) || 0,
                    handlingRate: parseFloat(line.handlingRate) || 0,
                    targetMarkupPercent: parseFloat(line.targetMarkupPercent) || 0.25,
                    overrideMarkupPercent: line.overrideMarkupPercent ? parseFloat(line.overrideMarkupPercent) : null,
                })),
            };

            let result;
            if (isEdit) {
                result = await updateQuote(id, quoteData);
            } else {
                result = await createQuote(quoteData);
            }

            navigate(`/quotes/${result.data.id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save quote');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleCreateCustomer = async () => {
        if (!customerForm.name.trim() || !customerForm.company.trim() || !customerForm.email.trim() || !customerForm.phone.trim() || !customerForm.address.trim()) {
            setError('All fields except Notes are required for a new customer');
            return;
        }

        try {
            setCustomerSaving(true);
            const res = await createCustomer(customerForm);
            const newCustomer = res.data;

            // Update customers list and select the new one
            setCustomers([...customers, newCustomer]);
            setCustomerId(newCustomer.id);
            setClientName(newCustomer.company || newCustomer.name);

            setCustomerDialogOpen(false);
            setCustomerForm({ name: '', company: '', email: '', phone: '', address: '', notes: '' });
        } catch (err) {
            console.error('Failed to create customer:', err);
            setError(err.response?.data?.message || 'Failed to create customer');
        } finally {
            setCustomerSaving(false);
        }
    };

    if (loading) return <LinearProgress />;

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Button startIcon={<BackIcon />} onClick={() => navigate('/quotes')} sx={{ mb: 1 }}>
                        Back to Quotes
                    </Button>
                    <Typography variant="h4" fontWeight={700}>
                        {isEdit ? 'Edit Quote' : 'New Quote'}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <ExcelImportButton
                        onImportSuccess={handleImportSuccess}
                        onImportError={(msg) => setError(msg)}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<WizardIcon />}
                        onClick={() => setWizardOpen(true)}
                        size="large"
                        sx={{ display: { xs: 'none', sm: 'flex' } }}
                    >
                        Guided Selling
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                        size="large"
                    >
                        {saving ? 'Saving...' : 'Save Quote'}
                    </Button>
                </Stack>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* AI Intelligence - Win Probability */}
            {intelligence && (
                <WinProbabilityCard
                    winProbability={intelligence.winProbability}
                    aiAnalysis={intelligence}
                />
            )}

            {/* Quote Details */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>Quote Details</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Select Customer</InputLabel>
                                <Select
                                    value={customerId}
                                    onChange={(e) => {
                                        const selected = customers.find(c => c.id === e.target.value);
                                        setCustomerId(e.target.value);
                                        if (selected) setClientName(selected.company || selected.name);
                                    }}
                                    label="Select Customer"
                                >
                                    <MenuItem value="">-- Select Saved Customer --</MenuItem>
                                    {customers.map(c => (
                                        <MenuItem key={c.id} value={c.id}>
                                            {c.company ? `${c.company} (${c.name})` : c.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Client Reference / Name"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="Auto-filled from customer or enter custom"
                                InputProps={{
                                    endAdornment: clientName && !customerId && (
                                        <InputAdornment position="end">
                                            <Button
                                                size="small"
                                                onClick={() => {
                                                    setCustomerForm({ ...customerForm, name: clientName, company: clientName });
                                                    setCustomerDialogOpen(true);
                                                }}
                                            >
                                                Save as New Customer
                                            </Button>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                multiline
                                rows={2}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* AI Smart Bundling */}
            {intelligence && intelligence.bundles && intelligence.bundles.length > 0 && (
                <SmartBundleCarousel
                    bundles={intelligence.bundles}
                    onAddBundle={handleAddBundle}
                />
            )}

            {/* Line Items */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>Line Items ({lines.length})</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={addLine}>Add Line Item</Button>
                </Box>

                {lines.length === 0 && (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper' }}>
                        <Typography color="text.secondary" gutterBottom>No line items yet.</Typography>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={addLine}>
                            Add Your First Line Item
                        </Button>
                    </Paper>
                )}

                {lines.map((line, idx) => (
                    <Card key={line.id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent>
                            {/* Line Header */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label={`Line ${idx + 1}`} color="primary" size="small" />
                                    {intelligence?.competitorAlerts?.find(a => a.partNumber === line.partNumber) && (
                                        <Chip
                                            icon={<Warning fontSize="small" />}
                                            label="Price Alert"
                                            color="error"
                                            variant="outlined"
                                            size="small"
                                            title={intelligence.competitorAlerts.find(a => a.partNumber === line.partNumber).message}
                                        />
                                    )}
                                </Box>
                                <IconButton size="small" color="error" onClick={() => removeLine(idx)}>
                                    <DeleteIcon />
                                </IconButton>
                            </Box>

                            {intelligence?.competitorAlerts?.find(a => a.partNumber === line.partNumber) && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    {intelligence.competitorAlerts.find(a => a.partNumber === line.partNumber).message}
                                </Alert>
                            )}

                            {/* Row 1: Description, Part Number */}
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={12} md={8}>
                                    <TextField
                                        fullWidth
                                        label="Description"
                                        value={line.description}
                                        onChange={(e) => updateLine(idx, 'description', e.target.value)}
                                        placeholder="Enter product/service description"
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Part Number (optional)"
                                        value={line.partNumber || ''}
                                        onChange={(e) => updateLine(idx, 'partNumber', e.target.value)}
                                    />
                                </Grid>
                            </Grid>

                            {/* Row 2: Supplier, Category, Quantity */}
                            < Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={12} sm={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Supplier</InputLabel>
                                        <Select
                                            value={line.supplierId || ''}
                                            onChange={(e) => updateLine(idx, 'supplierId', e.target.value)}
                                            label="Supplier"
                                        >
                                            <MenuItem value="">Select Supplier</MenuItem>
                                            {suppliers.map(s => (
                                                <MenuItem key={s.id} value={s.id}>{s.name} ({s.defaultCurrency})</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Category</InputLabel>
                                        <Select
                                            value={line.categoryId || ''}
                                            onChange={(e) => updateLine(idx, 'categoryId', e.target.value)}
                                            label="Category"
                                        >
                                            <MenuItem value="">Select Category</MenuItem>
                                            {categories.map(c => (
                                                <MenuItem key={c.id} value={c.id}>{c.name} ({formatPercent(c.targetGmPercent)} GM)</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Quantity"
                                        type="number"
                                        value={line.quantity}
                                        onChange={(e) => updateLine(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                                        inputProps={{ min: 1 }}
                                    />
                                </Grid>
                            </Grid>

                            {/* Row 3: Pricing Details */}
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={6} sm={3}>
                                    <TextField
                                        fullWidth
                                        label={`Buy Price (${line.currency})`}
                                        type="number"
                                        value={line.buyPrice}
                                        onChange={(e) => updateLine(idx, 'buyPrice', parseFloat(e.target.value) || 0)}
                                        inputProps={{ min: 0, step: 0.01 }}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField
                                        fullWidth
                                        label="FX Rate to FJD"
                                        type="number"
                                        value={line.exchangeRate}
                                        onChange={(e) => updateLine(idx, 'exchangeRate', parseFloat(e.target.value) || 0)}
                                        inputProps={{ min: 0, step: 0.01 }}
                                        helperText={`1 ${line.currency} = ${line.exchangeRate} FJD`}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField
                                        fullWidth
                                        label="Freight %"
                                        type="number"
                                        value={(line.freightRate || 0) * 100}
                                        onChange={(e) => updateLine(idx, 'freightRate', parseFloat(e.target.value) / 100)}
                                        inputProps={{ min: 0, max: 100, step: 0.5 }}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField
                                        fullWidth
                                        label="Markup %"
                                        type="number"
                                        value={((line.overrideMarkupPercent ?? line.targetMarkupPercent) || 0) * 100}
                                        onChange={(e) => updateLine(idx, 'overrideMarkupPercent', parseFloat(e.target.value) / 100)}
                                        inputProps={{ min: 0, max: 100, step: 1 }}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            {/* Row 4: Summary Totals & Expand */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
                                <Box sx={{ display: 'flex', gap: 4 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Landed (FJD)</Typography>
                                        <Typography variant="subtitle1" fontWeight={600}>{formatCurrency(line.landedCost || 0)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Total (Inc VAT)</Typography>
                                        <Typography variant="subtitle1" fontWeight={700} color="primary">{formatCurrency(line.lineTotalIncVat || 0)}</Typography>
                                    </Box>
                                </Box>
                                <Button
                                    size="small"
                                    startIcon={expandedLine === idx ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    onClick={() => setExpandedLine(expandedLine === idx ? null : idx)}
                                >
                                    Cost Breakdown
                                </Button>
                            </Box>

                            {/* Collapsible Breakdown */}
                            <Collapse in={expandedLine === idx}>
                                <Box sx={{ p: 2, mt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="caption">Base Unit (FJD)</Typography>
                                            <Typography variant="body2" fontWeight={500}>
                                                {formatCurrency((line.buyPrice || 0) * (line.exchangeRate || 1))}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="caption">Freight ({(line.freightRate * 100).toFixed(1)}%)</Typography>
                                            <Typography variant="body2" color="error.main">
                                                + {formatCurrency((line.buyPrice || 0) * (line.exchangeRate || 1) * (line.freightRate || 0))}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="caption">Duty ({(line.dutyRate * 100).toFixed(1)}%)</Typography>
                                            <Typography variant="body2" color="error.main">
                                                + {formatCurrency((line.buyPrice || 0) * (line.exchangeRate || 1) * (line.dutyRate || 0))}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="caption">Handling ({(line.handlingRate * 100).toFixed(1)}%)</Typography>
                                            <Typography variant="body2" color="error.main">
                                                + {formatCurrency((line.buyPrice || 0) * (line.exchangeRate || 1) * (line.handlingRate || 0))}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Divider sx={{ my: 1 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" fontWeight={600}>Total Landed Unit Cost:</Typography>
                                                <Typography variant="body2" fontWeight={600}>{formatCurrency(line.landedCost / line.quantity)}</Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Collapse>
                        </CardContent>
                    </Card >
                ))}
            </Box >

            {/* Wizard Dialog */}
            < Dialog open={wizardOpen} onClose={() => setWizardOpen(false)} maxWidth="sm" fullWidth >
                <DialogTitle>Guided Selling Wizard</DialogTitle>
                <DialogContent>
                    <Stepper activeStep={wizardStep} sx={{ py: 3 }}>
                        <Step><StepLabel>Category</StepLabel></Step>
                        <Step><StepLabel>Supplier</StepLabel></Step>
                        <Step><StepLabel>Details</StepLabel></Step>
                    </Stepper>

                    {wizardStep === 0 && (
                        <Box sx={{ py: 2 }}>
                            <Typography gutterBottom>What type of product are you quoting?</Typography>
                            <Grid container spacing={1}>
                                {categories.map(cat => (
                                    <Grid item xs={6} key={cat.id}>
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                cursor: 'pointer',
                                                bgcolor: wizardData.categoryId === cat.id ? 'primary.light' : 'background.paper',
                                                color: wizardData.categoryId === cat.id ? 'primary.contrastText' : 'text.primary'
                                            }}
                                            onClick={() => {
                                                setWizardData({ ...wizardData, categoryId: cat.id });
                                                setWizardStep(1);
                                            }}
                                        >
                                            <CardContent sx={{ p: 2, textAlign: 'center' }}>
                                                <Typography variant="body1" fontWeight={500}>{cat.name}</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {wizardStep === 1 && (
                        <Box sx={{ py: 2 }}>
                            <Typography gutterBottom>Select a preferred supplier:</Typography>
                            <FormControl fullWidth sx={{ mt: 1 }}>
                                <InputLabel>Supplier</InputLabel>
                                <Select
                                    value={wizardData.supplierId}
                                    onChange={(e) => setWizardData({ ...wizardData, supplierId: e.target.value })}
                                    label="Supplier"
                                >
                                    {suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {wizardStep === 2 && (
                        <Box sx={{ py: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Description"
                                        value={wizardData.description}
                                        onChange={(e) => setWizardData({ ...wizardData, description: e.target.value })}
                                        autoFocus
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Quantity"
                                        type="number"
                                        value={wizardData.quantity}
                                        onChange={(e) => setWizardData({ ...wizardData, quantity: parseInt(e.target.value) || 1 })}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Unit Cost"
                                        type="number"
                                        value={wizardData.buyPrice}
                                        onChange={(e) => setWizardData({ ...wizardData, buyPrice: parseFloat(e.target.value) || 0 })}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setWizardOpen(false)}>Cancel</Button>
                    {wizardStep > 0 && (
                        <Button onClick={() => setWizardStep(wizardStep - 1)}>Back</Button>
                    )}
                    {wizardStep < 2 ? (
                        <Button
                            variant="contained"
                            disabled={wizardStep === 0 && !wizardData.categoryId || wizardStep === 1 && !wizardData.supplierId}
                            onClick={() => setWizardStep(wizardStep + 1)}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button variant="contained" color="success" onClick={handleWizardSubmit} disabled={!wizardData.description}>
                            Add to Quote
                        </Button>
                    )}
                </DialogActions>
            </Dialog >

            {/* Totals Summary */}
            < Card sx={{ position: 'sticky', bottom: 16, zIndex: 10, boxShadow: 4, borderRadius: { xs: 0, sm: 2 }, mx: { xs: -2, sm: 0 }, mb: { xs: -2, sm: 0 } }}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, md: 0 } }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Overall Gross Margin</Typography>
                                    <Typography
                                        variant="h3"
                                        fontWeight={700}
                                        color={totals.overallGmPercent < 0.08 ? 'error.main' : totals.overallGmPercent < 0.15 ? 'warning.main' : 'success.main'}
                                        sx={{ fontSize: { xs: '2.5rem', sm: '3rem' } }}
                                    >
                                        {formatPercent(totals.overallGmPercent || 0)}
                                    </Typography>
                                </Box>
                                {totals.overallGmPercent < 0.08 && (
                                    <Chip label="Requires Approval" color="warning" variant="filled" />
                                )}
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'stretch', md: 'flex-end' }, gap: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', minWidth: { md: 250 } }}>
                                    <Typography color="text.secondary">Subtotal (Ex VAT):</Typography>
                                    <Typography fontWeight={500}>{formatCurrency(totals.totalSellingExVat || 0)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', minWidth: { md: 250 } }}>
                                    <Typography color="text.secondary">VAT (12.5%):</Typography>
                                    <Typography fontWeight={500}>{formatCurrency(totals.totalVat || 0)}</Typography>
                                </Box>
                                <Divider sx={{ width: { xs: '100%', md: 250 }, my: 0.5 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: { md: 300 } }}>
                                    <Typography variant="h6" fontWeight={600}>Total (Inc VAT):</Typography>
                                    <Typography variant="h4" fontWeight={700} color="primary.main">
                                        {formatCurrency(totals.totalSellingIncVat || 0)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card >

            {/* Customer Creation Dialog */}
            < Dialog open={customerDialogOpen} onClose={() => setCustomerDialogOpen(false)} maxWidth="sm" fullWidth >
                <DialogTitle>Quick-Add New Customer</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    value={customerForm.name}
                                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Company"
                                    value={customerForm.company}
                                    onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    value={customerForm.email}
                                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    value={customerForm.phone}
                                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Address"
                                    value={customerForm.address}
                                    onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                                    required
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCustomerDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateCustomer} disabled={customerSaving}>
                        {customerSaving ? 'Creating...' : 'Create & Select'}
                    </Button>
                </DialogActions>
            </Dialog >
        </Box >
    );
};

export default QuoteEditor;
