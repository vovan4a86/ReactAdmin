import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Общий API клиент
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// Token interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ============ ADMIN API ============
export const adminAPI = {
    // Dashboard
    getDashboard: () => api.get('/admin/dashboard'),
    getStats: () => api.get('/admin/dashboard/stats'),
    getAnalytics: () => api.get('/admin/dashboard/analytics'),

    // Users CRUD
    getUsers: (params) => api.get('/admin/users', { params }),
    getUser: (id) => api.get(`/admin/users/${id}`),
    createUser: (data) => api.post('/admin/users', data),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),

    // User actions
    toggleUserStatus: (id) => api.post(`/admin/users/${id}/toggle-status`),
    changeUserRole: (id, role) => api.post(`/admin/users/${id}/change-role`, { role }),
    impersonateUser: (id) => api.post(`/admin/users/${id}/impersonate`),
    exportUsers: () => api.get('/admin/users/export'),

    // Settings
    getSettings: () => api.get('/admin/settings'),
    updateSettings: (data) => api.put('/admin/settings', data),

    // Activity
    getActivityLog: (params) => api.get('/admin/activity-log', { params }),
};

// ============ USER PROFILE API ============
export const profileAPI = {
    getProfile: () => api.get('/profile'),
    updateProfile: (data) => api.put('/profile', data),
    updatePassword: (data) => api.put('/profile/password', data),
    updateAvatar: (formData) => api.put('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    deleteAccount: (password) => api.delete('/profile', { data: { password } }),
    getDashboard: () => api.get('/dashboard'),
};

// ============ AUTH API ============
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (data) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
};

export default api;