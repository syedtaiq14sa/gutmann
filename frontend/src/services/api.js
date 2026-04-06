import axios from 'axios';

if (!process.env.REACT_APP_API_URL) {
  throw new Error(
    '[api] REACT_APP_API_URL is not set. ' +
    'Set it to your backend URL (e.g. https://gutmann-backend.onrender.com/api) ' +
    'in Render → gutmann-frontend → Environment, then redeploy.'
  );
}

const API_URL = process.env.REACT_APP_API_URL;

if (process.env.NODE_ENV === 'production' && (!process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL.includes('localhost'))) {
  console.error('[API] REACT_APP_API_URL is not set or points to localhost in production. Set it to https://gutmann-backend.onrender.com/api');
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
