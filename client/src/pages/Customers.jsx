import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    LinearProgress,
    Alert,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialog, setDialog] = useState({ open: false, customer: null });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const { isAdmin, isCreator } = useAuth();
    const canEdit = isAdmin || isCreator;

    // Form state
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        notes: '',
    });

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/customers');
            setCustomers(response.data.data);
        } catch (err) {
            console.error('Failed to load customers:', err);
        } finally {
            setLoading(false);
        }
    };

    const openDialog = (customer = null) => {
        if (customer) {
            setForm({
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone || '',
                company: customer.company || '',
                address: customer.address || '',
                notes: customer.notes || '',
            });
        } else {
            setForm({ name: '', email: '', phone: '', company: '', address: '', notes: '' });
        }
        setDialog({ open: true, customer });
        setError(null);
    };

    const closeDialog = () => {
        setDialog({ open: false, customer: null });
        setForm({ name: '', email: '', phone: '', company: '', address: '', notes: '' });
        setError(null);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.company.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim()) {
            setError('All fields except Notes are required (Name, Company, Email, Phone, Address)');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            if (dialog.customer) {
                await api.put(`/customers/${dialog.customer.id}`, form);
            } else {
                await api.post('/customers', form);
            }

            closeDialog();
            loadCustomers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save customer');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (customer) => {
        if (!confirm(`Delete customer "${customer.name}"?`)) return;

        try {
            await api.delete(`/customers/${customer.id}`);
            loadCustomers();
        } catch (err) {
            console.error('Failed to delete customer:', err);
        }
    };

    if (loading) return <LinearProgress />;

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        Customers
                    </Typography>
                    <Typography color="text.secondary">
                        Manage customer contacts for quotes
                    </Typography>
                </Box>
                {canEdit && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>
                        Add Customer
                    </Button>
                )}
            </Box>

            {/* Customer List */}
            <Card>
                <CardContent sx={{ p: 0 }}>
                    {customers.length === 0 ? (
                        <Box sx={{ py: 8, textAlign: 'center' }}>
                            <BusinessIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                            <Typography color="text.secondary">No customers yet.</Typography>
                            {canEdit && (
                                <Button variant="contained" sx={{ mt: 2 }} onClick={() => openDialog()}>
                                    Add First Customer
                                </Button>
                            )}
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Company</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Phone</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {customers.map((customer) => (
                                        <TableRow key={customer.id} hover>
                                            <TableCell>
                                                <Typography fontWeight={500}>{customer.name}</Typography>
                                            </TableCell>
                                            <TableCell>{customer.company || '-'}</TableCell>
                                            <TableCell>{customer.email || '-'}</TableCell>
                                            <TableCell>{customer.phone || '-'}</TableCell>
                                            <TableCell align="right">
                                                {canEdit && (
                                                    <>
                                                        <IconButton size="small" onClick={() => openDialog(customer)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        {isAdmin && (
                                                            <IconButton size="small" color="error" onClick={() => handleDelete(customer)}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        )}
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {dialog.customer ? 'Edit Customer' : 'Add Customer'}
                </DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                error={!form.name}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Company"
                                value={form.company}
                                onChange={(e) => setForm({ ...form, company: e.target.value })}
                                required
                                error={!form.company}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                                error={!form.email}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Phone"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                required
                                error={!form.phone}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Address"
                                multiline
                                rows={2}
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                required
                                error={!form.address}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notes"
                                multiline
                                rows={2}
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Customers;
