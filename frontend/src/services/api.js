import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE });

// Categories
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Products
export const getProducts = (params) => api.get('/products', { params });
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const searchProducts = (q) => api.get('/products/search', { params: { q } });
export const bulkUpdateProducts = (data) => api.post('/products/bulk-update', data);
export const getAuditLog = () => api.get('/products/audit-log');

// Billing
export const getBills = (params) => api.get('/bills', { params });
export const getBill = (id) => api.get(`/bills/${id}`);
export const createBill = (data) => api.post('/bills', data);
export const cancelBill = (id) => api.delete(`/bills/${id}`);
export const getBillSummary = () => api.get('/bills/summary');

// Settings
export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.post('/settings', data);
export const getPrinters = () => api.get('/printers');
export const printBill = (data) => api.post('/print-bill', data);
