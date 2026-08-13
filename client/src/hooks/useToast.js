/**
 * Hook useToast — acceso a notificaciones toast.
 *
 * Re-export desde Toast.jsx para imports limpios.
 *
 * @example
 * import { useToast } from '../hooks/useToast';
 *
 * function MiComponente() {
 *   const toast = useToast();
 *
 *   const handleSave = async () => {
 *     await guardarDatos();
 *     toast.success('Guardado exitoso', 'Los datos se guardaron correctamente.');
 *   };
 *
 *   const handleError = () => {
 *     toast.error('Error', 'Ocurrió un problema al procesar la solicitud.');
 *   };
 * }
 */
export { useToast } from '../components/ui/toastContext';
