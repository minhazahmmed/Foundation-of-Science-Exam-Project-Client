import api from './axios.js';

export const startAttempt = (code) => api.post(`/attempts/start/${code}`).then((r) => r.data);
export const saveAnswer = (id, body) => api.patch(`/attempts/${id}/answer`, body).then((r) => r.data);
export const submitAttempt = (id, answers) =>
  api.post(`/attempts/${id}/submit`, { answers }).then((r) => r.data);
export const getMyAttempts = () => api.get('/attempts/mine').then((r) => r.data);
export const getResult = (id) => api.get(`/attempts/${id}/result`).then((r) => r.data);
