import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type EntityType = 'product' | 'order' | 'user' | 'article' | 'category' | 'coupon' | 'settings' | 'role';
type ActionType = 'create' | 'update' | 'delete' | 'status_change' | 'login' | 'logout' | 'view';

interface AuditLogData {
  entityType: EntityType;
  entityId?: string;
  action: ActionType;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}

export const useAuditLog = () => {
  const logAction = useCallback(async (data: AuditLogData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get IP and user agent (limited info from browser)
      const userAgent = navigator.userAgent;
      
      await (supabase.from('audit_logs') as any).insert({
        user_id: user.id,
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId || null,
        old_data: data.oldData || null,
        new_data: data.newData || null,
        ip_address: null, // Can't get real IP from browser
        user_agent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  }, []);

  return { logAction };
};

export default useAuditLog;
