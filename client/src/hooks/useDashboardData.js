import { useState, useEffect, useCallback } from 'react';
import { getPacientes, getPacientesSinSesionReciente } from '../services/pacientesService';
import { getTurnos } from '../services/turnosService';
import { getPagos } from '../services/pagosService';
import {
  getIngresosMensuales,
  getSesionesSemanales,
  getPacientesPorObraSocial,
  getResumenMesActual,
  getTotalesGlobales,
} from '../services/analyticsService';

// Caché simple en módulo — sobrevive entre renders pero no entre recargas de página
let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 60_000; // 1 minuto

const defaultStats = {
  totalPacientes: 0,
  totalTurnos: 0,
  turnosHoy: [],
  turnosMes: 0,
  ausentesMes: 0,
  proximos7Dias: [],
};

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(defaultStats);
  const [pagosPendientes, setPagosPendientes] = useState([]);
  const [sinSesionReciente, setSinSesionReciente] = useState([]);

  // Datos de analytics
  const [ingresosMensuales, setIngresosMensuales] = useState([]);
  const [sesionesSemanales, setSesionesSemanales] = useState([]);
  const [pacientesPorObraSocial, setPacientesPorObraSocial] = useState([]);
  const [resumenMes, setResumenMes] = useState({
    sesiones_este_mes: 0,
    sesiones_mes_anterior: 0,
    ingresos_este_mes: 0,
    ingresos_mes_anterior: 0,
    pacientes_activos: 0,
    turnos_pendientes: 0,
  });

  const cargarData = useCallback(async (omitirCache = false) => {
    // Verificar caché (a menos que se solicite omitirlo)
    if (!omitirCache) {
      const now = Date.now();
      if (_cache && now - _cacheTs < CACHE_TTL) {
        setStats(_cache.stats);
        setPagosPendientes(_cache.pagosPendientes);
        setSinSesionReciente(_cache.sinSesionReciente);
        setIngresosMensuales(_cache.ingresosMensuales);
        setSesionesSemanales(_cache.sesionesSemanales);
        setPacientesPorObraSocial(_cache.pacientesPorObraSocial);
        setResumenMes(_cache.resumenMes);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const hoy = new Date();
      const hace3Meses = new Date(hoy);
      hace3Meses.setMonth(hoy.getMonth() - 3);
      const en30Dias = new Date(hoy);
      en30Dias.setDate(hoy.getDate() + 30);

      const desde = hace3Meses.toISOString().split('T')[0];
      const hasta = en30Dias.toISOString().split('T')[0];

      const [
        dataPacientes,
        dataTurnos,
        pagosPendientesData,
        pagosDeudaData,
        ingresos,
        sesiones,
        obrasSociales,
        resumen,
        sinSesionData,
        totales,
      ] = await Promise.all([
        getPacientes(),
        getTurnos({ desde, hasta }),
        getPagos({ estado: 'pendiente' }),
        getPagos({ estado: 'deuda' }),
        getIngresosMensuales(),
        getSesionesSemanales(),
        getPacientesPorObraSocial(),
        getResumenMesActual(),
        getPacientesSinSesionReciente(),
        getTotalesGlobales(),
      ]);

      const turnos = Array.isArray(dataTurnos) ? dataTurnos : [];

      const hoyStr = new Date().toISOString().split('T')[0];
      const turnosHoy = turnos
        .filter((t) => {
          const fechaTurno = t.fecha ? t.fecha.substring(0, 10) : '';
          return fechaTurno === hoyStr;
        })
        .sort((a, b) => a.hora.localeCompare(b.hora));

      const mesActual = hoyStr.substring(0, 7);
      const turnosMes = turnos.filter((t) => t.fecha && t.fecha.startsWith(mesActual)).length;
      const ausentesMes = turnos.filter(
        (t) => t.fecha && t.fecha.startsWith(mesActual) && t.estado === 'inasistencia'
      ).length;

      const hoyDate = new Date();
      const dentroDe7 = new Date();
      dentroDe7.setDate(hoyDate.getDate() + 7);
      const proximos7Dias = turnos
        .filter((t) => {
          if (!t.fecha) return false;
          const fd = new Date(t.fecha + 'T12:00:00Z');
          return fd >= hoyDate && fd <= dentroDe7;
        })
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

      const newStats = {
        totalPacientes: Array.isArray(dataPacientes) ? dataPacientes.length : 0,
        totalTurnos: totales?.total_turnos ?? turnos.length,
        turnosHoy,
        turnosMes,
        ausentesMes: totales?.ausentes_mes ?? ausentesMes,
        proximos7Dias,
      };

      setStats(newStats);

      const newPagos = [
        ...(Array.isArray(pagosPendientesData) ? pagosPendientesData : []),
        ...(Array.isArray(pagosDeudaData) ? pagosDeudaData : []),
      ];
      setPagosPendientes(newPagos);

      const newSinSesion = Array.isArray(sinSesionData) ? sinSesionData : [];
      setSinSesionReciente(newSinSesion);

      const newIngresos = Array.isArray(ingresos) ? ingresos : [];
      const newSesiones = Array.isArray(sesiones) ? sesiones : [];
      const newObrasSociales = Array.isArray(obrasSociales) ? obrasSociales : [];
      const newResumen = resumen || {
        sesiones_este_mes: 0, sesiones_mes_anterior: 0,
        ingresos_este_mes: 0, ingresos_mes_anterior: 0,
        pacientes_activos: 0, turnos_pendientes: 0,
      };

      setIngresosMensuales(newIngresos);
      setSesionesSemanales(newSesiones);
      setPacientesPorObraSocial(newObrasSociales);
      setResumenMes(newResumen);

      // Guardar en caché
      _cache = {
        stats: newStats,
        pagosPendientes: newPagos,
        sinSesionReciente: newSinSesion,
        ingresosMensuales: newIngresos,
        sesionesSemanales: newSesiones,
        pacientesPorObraSocial: newObrasSociales,
        resumenMes: newResumen,
      };
      _cacheTs = Date.now();
    } catch (err) {
      setError('No se pudieron cargar los datos del dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarData();
  }, [cargarData]);

  const recargar = useCallback(() => {
    // Limpiar caché forzando refetch completo
    _cache = null;
    _cacheTs = 0;
    cargarData(true);
  }, [cargarData]);

  return {
    loading,
    error,
    stats,
    pagosPendientes,
    sinSesionReciente,
    ingresosMensuales,
    sesionesSemanales,
    pacientesPorObraSocial,
    resumenMes,
    recargar,
  };
}
