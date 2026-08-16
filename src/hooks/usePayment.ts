import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PaymentMethod = 'orange' | 'mtn' | 'moov' | 'wave';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  message: string;
  status: PaymentStatus;
}

interface PaymentStatusResult {
  id: string;
  status: PaymentStatus;
  transactionId: string | null;
  paymentMethod: PaymentMethod;
  amount: number;
  createdAt: string;
  completedAt: string | null;
}

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const initiatePayment = useCallback(async (
    orderId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    phoneNumber: string,
    _userId: string, // Kept for API compatibility, but auth is enforced server-side
    customerEmail?: string,
    customerName?: string
  ): Promise<PaymentResult> => {
    setLoading(true);
    setPaymentStatus('processing');

    try {
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          orderId,
          amount,
          paymentMethod,
          phoneNumber,
          customerEmail,
          customerName
        }
      });

      if (error) {
        console.error('Payment error:', error);
        setPaymentStatus('failed');
        return {
          success: false,
          message: error.message || 'Erreur lors du paiement',
          status: 'failed'
        };
      }

      setTransactionId(data.transactionId);
      setPaymentStatus(data.status);

      return {
        success: data.success,
        paymentId: data.paymentId,
        transactionId: data.transactionId,
        message: data.message,
        status: data.status
      };
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      return {
        success: false,
        message: 'Erreur de connexion',
        status: 'failed'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const checkPaymentStatus = useCallback(async (
    paymentId?: string,
    orderId?: string
  ): Promise<PaymentStatusResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { paymentId, orderId }
      });

      if (error || !data.success) {
        console.error('Error checking payment status:', error);
        return null;
      }

      setPaymentStatus(data.payment.status);
      setTransactionId(data.payment.transactionId);

      return {
        id: data.payment.id,
        status: data.payment.status,
        transactionId: data.payment.transactionId,
        paymentMethod: data.payment.paymentMethod,
        amount: data.payment.amount,
        createdAt: data.payment.createdAt,
        completedAt: data.payment.completedAt
      };
    } catch (error) {
      console.error('Error checking payment status:', error);
      return null;
    }
  }, []);

  const confirmPayment = useCallback(async (
    paymentId: string,
    transactionId: string,
    status: 'completed' | 'failed' | 'cancelled'
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('confirm-payment', {
        body: { paymentId, transactionId, status }
      });

      if (error || !data.success) {
        console.error('Error confirming payment:', error);
        return false;
      }

      setPaymentStatus(status);
      return true;
    } catch (error) {
      console.error('Error confirming payment:', error);
      return false;
    }
  }, []);

  return {
    loading,
    paymentStatus,
    transactionId,
    initiatePayment,
    checkPaymentStatus,
    confirmPayment,
    setPaymentStatus
  };
};
