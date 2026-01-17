import api from './api';

// ============================================
// Quotes
// ============================================

export const getQuotes = async (params = {}) => {
    const response = await api.get('/quotes', { params });
    return response.data;
};

export const getQuote = async (id) => {
    const response = await api.get(`/quotes/${id}`);
    return response.data;
};

export const createQuote = async (data) => {
    const response = await api.post('/quotes', data);
    return response.data;
};

export const updateQuote = async (id, data) => {
    const response = await api.put(`/quotes/${id}`, data);
    return response.data;
};

export const deleteQuote = async (id) => {
    const response = await api.delete(`/quotes/${id}`);
    return response.data;
};

export const analyzeQuote = async (id) => {
    const response = await api.post(`/quotes/${id}/analyze`);
    return response.data;
};

export const submitQuote = async (id) => {
    const response = await api.post(`/quotes/${id}/submit`);
    return response.data;
};

export const generateVendorPOs = async (id) => {
    const response = await api.post(`/quotes/${id}/generate-po`);
    return response.data;
};

export const approveQuote = async (id, comments) => {
    const response = await api.post(`/quotes/${id}/approve`, { comments });
    return response.data;
};

export const rejectQuote = async (id, comments) => {
    const response = await api.post(`/quotes/${id}/reject`, { comments });
    return response.data;
};

export const exportQuotePdf = async (id) => {
    const response = await api.get(`/quotes/${id}/export/pdf`, {
        responseType: 'blob',
    });
    return response.data;
};

export const exportQuoteExcel = async (id) => {
    const response = await api.get(`/quotes/${id}/export/excel`, {
        responseType: 'blob',
    });
    return response.data;
};

// ============================================
// Public Portal
// ============================================

export const getPublicQuote = async (publicId) => {
    const response = await api.get(`/quotes/public/${publicId}`);
    return response.data;
};

export const acceptPublicQuote = async (publicId, acceptedBy) => {
    const response = await api.post(`/quotes/public/${publicId}/accept`, { acceptedBy });
    return response.data;
};

// ============================================
// Reference Data
// ============================================

export const getSuppliers = async () => {
    const response = await api.get('/suppliers');
    return response.data;
};

export const createSupplier = async (data) => {
    const response = await api.post('/suppliers', data);
    return response.data;
};

export const updateSupplier = async (id, data) => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
};

export const getCategories = async () => {
    const response = await api.get('/categories');
    return response.data;
};

export const createCategory = async (data) => {
    const response = await api.post('/categories', data);
    return response.data;
};

export const updateCategory = async (id, data) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
};

export const getFxRates = async () => {
    const response = await api.get('/fx-rates');
    return response.data;
};

export const updateFxRate = async (currency, rateToBase) => {
    const response = await api.put(`/fx-rates/${currency}`, { rateToBase });
    return response.data;
};

export const refreshFxRates = async () => {
    const response = await api.post('/fx-rates/refresh');
    return response.data;
};

export const deleteFxRate = async (currency) => {
    const response = await api.delete(`/fx-rates/${currency}`);
    return response.data;
};

export const getSettings = async () => {
    const response = await api.get('/settings');
    return response.data;
};

export const updateSettings = async (data) => {
    const response = await api.put('/settings', data);
    return response.data;
};

// ============================================
// Customers
// ============================================

export const getCustomers = async () => {
    const response = await api.get('/customers');
    return response.data;
};

export const createCustomer = async (data) => {
    const response = await api.post('/customers', data);
    return response.data;
};

export const updateCustomer = async (id, data) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
};

// ============================================
// Users (Admin Only)
// ============================================

export const getUsers = async () => {
    const response = await api.get('/users');
    return response.data;
};

export const adminCreateUser = async (data) => {
    const response = await api.post('/users', data);
    return response.data;
};

export const adminDeleteUser = async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
};

export const purgeUsers = async () => {
    const response = await api.post('/users/purge-inactive');
    return response.data;
};

