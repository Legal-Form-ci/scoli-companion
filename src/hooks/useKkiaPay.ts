import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface KkiaPayConfig {
  amount: number;
  reason: string;
  name?: string;
  email?: string;
  phone?: string;
  sandbox?: boolean;
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  message: string;
  status: PaymentStatus;
}

declare global {
  interface Window {
    openKkiapayWidget: (config: {
      amount: number;
      position?: string;
      callback?: string;
      data?: string;
      theme?: string;
      key: string;
      sandbox?: boolean;
    }) => void;
    addKkiapayListener: (event: string, callback: (data: any) => void) => void;
    removeKkiapayListener: (event: string, callback: (data: any) => void) => void;
  }
}

export const useKkiaPay = () => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Load KkiaPay SDK script
  useEffect(() => {
    if (document.getElementById('kkiapay-sdk')) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'kkiapay-sdk';
    script.src = 'https://cdn.kkiapay.me/k.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      // Don't remove script as it might be needed elsewhere
    };
  }, []);

  const openPaymentWidget = useCallback(
    async (
      config: KkiaPayConfig,
      orderId: string,
      userId: string,
      onSuccess?: (transactionId: string) => void,
      onFailed?: () => void
    ) => {
      if (!isScriptLoaded || !window.openKkiapayWidget) {
        console.error('KkiaPay SDK not loaded');
        return;
      }

      setLoading(true);
      setPaymentStatus('processing');

      // Create payment record first
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          order_id: orderId,
          amount: config.amount,
          payment_method: 'kkiapay',
          status: 'pending',
          metadata: {
            reason: config.reason,
            customer_name: config.name,
            customer_email: config.email,
            customer_phone: config.phone,
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating payment:', error);
        setLoading(false);
        setPaymentStatus('failed');
        return;
      }

      // Persist minimal context for callback reloads
      try {
        localStorage.setItem(
          'kkiapay_pending',
          JSON.stringify({ paymentId: payment.id, orderId, userId, at: Date.now() })
        );
      } catch {
        // ignore
      }

      // Success listener
      const handleSuccess = async (response: { transactionId: string }) => {
        console.log('KkiaPay success:', response);
        setTransactionId(response.transactionId);
        setPaymentStatus('completed');
        setLoading(false);

        // Update payment record
        await supabase
          .from('payments')
          .update({
            status: 'completed',
            transaction_id: response.transactionId,
            completed_at: new Date().toISOString(),
          })
          .eq('id', payment.id);

        // Update order status
        await supabase
          .from('orders')
          .update({ status: 'confirmed', payment_reference: response.transactionId })
          .eq('id', orderId);

        try {
          localStorage.removeItem('kkiapay_pending');
        } catch {
          // ignore
        }

        onSuccess?.(response.transactionId);
        window.removeKkiapayListener?.('success', handleSuccess);
        window.removeKkiapayListener?.('failed', handleFailed);
      };

      // Failed listener
      const handleFailed = async (error: any) => {
        console.log('KkiaPay failed:', error);
        setPaymentStatus('failed');
        setLoading(false);

        await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id);

        try {
          localStorage.removeItem('kkiapay_pending');
        } catch {
          // ignore
        }

        onFailed?.();
        window.removeKkiapayListener?.('success', handleSuccess);
        window.removeKkiapayListener?.('failed', handleFailed);
      };

      // Add listeners
      window.addKkiapayListener?.('success', handleSuccess);
      window.addKkiapayListener?.('failed', handleFailed);

      // Open widget with public key - PRODUCTION MODE
      const publicKey = '193bbb7e7387d1c3ac16ced9d47fe52fad2b228e';

      const callbackUrl =
        window.location.origin +
        `/checkout?payment=success&paymentId=${encodeURIComponent(payment.id)}&orderId=${encodeURIComponent(orderId)}`;

      // Webhook URL for server-side notifications (instant status updates)
      const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kkiapay-webhook`;

      window.openKkiapayWidget({
        amount: config.amount,
        key: publicKey,
        sandbox: false, // Production mode - real payments
        data: JSON.stringify({
          orderId,
          paymentId: payment.id,
          userId,
        }),
        callback: callbackUrl,
      });
      
      console.log('KkiaPay widget opened. Webhook configured at:', webhookUrl);
    },
    [isScriptLoaded]
  );

  const checkPaymentStatus = useCallback(async (
    paymentId?: string,
    orderId?: string
  ) => {
    try {
      let query = supabase.from('payments').select('*');
      
      if (paymentId) {
        query = query.eq('id', paymentId);
      } else if (orderId) {
        query = query.eq('order_id', orderId);
      } else {
        return null;
      }

      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        return null;
      }

      setPaymentStatus(data.status as PaymentStatus);
      setTransactionId(data.transaction_id);

      return {
        id: data.id,
        status: data.status as PaymentStatus,
        transactionId: data.transaction_id,
        amount: data.amount,
        createdAt: data.created_at,
        completedAt: data.completed_at
      };
    } catch (error) {
      console.error('Error checking payment status:', error);
      return null;
    }
  }, []);

  return {
    loading,
    paymentStatus,
    transactionId,
    isScriptLoaded,
    openPaymentWidget,
    checkPaymentStatus,
    setPaymentStatus
  };
};
