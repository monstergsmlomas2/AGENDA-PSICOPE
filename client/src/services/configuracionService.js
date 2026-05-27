const handleResponse = async (res) => {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }
  return res.json();
};

export const getConfiguracionNotificaciones = async () => {
  try {
    const res = await fetch('/configuracion/notificaciones');
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al obtener configuración de notificaciones:", error);
    return null;
  }
};

export const updateConfiguracionNotificaciones = async (data) => {
  try {
    const res = await fetch('/configuracion/notificaciones', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al actualizar configuración de notificaciones:", error);
    return null;
  }
};
