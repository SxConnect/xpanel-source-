import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('xpanel_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('xpanel_token');
            localStorage.removeItem('xpanel_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
