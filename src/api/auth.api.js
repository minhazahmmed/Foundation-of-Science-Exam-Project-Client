import api from './axios.js';

export const loginRequest = (body) => api.post('/auth/login', body).then((r) => r.data);
export const registerRequest = (body) => api.post('/auth/register', body).then((r) => r.data);
export const getMe = () => api.get('/auth/me').then((r) => r.data);
