import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API calls
export const registerUser = (userData) => api.post('/users/register', userData);
export const loginUser = (credentials) => api.post('/users/login', credentials);
export const getUserProfile = () => api.get('/users/profile');
export const updateUserProfile = (userData) => api.put('/users/profile', userData);

// Chat API calls
export const createConversation = (data) => api.post('/chats', data);
export const getConversations = () => api.get('/chats');
export const getConversationById = (id) => api.get(`/chats/${id}`);
export const updateConversation = (id, data) => api.put(`/chats/${id}`, data);
export const deleteConversation = (id) => api.delete(`/chats/${id}`);
export const addMessage = (id, message) => api.post(`/chats/${id}/messages`, { content: message });

export default api;