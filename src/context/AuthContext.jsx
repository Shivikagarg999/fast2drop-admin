import { createContext, useContext, useState, useEffect } from 'react';
import api, { getMeApi, loginApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { setLoading(false); return; }

    getMeApi()
      .then((res) => {
        const u = res.data.data;
        if (u.role !== 'admin') { localStorage.removeItem('adminToken'); }
        else setUser(u);
      })
      .catch(() => localStorage.removeItem('adminToken'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await loginApi({ email, password });
    const { token, user: u } = res.data.data;
    if (u.role !== 'admin') throw new Error('Not an admin account');
    localStorage.setItem('adminToken', token);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
