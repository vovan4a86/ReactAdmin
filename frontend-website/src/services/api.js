import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true, // Для Sanctum cookies
    timeout: 10000, // 10 секунд таймаут
});

// Request interceptor - add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Clear auth data and redirect to login
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');

            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// ============ WEBSITE API (ограниченный) ============
export const websiteAPI = {
    test: () => api.get('/health'),
    // Auth
    login: (credentials) => api.post('/auth/login', credentials),
    register: (data) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),

    // Profile
    getProfile: () => api.get('/profile'),
    updateProfile: (data) => api.put('/profile', data),
    updatePassword: (data) => api.put('/profile/password', data),
    updateAvatar: (formData) => api.put('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    deleteAccount: (password) => api.delete('/profile', { data: { password } }),

    // Dashboard (пользовательский)
    getDashboard: () => api.get('/dashboard'),

    // Нет доступа к /admin/* роутам
};

// Set auth token
export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

export default api;