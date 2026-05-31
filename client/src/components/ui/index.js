/**
 * Barrel export — Sistema de Diseño UI
 *
 * Import limpio desde cualquier página/componente:
 *
 *   import { Button, Badge, Card, EmptyState, Skeleton, SkeletonCard, SkeletonTable, ToastProvider, useToast, ErrorState, ConfirmDialog } from '../components/ui';
 *
 *   // O también:
 *   import { Button } from '../components/ui';
 */

export { default as Button } from './Button';
export { default as Badge } from './Badge';
export { default as Card } from './Card';
export { default as EmptyState } from './EmptyState';
export { default as Skeleton, SkeletonCard, SkeletonTable } from './Skeleton';
export { ToastProvider, useToast } from './Toast';
export { default as ErrorState } from './ErrorState';
export { default as ConfirmDialog } from './ConfirmDialog';
export { default as FolderPickerDialog } from './FolderPickerDialog';
