import api from './axios.js';

export const getDemos = () => api.get('/demo').then((r) => r.data);
export const startDemo = (id) => api.get(`/demo/${id}/start`).then((r) => r.data);
export const submitDemo = (id, answers) => api.post(`/demo/${id}/submit`, { answers }).then((r) => r.data);
