import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  blockedUntil: Date | null;
}

interface UseRateLimitOptions {
  maxAttempts?: number;
  windowSeconds?: number;
  blockSeconds?: number;
}

export const useRateLimit = (actionType: string, options: UseRateLimitOptions = {}) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const {
    maxAttempts = 5,
    windowSeconds = 300, // 5 minutes
    blockSeconds = 900,  // 15 minutes
  } = options;

  const getIdentifier = useCallback(async (): Promise<string> => {
    // Use user ID if authenticated, otherwise use a fingerprint
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return `user:${user.id}`;
    }
    
    // Generate a simple browser fingerprint for anonymous users
    const fingerprint = [
      navigator.language,
      navigator.platform,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
    ].join('|');
    
    // Hash the fingerprint
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `anon:${hashHex.substring(0, 16)}`;
  }, []);

  const checkRateLimit = useCallback(async (): Promise<RateLimitResult> => {
    setIsChecking(true);
    
    try {
      const identifier = await getIdentifier();
      
      const { data, error } = await supabase.rpc('check_rate_limit', {
        _identifier: identifier,
        _action_type: actionType,
        _max_attempts: maxAttempts,
        _window_seconds: windowSeconds,
        _block_seconds: blockSeconds,
      });

      if (error) {
        console.error('Rate limit check error:', error);
        // On error, allow the action but log it
        return { allowed: true, remainingAttempts: maxAttempts, blockedUntil: null };
      }

      const result = data?.[0] || { allowed: true, remaining_attempts: maxAttempts, blocked_until: null };
      
      const allowed = result.allowed;
      const remaining = result.remaining_attempts ?? maxAttempts;
      const blocked = result.blocked_until ? new Date(result.blocked_until) : null;

      setIsBlocked(!allowed);
      setBlockedUntil(blocked);
      setRemainingAttempts(remaining);

      return {
        allowed,
        remainingAttempts: remaining,
        blockedUntil: blocked,
      };
    } catch (err) {
      console.error('Rate limit error:', err);
      return { allowed: true, remainingAttempts: maxAttempts, blockedUntil: null };
    } finally {
      setIsChecking(false);
    }
  }, [actionType, maxAttempts, windowSeconds, blockSeconds, getIdentifier]);

  const formatBlockedTime = useCallback((date: Date): string => {
    const now = new Date();
    const diff = Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 1000 / 60));
    if (diff === 0) return 'quelques secondes';
    if (diff === 1) return '1 minute';
    return `${diff} minutes`;
  }, []);

  return {
    checkRateLimit,
    isBlocked,
    blockedUntil,
    remainingAttempts,
    isChecking,
    formatBlockedTime,
  };
};

export default useRateLimit;
