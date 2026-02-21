import React, { useEffect, useState } from 'react';
import type { ToastMessage } from '../../types';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const ICONS: Record<string, string> = {
  success: '\u2713',
  error: '\u2717',
  warning: '\u26A0',
  info: '\u2139',
};

const ToastItem: React.FC<ToastProps> = React.memo(function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`toast toast-${toast.type}${visible ? ' toast-visible' : ''}`}
      role="alert"
    >
      <span className="toast-icon" aria-hidden="true">
        {ICONS[toast.type] || ICONS.info}
      </span>
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-dismiss"
        aria-label="Dismiss notification"
        onClick={handleDismiss}
      >
        &times;
      </button>
    </div>
  );
});

export default ToastItem;
