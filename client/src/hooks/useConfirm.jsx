import { useState, useCallback } from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog';

/**
 * useConfirm — hook que gestiona un modal de confirmación y devuelve una Promise<boolean>.
 *
 * @example
 *   const { confirm, ConfirmModal } = useConfirm();
 *
 *   const handleDelete = async () => {
 *     const ok = await confirm({
 *       title: 'Eliminar paciente',
 *       message: '¿Estás seguro?',
 *       confirmLabel: 'Eliminar',
 *       variant: 'danger',
 *     });
 *     if (ok) {
 *       // proceder con la eliminación
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleDelete}>Eliminar</button>
 *       <ConfirmModal />
 *     </>
 *   );
 */
export function useConfirm() {
  const [state, setState] = useState({
    isOpen: false,
    resolve: null,
    config: {},
  });

  const confirm = useCallback((config = {}) => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        resolve,
        config,
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    setState((prev) => {
      if (prev.resolve) prev.resolve(false);
      return { isOpen: false, resolve: null, config: {} };
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState((prev) => {
      if (prev.resolve) prev.resolve(true);
      return { isOpen: false, resolve: null, config: {} };
    });
  }, []);

  const ConfirmModal = useCallback(() => {
    if (!state.isOpen) return null;

    return (
      <ConfirmDialog
        isOpen={state.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        {...state.config}
      />
    );
  }, [state.isOpen, state.config, handleClose, handleConfirm]);

  return { confirm, ConfirmModal };
}
