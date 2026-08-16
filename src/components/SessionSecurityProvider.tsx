import { useSessionSecurity } from '@/hooks/useSessionSecurity';

/**
 * Invisible component that activates session security monitoring.
 * Must be placed inside AuthProvider.
 */
export const SessionSecurityProvider = () => {
  useSessionSecurity();
  return null;
};
