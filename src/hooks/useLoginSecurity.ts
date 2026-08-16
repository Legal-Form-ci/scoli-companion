import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Device fingerprint key - consistent across the app
const FINGERPRINT_KEY = 'izy_device_fingerprint';
const FINGERPRINT_TS_KEY = 'izy_device_fingerprint_ts';

// Login security alerts - ENABLED for trusted device notifications
// Alerts are shown on OTHER devices when a new login occurs
// The device that just logged in will NOT see the alert (fingerprint filtering)
const LOGIN_SECURITY_ALERTS_ENABLED = true;

export const useLoginSecurity = () => {
  const { user } = useAuth();

  // Get device info - unique fingerprint for this device
  const getDeviceInfo = useCallback(() => {
    const ua = navigator.userAgent;
    let device = 'Navigateur inconnu';
    
    if (ua.includes('Chrome') && !ua.includes('Edge')) device = 'Chrome';
    else if (ua.includes('Firefox')) device = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) device = 'Safari';
    else if (ua.includes('Edge')) device = 'Edge';
    else if (ua.includes('Opera')) device = 'Opera';
    
    const platform = navigator.platform || 'Appareil inconnu';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    const deviceType = isMobile ? 'Mobile' : 'Desktop';
    
    return `${device} sur ${platform} (${deviceType})`;
  }, []);

  // Generate a unique device fingerprint - more robust version
  const getDeviceFingerprint = useCallback(() => {
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const screen = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const colorDepth = window.screen.colorDepth;
    const hardwareConcurrency = navigator.hardwareConcurrency || 'unknown';
    
    // Create a more unique hash-like string for this device
    const raw = `${ua}|${platform}|${language}|${screen}|${timezone}|${colorDepth}|${hardwareConcurrency}`;
    const fingerprint = btoa(raw).replace(/[^a-zA-Z0-9]/g, '').slice(0, 48);
    return fingerprint;
  }, []);

  // Get stored fingerprint (from localStorage)
  const getStoredFingerprint = useCallback(() => {
    return localStorage.getItem(FINGERPRINT_KEY) || '';
  }, []);

  // Store fingerprint in localStorage - call this BEFORE login actions
  const storeDeviceFingerprint = useCallback(() => {
    const fingerprint = getDeviceFingerprint();
    localStorage.setItem(FINGERPRINT_KEY, fingerprint);
    localStorage.setItem(FINGERPRINT_TS_KEY, Date.now().toString());
    return fingerprint;
  }, [getDeviceFingerprint]);

  // Initialize fingerprint if not already stored (call on app load)
  const initializeFingerprint = useCallback(() => {
    const existing = localStorage.getItem(FINGERPRINT_KEY);
    if (!existing) {
      return storeDeviceFingerprint();
    }
    return existing;
  }, [storeDeviceFingerprint]);

  // Check if this notification is for the current device
  const isNotificationForCurrentDevice = useCallback((notificationData: Record<string, unknown> | null) => {
    if (!notificationData) return false;
    
    const currentFingerprint = getStoredFingerprint();
    const originFingerprint = notificationData.origin_device_fingerprint as string | undefined;
    
    // If fingerprints match, this notification is for the current device
    if (originFingerprint && currentFingerprint && originFingerprint === currentFingerprint) {
      return true;
    }
    
    return false;
  }, [getStoredFingerprint]);

  // Send push notification to OTHER devices (not the current one)
  const sendLoginPushNotification = useCallback(async (
    userId: string, 
    deviceInfo: string, 
    ipAddress: string, 
    currentDeviceFingerprint: string,
    sessionId: string
  ) => {
    if (!LOGIN_SECURITY_ALERTS_ENABLED) return;
    try {
      // Store notification in database for in-app display on OTHER devices
      // The notification includes the current device fingerprint so we can filter it out
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: userId,
        type: 'security',
        title: 'Nouvelle connexion détectée',
        message: `Une connexion a été détectée depuis ${deviceInfo}. Est-ce vous ?`,
        data: {
          type: 'security',
          requires_confirmation: true,
          device_info: deviceInfo,
          ip_address: ipAddress,
          origin_device_fingerprint: currentDeviceFingerprint, // The device that triggered this
          session_id: sessionId, // For blocking
          created_at: new Date().toISOString()
        },
        is_read: false
      });

      if (notifError) {
        console.error('[Security] Error storing notification:', notifError);
      } else {
        console.log('[Security] Login notification created (will be shown on OTHER devices only)');
      }
    } catch (error) {
      console.error('[Security] Failed to send login notification:', error);
    }
  }, []);

  // Record login session - IMPORTANT: fingerprint is stored FIRST
  const recordLoginSession = useCallback(async (userId: string) => {
    try {
      const deviceInfo = getDeviceInfo();
      
      // CRITICAL: Store fingerprint BEFORE creating session/notification
      const deviceFingerprint = storeDeviceFingerprint();
      
      // Small delay to ensure localStorage is updated
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Get IP from a service
      let ipAddress = 'Non disponible';
      try {
        const response = await fetch('https://api.ipify.org?format=json', { 
          signal: AbortSignal.timeout(3000) 
        });
        const data = await response.json();
        ipAddress = data.ip;
      } catch {
        console.log('[Security] Could not fetch IP');
      }

      // Create login session (trigger is now empty - we handle notification ourselves)
      const { data: sessionData, error } = await supabase
        .from('login_sessions')
        .insert({
          user_id: userId,
          device_info: deviceInfo,
          ip_address: ipAddress
        })
        .select()
        .single();

      if (error) {
        console.error('[Security] Error recording login session:', error);
        return;
      }

      // Alerts intentionally disabled: keep only the audit trail (login_sessions).
      if (LOGIN_SECURITY_ALERTS_ENABLED) {
        await sendLoginPushNotification(
          userId,
          deviceInfo,
          ipAddress,
          deviceFingerprint,
          sessionData.id
        );
      }
      
    } catch (error) {
      console.error('[Security] Error in recordLoginSession:', error);
    }
  }, [getDeviceInfo, storeDeviceFingerprint, sendLoginPushNotification]);

  // Check for blocked sessions
  const checkBlockedSessions = useCallback(async () => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('login_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_blocked', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      return data && data.length > 0;
    } catch (error) {
      console.error('[Security] Error checking blocked sessions:', error);
      return false;
    }
  }, [user]);

  // Get pending confirmation sessions (for OTHER devices only)
  const getPendingConfirmations = useCallback(async () => {
    if (!user) return [];

    const currentFingerprint = getStoredFingerprint();

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'security')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter: only show notifications that are NOT from the current device
      return data?.filter(n => {
        const notifData = n.data as Record<string, unknown> | null;
        if (!notifData?.requires_confirmation) return false;
        
        // If this notification was triggered by the current device, don't show it here
        const originFingerprint = notifData?.origin_device_fingerprint as string | undefined;
        if (originFingerprint && originFingerprint === currentFingerprint) {
          return false; // Don't show on the device that just logged in
        }
        
        return true;
      }) || [];
    } catch (error) {
      console.error('[Security] Error getting pending confirmations:', error);
      return [];
    }
  }, [user, getStoredFingerprint]);

  // Block a login session (called when user clicks "Not me")
  const blockLoginSession = useCallback(async (sessionId: string) => {
    try {
      console.log('[Security] Blocking session via RPC:', sessionId);
      
      // Use server-side RPC function for secure session revocation
      const { data, error } = await supabase.rpc('revoke_blocked_session', {
        _session_id: sessionId
      });

      if (error) {
        console.error('[Security] Error blocking session:', error);
        // Fallback to direct update
        const { error: fallbackError } = await supabase
          .from('login_sessions')
          .update({
            is_blocked: true,
            is_confirmed: false,
            confirmed_at: new Date().toISOString()
          })
          .eq('id', sessionId);
        
        if (fallbackError) {
          console.error('[Security] Fallback also failed:', fallbackError);
          return false;
        }
      }
      
      console.log('[Security] Session blocked successfully');
      return true;
    } catch (error) {
      console.error('[Security] Error blocking session:', error);
      return false;
    }
  }, []);

  // Confirm a login session (called when user clicks "Yes, it's me")
  const confirmLoginSession = useCallback(async (sessionId: string) => {
    try {
      console.log('[Security] Confirming session:', sessionId);
      
      const { error } = await supabase
        .from('login_sessions')
        .update({
          is_confirmed: true,
          is_blocked: false,
          confirmed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('[Security] Error confirming session:', error);
        return false;
      }
      
      console.log('[Security] Session confirmed successfully');
      return true;
    } catch (error) {
      console.error('[Security] Error confirming session:', error);
      return false;
    }
  }, []);

  // Add device to trusted devices
  const trustDevice = useCallback(async (sessionId: string) => {
    // Mark session as confirmed
    const confirmed = await confirmLoginSession(sessionId);
    if (confirmed) {
      // Store trusted device fingerprint
      const fingerprint = getDeviceFingerprint();
      const trustedDevices = JSON.parse(localStorage.getItem('trusted_devices') || '[]');
      if (!trustedDevices.includes(fingerprint)) {
        trustedDevices.push(fingerprint);
        localStorage.setItem('trusted_devices', JSON.stringify(trustedDevices));
      }
    }
    return confirmed;
  }, [confirmLoginSession, getDeviceFingerprint]);

  return {
    recordLoginSession,
    checkBlockedSessions,
    getPendingConfirmations,
    getDeviceInfo,
    getDeviceFingerprint,
    getStoredFingerprint,
    storeDeviceFingerprint,
    initializeFingerprint,
    isNotificationForCurrentDevice,
    sendLoginPushNotification,
    blockLoginSession,
    confirmLoginSession,
    trustDevice
  };
};
