// Caché simple en módulo — evita refetch innecesario de la lista de obras sociales
let _obrasSocialesCache = null;

const handleResponse = async (res) => {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }
  return res.json();
};

export const getObrasSociales = async () => {
  if (_obrasSocialesCache) return _obrasSocialesCache;
  try {
    const res = await fetch('/obras-sociales');
    const data = await handleResponse(res);
    _obrasSocialesCache = data;
    return data;
  } catch (error) {
    console.error("Error al obtener obras sociales:", error);
    return [];
  }
};

export const getObraSocial = async (id) => {
  try {
    const res = await fetch(`/obras-sociales/${id}`);
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al obtener obra social:", error);
    return null;
  }
};

export const crearObraSocial = async (data) => {
  try {
    const res = await fetch('/obras-sociales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleResponse(res);
    // Invalidar caché al crear una nueva obra social
    _obrasSocialesCache = null;
    return result;
  } catch (error) {
    console.error("Error al crear obra social:", error);
    return null;
  }
};

export const actualizarObraSocial = async (id, data) => {
  try {
    const res = await fetch(`/obras-sociales/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleResponse(res);
    // Invalidar caché al actualizar
    _obrasSocialesCache = null;
    return result;
  } catch (error) {
    console.error("Error al actualizar obra social:", error);
    return null;
  }
};

export const eliminarObraSocial = async (id) => {
  try {
    const res = await fetch(`/obras-sociales/${id}`, { method: 'DELETE' });
    const result = await handleResponse(res);
    // Invalidar caché al eliminar
    _obrasSocialesCache = null;
    return result;
  } catch (error) {
    console.error("Error al eliminar obra social:", error);
    return null;
  }
};
