import { apiGet, apiPut } from './api.js';

export const getConfiguracionNotificaciones = async () => {
  try {
    return await apiGet('/configuracion/notificaciones');
  } catch (error) {
    console.error("Error al obtener configuración de notificaciones:", error);
    return null;
  }
};

export const updateConfiguracionNotificaciones = async (data) => {
  try {
    return await apiPut('/configuracion/notificaciones', data);
  } catch (error) {
    console.error("Error al actualizar configuración de notificaciones:", error);
    return null;
  }
};
