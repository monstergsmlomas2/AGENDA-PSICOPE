import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as authLogin, logout as authLogout, getToken, isAuthenticated, getUserFromToken } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const tokenData = getUserFromToken();
    return tokenData ? { id: tokenData.sub, email: tokenData.email } : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token válido al montar
    const token = getToken();
    if (token) {
      const tokenData = getUserFromToken();
      if (tokenData) {
        // Verificar expiración
        const exp = tokenData.exp * 1000; // convertir a ms
        if (Date.now() >= exp) {
          // Token expirado
          localStorage.removeItem('psicope_token');
          setUser(null);
        } else {
          setUser({ id: tokenData.sub, email: tokenData.email });
        }
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authLogin(email, password);
    const tokenData = getUserFromToken();
    setUser({ id: tokenData.sub, email: tokenData.email });
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

export default AuthContext;
