import { useEffect, useMemo, useState } from 'react';
import { getMe, loginRequest, registerRequest } from '../api/auth.api.js';
import { TOKEN_KEY } from '../api/axios.js';
import { AuthContext } from './authContext.js';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // টোকেন থাকলে আগে জেনে নিই লগইনটা এখনো ঠিক আছে কিনা
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    let ignore = false;

    getMe()
      .then((data) => {
        if (!ignore) setUser(data.user);
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const value = useMemo(() => {
    const saveLogin = (data) => {
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      return data.user;
    };

    return {
      user,
      loading,
      login: async (email, password) => saveLogin(await loginRequest({ email, password })),
      register: async (form) => saveLogin(await registerRequest(form)),
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
