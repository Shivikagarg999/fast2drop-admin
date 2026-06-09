import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.9build.io/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const loginApi   = (d) => api.post('/auth/login', d);
export const getMeApi   = ()  => api.get('/auth/me');

// Dashboard
export const getDashboard         = ()       => api.get('/admin/dashboard');
export const getRevenueAnalytics  = (period) => api.get('/admin/analytics/revenue', { params: { period } });
export const getBookingAnalytics  = (period) => api.get('/admin/analytics/bookings', { params: { period } });

// Users
export const getUsers      = (p)        => api.get('/admin/users', { params: p });
export const getUserDetail = (id)       => api.get(`/admin/users/${id}`);
export const createUser    = (d)        => api.post('/admin/users', d);
export const updateUser    = (id, d)    => api.patch(`/admin/users/${id}`, d);
export const deleteUser    = (id)       => api.delete(`/admin/users/${id}`);
export const banUser       = (id)       => api.patch(`/admin/users/${id}/ban`);

// Drivers
export const getDrivers      = (p)       => api.get('/admin/drivers', { params: p });
export const getDriverDetail = (id)      => api.get(`/admin/drivers/${id}`);
export const createDriver    = (d)       => api.post('/admin/drivers', d);
export const updateDriver    = (id, d)   => api.patch(`/admin/drivers/${id}`, d);
export const deleteDriver    = (id)      => api.delete(`/admin/drivers/${id}`);
export const approveDriver   = (id, val) => api.patch(`/admin/drivers/${id}/approve`, { approve: val });
export const toggleDriver    = (id)      => api.patch(`/admin/drivers/${id}/toggle`);

// Bookings
export const getBookings      = (p)         => api.get('/admin/bookings', { params: p });
export const getBookingDetail = (id)        => api.get(`/admin/bookings/${id}`);
export const assignDriver     = (id, dId)   => api.patch(`/admin/bookings/${id}/assign`, { driverId: dId });
export const cancelBookingApi = (id, reason) => api.patch(`/admin/bookings/${id}/cancel`, { reason });
export const exportBookings   = (p)         => api.get('/admin/bookings/export', { params: p, responseType: 'blob' });

// Payments
export const getPayments    = (p)       => api.get('/admin/payments', { params: p });
export const markCODPaid    = (id)      => api.patch(`/admin/payments/${id}/mark-paid`);
export const refundPayment  = (id, amt) => api.post(`/admin/payments/${id}/refund`, amt ? { amount: amt } : {});

// Pricing
export const getPricing     = ()  => api.get('/admin/pricing');
export const updateFares    = (d) => api.patch('/admin/pricing/fares', d);
export const updateSurge    = (w) => api.patch('/admin/pricing/surge', { windows: w });
export const resetPricing   = ()  => api.post('/admin/pricing/reset');
