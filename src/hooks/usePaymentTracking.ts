import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface Payment {
  id: string;
  status: PaymentStatus;
  amount: number;
  payment_method: string;
  transaction_id: string | null;
  order_id: string | null;
  created_at: string;
  completed_at: string | null;
  user_id: string;
}

interface PaymentLog {
  timestamp: string;
  status: PaymentStatus;
  message: string;
}

interface UsePaymentTrackingOptions {
  paymentId?: string;
  orderId?: string;
  userId?: string;
  enablePolling?: boolean;
  pollingInterval?: number; // in ms
  enableRealtime?: boolean;
}

export const usePaymentTracking = (options: UsePaymentTrackingOptions) => {
  const {
    paymentId,
    orderId,
    userId,
    enablePolling = true,
    pollingInterval = 5000,
    enableRealtime = true,
  } = options;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Add log entry
  const addLog = useCallback((status: PaymentStatus, message: string) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      status,
      message
    }]);
  }, []);

  // Fetch single payment
  const fetchPayment = useCallback(async () => {
    if (!paymentId && !orderId) return;

    try {
      let query = supabase.from('payments').select('*');
      
      if (paymentId) {
        query = query.eq('id', paymentId);
      } else if (orderId) {
        query = query.eq('order_id', orderId);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error('Error fetching payment:', error);
        return;
      }

      if (data) {
        const prevStatus = payment?.status;
        setPayment(data as Payment);
        
        if (prevStatus && prevStatus !== data.status) {
          addLog(data.status as PaymentStatus, `Statut mis à jour: ${data.status}`);
        }
      }
    } catch (error) {
      console.error('Error in fetchPayment:', error);
    } finally {
      setLoading(false);
    }
  }, [paymentId, orderId, payment?.status, addLog]);

  // Fetch all payments for a user (for admin/account views)
  const fetchUserPayments = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching payments:', error);
        return;
      }

      setPayments((data || []) as Payment[]);
    } catch (error) {
      console.error('Error in fetchUserPayments:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch all payments (for admin)
  const fetchAllPayments = useCallback(async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching all payments:', error);
        return;
      }

      setPayments((data || []) as Payment[]);
    } catch (error) {
      console.error('Error in fetchAllPayments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check payment status via edge function
  const checkPaymentStatus = useCallback(async () => {
    if (!paymentId && !orderId) return null;

    try {
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { paymentId, orderId }
      });

      if (error || !data?.success) {
        console.error('Error checking payment status:', error);
        return null;
      }

      if (data.payment) {
        const newStatus = data.payment.status as PaymentStatus;
        const prevStatus = payment?.status;

        setPayment(prev => prev ? { ...prev, ...data.payment } : data.payment);

        if (prevStatus && prevStatus !== newStatus) {
          addLog(newStatus, `Statut vérifié: ${newStatus}`);
        }

        return data.payment;
      }
    } catch (error) {
      console.error('Error in checkPaymentStatus:', error);
    }

    return null;
  }, [paymentId, orderId, payment?.status, addLog]);

  // Start polling
  useEffect(() => {
    if (!enablePolling || (!paymentId && !orderId)) return;

    // Initial fetch
    fetchPayment();
    addLog('pending', 'Suivi du paiement démarré');

    // Set up polling
    pollingRef.current = setInterval(() => {
      checkPaymentStatus();
    }, pollingInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [enablePolling, paymentId, orderId, pollingInterval]);

  // Set up realtime subscription
  useEffect(() => {
    if (!enableRealtime) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    if (paymentId || orderId || userId) {
      channel = supabase
        .channel('payment-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments',
            filter: paymentId 
              ? `id=eq.${paymentId}` 
              : orderId 
                ? `order_id=eq.${orderId}`
                : userId 
                  ? `user_id=eq.${userId}`
                  : undefined
          },
          (payload) => {
            console.log('Realtime payment update:', payload);
            
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              const newPayment = payload.new as Payment;
              
              if (paymentId || orderId) {
                setPayment(newPayment);
                addLog(newPayment.status, `Mise à jour temps réel: ${newPayment.status}`);
              }
              
              // Update payments list
              setPayments(prev => {
                const exists = prev.find(p => p.id === newPayment.id);
                if (exists) {
                  return prev.map(p => p.id === newPayment.id ? newPayment : p);
                }
                return [newPayment, ...prev];
              });
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [enableRealtime, paymentId, orderId, userId, addLog]);

  // Stop polling when payment is completed or failed
  useEffect(() => {
    if (payment?.status === 'completed' || payment?.status === 'failed' || payment?.status === 'cancelled') {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        addLog(payment.status, 'Suivi terminé');
      }
    }
  }, [payment?.status, addLog]);

  // Manual refresh
  const refresh = useCallback(async () => {
    setLoading(true);
    if (paymentId || orderId) {
      await fetchPayment();
    }
    if (userId) {
      await fetchUserPayments();
    }
  }, [paymentId, orderId, userId, fetchPayment, fetchUserPayments]);

  return {
    payment,
    payments,
    loading,
    logs,
    refresh,
    checkPaymentStatus,
    fetchUserPayments,
    fetchAllPayments,
    isCompleted: payment?.status === 'completed',
    isFailed: payment?.status === 'failed',
    isPending: payment?.status === 'pending' || payment?.status === 'processing',
  };
};
