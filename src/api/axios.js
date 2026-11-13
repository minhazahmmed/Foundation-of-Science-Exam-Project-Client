import axios from 'axios';

export const TOKEN_KEY = 'fos_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// প্রতিটা রিকোয়েস্টের সাথে লগইন টোকেন পাঠায়
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// টোকেনের মেয়াদ শেষ হলে লগইন পেজে পাঠিয়ে দেয়
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isLoginCall && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

// যেকোনো error থেকে দেখানোর মতো বাংলা মেসেজ বের করে
export function getErrorMessage(error) {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.request) return 'ইন্টারনেট সংযোগ চেক করো, সার্ভারে পৌঁছানো যাচ্ছে না';
  return error.message || 'কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করো';
}

export default api;
