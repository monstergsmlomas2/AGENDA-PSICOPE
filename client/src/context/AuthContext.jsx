import { useState, useCallback } from 'react';
import { login as authLogin, logout as authLogout, getToken, getUserFromToken } from '../services/authService.js';
import { AuthContext } from './useAuth.js';

// Lee y valida el token de forma síncrona (expiración incluida) para
// inicializar el estado sin necesidad de un useEffect al montar.
function leerUsuarioInicial() {
  const token = getToken();
  if (!token) return null;
  const tokenData = getUserFromToken();
  if (!tokenData) return null;
  if (tokenData.exp && Date.now() >= tokenData.exp * 1000) {
    // Token expirado
    localStorage.removeItem('psicope_token');
    return null;
  }
  return { id: tokenData.sub, email: tokenData.email };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(leerUsuarioInicial);
  // La validación es síncrona, así que nunca hay estado de carga real.
  const loading = false;

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

