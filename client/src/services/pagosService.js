const handleResponse = async (res) => {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }
  return res.json();
};

export const getPagos = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    if (filtros.paciente_id) params.append('paciente_id', filtros.paciente_id);
    if (filtros.mes) params.append('mes', filtros.mes);
    if (filtros.estado) params.append('estado', filtros.estado);
    const query = params.toString();
    const res = await fetch(`/pagos${query ? '?' + query : ''}`);
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    return [];
  }
};

export const getResumenMes = async (mes = null) => {
  try {
    const params = mes ? `?mes=${mes}` : '';
    const res = await fetch(`/pagos/resumen-mes${params}`);
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al obtener resumen mensual:", error);
    return { total_pagos: 0, total_cobrado: 0, total_pendiente: 0, total_facturado: 0 };
  }
};

export const crearPago = async (data) => {
  try {
    const res = await fetch('/pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al crear pago:", error);
    return null;
  }
};

export const actualizarPago = async (id, data) => {
  try {
    const res = await fetch(`/pagos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al actualizar pago:", error);
    return null;
  }
};

export const eliminarPago = async (id) => {
  try {
    const res = await fetch(`/pagos/${id}`, { method: 'DELETE' });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error al eliminar pago:", error);
    return null;
  }
};
