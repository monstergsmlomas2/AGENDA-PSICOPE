import { apiGet, apiPost, apiPut, apiDelete } from './api.js';

export const getPagos = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    if (filtros.paciente_id) params.append('paciente_id', filtros.paciente_id);
    if (filtros.mes) params.append('mes', filtros.mes);
    if (filtros.estado) params.append('estado', filtros.estado);
    const query = params.toString();
    return await apiGet(`/pagos${query ? '?' + query : ''}`);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    return [];
  }
};

export const getResumenMes = async (mes = null) => {
  try {
    const params = mes ? `?mes=${mes}` : '';
    return await apiGet(`/pagos/resumen-mes${params}`);
  } catch (error) {
    console.error("Error al obtener resumen mensual:", error);
    return { total_pagos: 0, total_cobrado: 0, total_pendiente: 0, total_facturado: 0 };
  }
};

export const crearPago = async (data) => {
  try {
    return await apiPost('/pagos', data);
  } catch (error) {
    console.error("Error al crear pago:", error);
    return null;
  }
};

export const actualizarPago = async (id, data) => {
  try {
    return await apiPut(`/pagos/${id}`, data);
  } catch (error) {
    console.error("Error al actualizar pago:", error);
    return null;
  }
};

export const eliminarPago = async (id) => {
  try {
    return await apiDelete(`/pagos/${id}`);
  } catch (error) {
    console.error("Error al eliminar pago:", error);
    return null;
  }
};
