import api from './axios.js';

export const getPublicExam = (code) => api.get(`/exams/public/${code}`).then((r) => r.data);
export const listExams = () => api.get('/exams').then((r) => r.data);
export const getExam = (id) => api.get(`/exams/${id}`).then((r) => r.data);
export const createExam = (body) => api.post('/exams', body).then((r) => r.data);
export const updateExam = (id, body) => api.patch(`/exams/${id}`, body).then((r) => r.data);
export const deleteExam = (id) => api.delete(`/exams/${id}`).then((r) => r.data);
export const getExamAttempts = (id) => api.get(`/exams/${id}/attempts`).then((r) => r.data);
export const getExamAnalysis = (id) => api.get(`/exams/${id}/analysis`).then((r) => r.data);
export const regradeExam = (id) => api.post(`/exams/${id}/regrade`).then((r) => r.data);
