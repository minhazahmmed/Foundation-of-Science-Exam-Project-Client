import api from './axios.js';

export const startPractice = (attemptId) => api.get(`/practice/start/${attemptId}`).then((r) => r.data);
export const submitPractice = (attemptId, answers, seconds) =>
  api.post(`/practice/${attemptId}/submit`, { answers, seconds }).then((r) => r.data);
export const getPracticeResult = (practiceId) => api.get(`/practice/result/${practiceId}`).then((r) => r.data);
export const getProgress = (attemptId) => api.get(`/practice/progress/${attemptId}`).then((r) => r.data);
