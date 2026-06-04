import { apiGet, apiPut } from './api.js';

export const getConfiguracion = async () => {
  try {
    return await apiGet('/configuracion');
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    return null;
  }
};

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

export const updateConfiguracionWhatsApp = async (data) => {
  try {
    return await apiPut('/configuracion/notificaciones', data);
  } catch (error) {
    console.error("Error al actualizar configuración de WhatsApp:", error);
    return null;
  }
};

export const getHistorialWhatsApp = async () => {
  try {
    return await apiGet('/configuracion/historial-whatsapp');
  } catch (error) {
    console.error("Error al obtener historial de WhatsApp:", error);
    return [];
  }
};

