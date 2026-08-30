import axios from 'axios';


const API_URL = 'https://expandir-terapiaintegrativa-production.up.railway.app/api';

console.log('🔧 API_URL sendo usada:', API_URL);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(
    (config) => {
        console.log('📤 Fazendo requisição para:', config.url);
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        console.log('📥 Resposta recebida:', response.status);
        return response;
    },
    (error) => {
        console.error('❌ Erro na resposta:', error.response?.status);
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;