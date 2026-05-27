const handleResponse = async (res) => {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }
  return res.json();
};

export const getPacientes = async () => {
  try {
    const res = await fetch('/pacientes');
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    return [];
  }
};

export const getPacienteById = async (id) => {
  try {
    const res = await fetch(`/pacientes/${id}`);
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al obtener paciente:", error);
    return null;
  }
};

export const crearPaciente = async (data) => {
  const res = await fetch('/pacientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await handleResponse(res);
};

export const actualizarPaciente = async (id, data) => {
  const res = await fetch(`/pacientes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await handleResponse(res);
};

export const eliminarPaciente = async (id) => {
  try {
    const res = await fetch(`/pacientes/${id}`, { method: 'DELETE' });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al eliminar paciente:", error);
    return null;
  }
};

export const guardarEntrevista = async (id, entrevistaData) => {
  try {
    const res = await fetch(`/pacientes/${id}/entrevista`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entrevista: entrevistaData }),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al guardar entrevista:", error);
    return null;
  }
};

// ==========================================
// FUNCIONES: SESIONES
// ==========================================

export const getSesiones = async (pacienteId) => {
  try {
    const res = await fetch(`/pacientes/${pacienteId}/sesiones`);
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al obtener sesiones:", error);
    return [];
  }
};

export const crearSesion = async (pacienteId, data) => {
  const res = await fetch(`/pacientes/${pacienteId}/sesiones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await handleResponse(res);
};

export const actualizarSesion = async (pacienteId, sesionId, data) => {
  const res = await fetch(`/pacientes/${pacienteId}/sesiones/${sesionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await handleResponse(res);
};

export const eliminarSesion = async (pacienteId, sesionId) => {
  try {
    const res = await fetch(`/pacientes/${pacienteId}/sesiones/${sesionId}`, {
      method: 'DELETE',
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al eliminar sesión:", error);
    return null;
  }
};

export const getPacientesSinSesion = async () => {
  try {
    const res = await fetch('/pacientes/sin-sesion-reciente');
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al obtener pacientes sin sesión reciente:", error);
    return [];
  }
};

export const enviarRecordatorioSeguimiento = async (pacienteId) => {
  try {
    const res = await fetch(`/pacientes/${pacienteId}/recordatorio-seguimiento`, {
      method: 'POST',
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al enviar recordatorio de seguimiento:", error);
    throw error;
  }
};