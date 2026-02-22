import { useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

/**
 * Shows a one-time welcome message on first launch.
 * Uses a ref to prevent double-firing in StrictMode.
 */
export function useWelcomeMessage(): void {
  const { settings, setSetting } = useSettings();
  const { showToast } = useToast();
  const shownRef = useRef(false);

  useEffect(() => {
    if (!settings.welcomeShown && !shownRef.current) {
      shownRef.current = true;
      const timer = setTimeout(() => {
        showToast(
          'Welcome! Open a file (Cmd+O) or start typing. Cmd+Scroll to zoom. Cmd+\\ to split.',
          'info',
          6000
        );
        setSetting('welcomeShown', true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [settings.welcomeShown, showToast, setSetting]);
}
