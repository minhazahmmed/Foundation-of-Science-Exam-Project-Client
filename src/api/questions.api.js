import api from './axios.js';

export const listQuestions = (params) => api.get('/questions', { params }).then((r) => r.data);
export const listChapters = () => api.get('/questions/chapters').then((r) => r.data);
export const createQuestion = (body) => api.post('/questions', body).then((r) => r.data);
export const updateQuestion = (id, body) => api.put(`/questions/${id}`, body).then((r) => r.data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`).then((r) => r.data);
export const bulkCreateQuestions = (body) => api.post('/questions/bulk', body).then((r) => r.data);
