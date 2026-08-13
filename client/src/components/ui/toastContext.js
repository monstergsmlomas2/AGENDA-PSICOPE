import { createContext, useContext } from 'react';

// Contexto y hook separados del componente Toast para que react-refresh (HMR)
// funcione bien: los archivos de componentes solo deben exportar componentes.

export const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
