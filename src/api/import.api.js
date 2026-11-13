import api from './axios.js';

// ছবি থেকে প্রশ্ন বের করতে ১০-৩০ সেকেন্ড লাগতে পারে, তাই অপেক্ষার সময় বেশি রাখা হয়েছে
export const extractFromImages = (formData) =>
  api.post('/import/from-images', formData, { timeout: 120000 }).then((r) => r.data);
