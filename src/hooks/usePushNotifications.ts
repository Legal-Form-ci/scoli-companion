import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// VAPID public key from environment (set via Supabase secrets)
const VAPID_PUBLIC_KEY = 'BGDwyJH0CcUA_d3fLnkywQnQr2axB6vDDJRxAqHiAlHhz2oYcU91_GS422RYCU-5mNoiT3uugsYadq37FsU51HM';

// Convert base64 to Uint8Array for applicationServerKey
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) return null;
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('[Push] Service Worker registered:', registration.scope);
      return registration;
    } catch (error) {
      console.error('[Push] Service Worker registration failed:', error);
      return null;
    }
  }, []);

  // Check existing subscription
  const checkSubscription = useCallback(async () => {
    if (!isSupported) return false;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const pm = (registration as any).pushManager;
      if (!pm) return false;
      const subscription = await pm.getSubscription();
      const subscribed = subscription !== null;
      setIsSubscribed(subscribed);
      return subscribed;
    } catch (error) {
      console.error('[Push] Error checking subscription:', error);
      return false;
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) return false;
    
    setLoading(true);
    try {
      // Request permission first
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result !== 'granted') {
        console.log('[Push] Permission denied');
        return false;
      }

      // Register service worker
      await registerServiceWorker();
      const registration = await navigator.serviceWorker.ready;
      const pm = (registration as any).pushManager;
      if (!pm) return false;

      // Subscribe to push
      const subscription = await pm.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log('[Push] Subscription created:', subscription);

      // Extract keys from subscription
      const subscriptionJson = subscription.toJSON();
      const p256dh = subscriptionJson.keys?.p256dh || '';
      const auth = subscriptionJson.keys?.auth || '';

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh,
          auth,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'endpoint'
        });

      if (error) {
        console.error('[Push] Error saving subscription:', error);
        return false;
      }

      setIsSubscribed(true);
      console.log('[Push] Subscription saved successfully');
      return true;
    } catch (error) {
      console.error('[Push] Subscription error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported, user, registerServiceWorker]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) return false;
    
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const pm = (registration as any).pushManager;
      if (!pm) return false;
      const subscription = await pm.getSubscription();
      
      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe();
        
        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
      }

      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('[Push] Unsubscribe error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported, user]);

  // Check subscription on mount
  useEffect(() => {
    if (isSupported && user) {
      checkSubscription();
    }
  }, [isSupported, user, checkSubscription]);

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
    checkSubscription
  };
};
