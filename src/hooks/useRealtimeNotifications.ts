import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean | null;
  created_at: string | null;
  data: unknown;
}

// Consistent fingerprint key with useLoginSecurity
const FINGERPRINT_KEY = 'izy_device_fingerprint';

export const useRealtimeNotifications = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Get current device fingerprint from localStorage
  const getCurrentDeviceFingerprint = useCallback(() => {
    return localStorage.getItem(FINGERPRINT_KEY) || '';
  }, []);

  // Check if a security notification originated from THIS device
  const isFromCurrentDevice = useCallback((notificationData: Record<string, unknown> | null) => {
    if (!notificationData) return false;
    
    const currentFingerprint = getCurrentDeviceFingerprint();
    const originFingerprint = notificationData.origin_device_fingerprint as string | undefined;
    
    // Match fingerprints
    if (originFingerprint && currentFingerprint && originFingerprint === currentFingerprint) {
      return true;
    }
    
    // Also check timing - if notification was just created and no fingerprint, likely same device
    const createdAt = notificationData.created_at as string | undefined;
    if (createdAt && !currentFingerprint) {
      const notifTime = new Date(createdAt).getTime();
      const now = Date.now();
      // Within 10 seconds = likely same device
      if (now - notifTime < 10000) {
        return true;
      }
    }
    
    return false;
  }, [getCurrentDeviceFingerprint]);

  // Filter out security notifications that originated from THIS device
  const filterSecurityNotifications = useCallback((notifs: Notification[]) => {
    return notifs.filter(n => {
      // If it's not a security notification, include it
      if (n.type !== 'security') return true;
      
      const data = n.data as Record<string, unknown> | null;
      
      // If it doesn't require confirmation, include it
      if (!data?.requires_confirmation) return true;
      
      // If this notification was triggered by the current device, exclude it
      if (isFromCurrentDevice(data)) {
        console.log('[Notifications] Filtering out security notification from current device');
        return false;
      }
      
      return true;
    });
  }, [isFromCurrentDevice]);

  // Fetch existing notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter out security notifications from current device
      const filteredData = filterSecurityNotifications(data || []);

      setNotifications(filteredData);
      setUnreadCount(filteredData.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, filterSecurityNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [user]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to new notifications for this user
    const channel = supabase
      .channel('user-notifications-' + user.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          const data = newNotification.data as Record<string, unknown> | null;
          
          // If it's a security notification from THIS device, ignore it completely
          if (newNotification.type === 'security' && data?.requires_confirmation) {
            if (isFromCurrentDevice(data)) {
              console.log('[Notifications] Ignoring security alert - this is the device that just logged in');
              return; // Don't show on the device that just logged in
            }
          }
          
          // Add to state
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast for security alerts specifically
          if (newNotification.type === 'security') {
            toast({
              title: '🔐 ' + newNotification.title,
              description: newNotification.message,
              variant: 'destructive',
            });
          } else {
            toast({
              title: newNotification.title,
              description: newNotification.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, toast, isFromCurrentDevice]);

  // Subscribe to order updates for admins
  useEffect(() => {
    if (!user || !isAdmin) return;

    const channel = supabase
      .channel('admin-orders-' + user.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newOrder = payload.new as { id: string; total_amount: number };
          
          toast({
            title: 'Nouvelle commande !',
            description: `Commande #${newOrder.id.slice(0, 8)} - ${newOrder.total_amount.toLocaleString()} FCFA`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
        },
        (payload) => {
          const payment = payload.new as { id: string; status: string; amount: number };
          
          if (payment.status === 'completed') {
            toast({
              title: 'Paiement confirmé !',
              description: `Paiement de ${payment.amount.toLocaleString()} FCFA reçu`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, toast]);

  // Get security notifications requiring confirmation (already filtered for current device)
  const securityNotifications = notifications.filter(n => {
    const data = n.data as Record<string, unknown> | null;
    return n.type === 'security' && data?.requires_confirmation === true && !n.is_read;
  });

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
    securityNotifications,
  };
};
