import api from './axios.js';

export const listTeachers = () => api.get('/teachers').then((r) => r.data);
export const approveTeacher = (id) => api.post(`/teachers/${id}/approve`).then((r) => r.data);
export const rejectTeacher = (id) => api.post(`/teachers/${id}/reject`).then((r) => r.data);
export const removeTeacher = (id) => api.post(`/teachers/${id}/remove`).then((r) => r.data);
