import React from 'react';
import { useToast } from '../../context/ToastContext';
import ToastItem from './Toast';

const ToastContainer: React.FC = React.memo(function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div id="toast-container" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
});

export default ToastContainer;
