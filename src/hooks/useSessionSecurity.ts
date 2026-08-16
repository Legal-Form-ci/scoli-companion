import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { recordActivity, isSessionExpired } from '@/utils/security';
import { toast } from 'sonner';

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];
const CHECK_INTERVAL_MS = 60_000; // Check every minute

/**
 * Session security hook:
 * - Auto-logout after 30min inactivity
 * - Monitors user activity
 * - Warns before timeout
 */
export const useSessionSecurity = () => {
  const { user, signOut } = useAuth();
  const warningShownRef = useRef(false);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleActivity = useCallback(() => {
    if (user) {
      recordActivity();
      warningShownRef.current = false;
    }
  }, [user]);

  const handleInactivityLogout = useCallback(async () => {
    if (!user) return;
    
    if (isSessionExpired()) {
      console.log('[Security] Session expired due to inactivity');
      toast.warning('Session expirée par inactivité. Veuillez vous reconnecter.', { duration: 6000 });
      await signOut();
    }
  }, [user, signOut]);

  useEffect(() => {
    if (!user) return;

    // Record initial activity
    recordActivity();

    // Listen for user activity
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Periodically check for inactivity
    checkIntervalRef.current = setInterval(handleInactivityLogout, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [user, handleActivity, handleInactivityLogout]);
};
