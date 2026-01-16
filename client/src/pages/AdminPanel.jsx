import { useState, useEffect } from 'react';
import {
    getSuppliers, createSupplier, updateSupplier,
    getCategories, createCategory, updateCategory,
    getFxRates, updateFxRate, refreshFxRates,
    getSettings, updateSettings,
    getUsers, adminCreateUser, adminDeleteUser, purgeUsers
} from '../services/quoteService';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Chip,
    Alert,
    LinearProgress,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Refresh as RefreshIcon,
    Warning as WarningIcon,
    Delete as DeleteIcon,
    PersonAdd as PersonAddIcon,
} from '@mui/icons-material';

const AdminPanel = () => {
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [fxRates, setFxRates] = useState([]);
    const [users, setUsers] = useState([]);
    const [settings, setSettings] = useState({});
    const [dialog, setDialog] = useState({ open: false, type: null, data: null });
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [suppRes, catRes, fxRes, setRes, userRes] = await Promise.all([
                getSuppliers(),
                getCategories(),
                getFxRates(),
                getSettings(),
                getUsers(),
            ]);
            setSuppliers(suppRes.data);
            setCategories(catRes.data);
            setFxRates(fxRes.data);
            setSettings(setRes.data);
            setUsers(userRes.data);
        } catch (error) {
            console.error('Failed to load admin data:', error);
            setError(error.response?.data?.message || 'Failed to load data from server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshFx = async () => {
        try {
            setRefreshing(true);
            await refreshFxRates();
            const fxRes = await getFxRates();
            setFxRates(fxRes.data);
        } catch (error) {
            console.error('Failed to refresh FX rates:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            await updateSettings(settings);
            alert('Settings saved!');
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    };

    const handleSave = async () => {
        try {
            setSubmitting(true);
            const { type, data } = dialog;

            if (type === 'supplier') {
                if (data.id) await updateSupplier(data.id, data);
                else await createSupplier(data);
            } else if (type === 'category') {
                if (data.id) await updateCategory(data.id, data);
                else await createCategory(data);
            } else if (type === 'fxrate') {
                await updateFxRate(data.currency, data.rateToBase);
            } else if (type === 'user') {
                await adminCreateUser(data);
            }

            setDialog({ open: false, type: null, data: null });
            loadData();
        } catch (error) {
            console.error('Save failed:', error);
            alert(error.response?.data?.message || 'Save failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this user?')) return;
        try {
            await adminDeleteUser(id);
            loadData();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handlePurgeUsers = async () => {
        if (!window.confirm('This will permanently remove all inactive/deactivated users from the database. This action cannot be undone. Proceed?')) return;
        try {
            setLoading(true);
            const res = await purgeUsers();
            alert(res.message);
            loadData();
        } catch (error) {
            console.error('Purge failed:', error);
            alert(error.response?.data?.message || 'Purge failed');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LinearProgress />;

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Admin Panel
            </Typography>

            <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
                <Tab label="Settings" />
                <Tab label="Suppliers" />
                <Tab label="Categories" />
                <Tab label="FX Rates" />
                <Tab label="Users" />
            </Tabs>

            {/* Settings Tab */}
            {tab === 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Application Settings
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Base Currency"
                                    value={settings.base_currency || 'FJD'}
                                    onChange={(e) => setSettings({ ...settings, base_currency: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="VAT Rate (%)"
                                    type="number"
                                    value={(parseFloat(settings.vat_rate) || 0.125) * 100}
                                    onChange={(e) => setSettings({ ...settings, vat_rate: parseFloat(e.target.value) / 100 })}
                                    inputProps={{ step: 0.1 }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Quote Validity (days)"
                                    type="number"
                                    value={settings.quote_validity_days || 14}
                                    onChange={(e) => setSettings({ ...settings, quote_validity_days: parseInt(e.target.value, 10) })}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Low GM Threshold (%)"
                                    type="number"
                                    value={(parseFloat(settings.low_gm_threshold) || 0.08) * 100}
                                    onChange={(e) => setSettings({ ...settings, low_gm_threshold: parseFloat(e.target.value) / 100 })}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Critical GM Threshold (%)"
                                    type="number"
                                    value={(parseFloat(settings.critical_gm_threshold) || 0.05) * 100}
                                    onChange={(e) => setSettings({ ...settings, critical_gm_threshold: parseFloat(e.target.value) / 100 })}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="FX Stale Hours"
                                    type="number"
                                    value={settings.fx_stale_hours || 240}
                                    onChange={(e) => setSettings({ ...settings, fx_stale_hours: parseInt(e.target.value, 10) })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button variant="contained" onClick={handleSaveSettings}>
                                    Save App Settings
                                </Button>
                            </Grid>
                        </Grid>

                        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 4 }}>
                            SMTP Settings (Email Notifications)
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="SMTP Host"
                                    placeholder="e.g., smtp.gmail.com"
                                    value={settings.smtp_host || ''}
                                    onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="SMTP Port"
                                    type="number"
                                    placeholder="587"
                                    value={settings.smtp_port || ''}
                                    onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="From Email"
                                    placeholder="noreply@domain.com"
                                    value={settings.smtp_from_email || ''}
                                    onChange={(e) => setSettings({ ...settings, smtp_from_email: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="SMTP Username"
                                    value={settings.smtp_user || ''}
                                    onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="SMTP Password"
                                    type="password"
                                    value={settings.smtp_pass || ''}
                                    onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button variant="contained" color="secondary" onClick={handleSaveSettings}>
                                    Save SMTP Configuration
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Suppliers Tab */}
            {tab === 1 && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" fontWeight={600}>Suppliers</Typography>
                            <Button startIcon={<AddIcon />} onClick={() => setDialog({ open: true, type: 'supplier', data: {} })}>
                                Add Supplier
                            </Button>
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Default Currency</TableCell>
                                        <TableCell>Notes</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {suppliers.map((supplier) => (
                                        <TableRow key={supplier.id}>
                                            <TableCell>{supplier.name}</TableCell>
                                            <TableCell>{supplier.defaultCurrency}</TableCell>
                                            <TableCell>{supplier.notes}</TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => setDialog({ open: true, type: 'supplier', data: supplier })}>
                                                    <EditIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* Categories Tab */}
            {tab === 2 && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" fontWeight={600}>Categories</Typography>
                            <Button startIcon={<AddIcon />} onClick={() => setDialog({ open: true, type: 'category', data: {} })}>
                                Add Category
                            </Button>
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell align="right">Duty Rate</TableCell>
                                        <TableCell align="right">Handling Rate</TableCell>
                                        <TableCell align="right">Target GM%</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {categories.map((cat) => (
                                        <TableRow key={cat.id}>
                                            <TableCell>{cat.name}</TableCell>
                                            <TableCell align="right">{(parseFloat(cat.dutyRate) * 100).toFixed(1)}%</TableCell>
                                            <TableCell align="right">{(parseFloat(cat.handlingRate) * 100).toFixed(1)}%</TableCell>
                                            <TableCell align="right">{(parseFloat(cat.targetGmPercent) * 100).toFixed(1)}%</TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => setDialog({ open: true, type: 'category', data: cat })}>
                                                    <EditIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* FX Rates Tab */}
            {tab === 3 && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" fontWeight={600}>FX Rates (to FJD)</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={() => setDialog({ open: true, type: 'fxrate', data: { currency: '', rateToBase: 1, isNew: true } })}
                                >
                                    Add Rate
                                </Button>
                                <Button
                                    startIcon={<RefreshIcon />}
                                    onClick={handleRefreshFx}
                                    disabled={refreshing}
                                >
                                    {refreshing ? 'Refreshing...' : 'Refresh API'}
                                </Button>
                            </Box>
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Currency</TableCell>
                                        <TableCell align="right">Rate to FJD</TableCell>
                                        <TableCell>Last Updated</TableCell>
                                        <TableCell>Source</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {fxRates.map((rate) => (
                                        <TableRow key={rate.currency}>
                                            <TableCell><strong>{rate.currency}</strong></TableCell>
                                            <TableCell align="right">{parseFloat(rate.rateToBase).toFixed(4)}</TableCell>
                                            <TableCell>{new Date(rate.lastUpdated).toLocaleString()}</TableCell>
                                            <TableCell>{rate.source}</TableCell>
                                            <TableCell>
                                                {rate.isStale ? (
                                                    <Chip icon={<WarningIcon />} label="Stale" color="warning" size="small" />
                                                ) : (
                                                    <Chip label="OK" color="success" size="small" />
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => setDialog({ open: true, type: 'fxrate', data: rate })}>
                                                    <EditIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* Users Tab */}
            {tab === 4 && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" fontWeight={600}>User Management</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    startIcon={<RefreshIcon />}
                                    onClick={handlePurgeUsers}
                                >
                                    Sync & Purge Inactive
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<PersonAddIcon />}
                                    onClick={() => setDialog({ open: true, type: 'user', data: { role: 'viewer' } })}
                                >
                                    Add User
                                </Button>
                            </Box>
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Role</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Last Login</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell><strong>{user.name}</strong></TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={user.role.toUpperCase()}
                                                    color={user.role === 'admin' ? 'primary' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={user.isActive ? 'Active' : 'Inactive'}
                                                    color={user.isActive ? 'success' : 'error'}
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={!user.isActive}
                                                    title="Deactivate User"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* Dialogs */}
            <Dialog open={dialog.open} onClose={() => setDialog({ open: false, type: null, data: null })} fullWidth maxWidth="sm">
                <DialogTitle>
                    {dialog.type === 'supplier' ? 'Supplier Details' :
                        dialog.type === 'category' ? 'Category Details' :
                            dialog.type === 'fxrate' ? 'Edit FX Rate' :
                                'Invite New User'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        {dialog.type === 'user' && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        value={dialog.data?.name || ''}
                                        onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, name: e.target.value } })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        value={dialog.data?.email || ''}
                                        onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, email: e.target.value } })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>Role</InputLabel>
                                        <Select
                                            value={dialog.data?.role || 'viewer'}
                                            label="Role"
                                            onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, role: e.target.value } })}
                                        >
                                            <MenuItem value="admin">Admin</MenuItem>
                                            <MenuItem value="approver">Approver</MenuItem>
                                            <MenuItem value="creator">Creator</MenuItem>
                                            <MenuItem value="viewer">Viewer</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        )}

                        {(dialog.type === 'supplier') && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Name"
                                        value={dialog.data?.name || ''}
                                        onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, name: e.target.value } })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Default Currency"
                                        value={dialog.data?.defaultCurrency || ''}
                                        onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, defaultCurrency: e.target.value } })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Notes"
                                        multiline
                                        rows={3}
                                        value={dialog.data?.notes || ''}
                                        onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, notes: e.target.value } })}
                                    />
                                </Grid>
                            </Grid>
                        )}

                        {dialog.type === 'category' && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Name"
                                        value={dialog.data?.name || ''}
                                        onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, name: e.target.value } })}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Duty Rate (%)"
                                        type="number"
                                        value={dialog.data?.dutyRate !== undefined ? Math.round(dialog.data.dutyRate * 10000) / 100 : ''}
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value) / 100;
                                            setDialog({ ...dialog, data: { ...dialog.data, dutyRate: isNaN(val) ? 0 : Math.min(1, Math.max(0, val)) } });
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Handling Rate (%)"
                                        type="number"
                                        value={dialog.data?.handlingRate !== undefined ? Math.round(dialog.data.handlingRate * 10000) / 100 : ''}
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value) / 100;
                                            setDialog({ ...dialog, data: { ...dialog.data, handlingRate: isNaN(val) ? 0 : Math.min(1, Math.max(0, val)) } });
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Target GM (%)"
                                        type="number"
                                        value={dialog.data?.targetGmPercent !== undefined ? Math.round(dialog.data.targetGmPercent * 10000) / 100 : ''}
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value) / 100;
                                            setDialog({ ...dialog, data: { ...dialog.data, targetGmPercent: isNaN(val) ? 0 : Math.min(1, Math.max(0, val)) } });
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        )}

                        {dialog.type === 'fxrate' && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Currency Code (e.g., USD, NZD, AUD)"
                                        value={dialog.data?.currency || ''}
                                        onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, currency: e.target.value.toUpperCase() } })}
                                        disabled={!dialog.data?.isNew}
                                        helperText={!dialog.data?.isNew ? "Currency code cannot be changed. Add a new rate if needed." : ""}
                                        inputProps={{ maxLength: 3 }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label={`Rate to ${settings.base_currency || 'FJD'}`}
                                        type="number"
                                        value={dialog.data?.rateToBase || 0}
                                        onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, rateToBase: parseFloat(e.target.value) } })}
                                        inputProps={{ step: 0.0001 }}
                                    />
                                </Grid>
                            </Grid>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialog({ open: false, type: null, data: null })}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={submitting}>
                        {submitting ? 'Saving...' : (dialog.type === 'user' ? 'Send Invitation' : 'Save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminPanel;
