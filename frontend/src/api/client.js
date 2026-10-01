import axios from 'axios';

// Create base Axios instance (using relative /api handled by Vite proxy or environment)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // accommodate multi-drone batch upload & inference
});

// Request interceptor: attach bearer token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cocoscout_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauth
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired
      // localStorage.removeItem('cocoscout_token');
    }
    return Promise.reject(error);
  }
);

export default client;
