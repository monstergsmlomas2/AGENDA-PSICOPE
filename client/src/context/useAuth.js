import { createContext, useContext } from 'react';

// Contexto y hook separados de AuthProvider para que react-refresh (HMR)
// funcione bien: los archivos de componentes solo deben exportar componentes.

export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

export default AuthContext;
