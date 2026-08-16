import { useState, useEffect } from "react";
import { CheckCircle, Clock, XCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePaymentTracking, PaymentStatus } from "@/hooks/usePaymentTracking";

interface PaymentStatusTrackerProps {
  paymentId?: string;
  orderId?: string;
  userId?: string;
  showLogs?: boolean;
  compact?: boolean;
  onStatusChange?: (status: PaymentStatus) => void;
}

const PaymentStatusTracker = ({
  paymentId,
  orderId,
  userId,
  showLogs = false,
  compact = false,
  onStatusChange
}: PaymentStatusTrackerProps) => {
  const {
    payment,
    loading,
    logs,
    refresh,
    isCompleted,
    isFailed,
    isPending
  } = usePaymentTracking({
    paymentId,
    orderId,
    userId,
    enablePolling: true,
    pollingInterval: 5000,
    enableRealtime: true
  });

  useEffect(() => {
    if (payment?.status && onStatusChange) {
      onStatusChange(payment.status);
    }
  }, [payment?.status, onStatusChange]);

  const getStatusConfig = (status: PaymentStatus | undefined) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle className="text-green-500" size={compact ? 20 : 28} />,
          label: 'Paiement réussi',
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          progress: 100
        };
      case 'failed':
        return {
          icon: <XCircle className="text-destructive" size={compact ? 20 : 28} />,
          label: 'Paiement échoué',
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
          progress: 0
        };
      case 'cancelled':
        return {
          icon: <AlertCircle className="text-orange-500" size={compact ? 20 : 28} />,
          label: 'Paiement annulé',
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
          progress: 0
        };
      case 'processing':
        return {
          icon: <Loader2 className="text-blue-500 animate-spin" size={compact ? 20 : 28} />,
          label: 'En cours de traitement',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          progress: 50
        };
      default:
        return {
          icon: <Clock className="text-yellow-500" size={compact ? 20 : 28} />,
          label: 'En attente',
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
          progress: 25
        };
    }
  };

  const config = getStatusConfig(payment?.status);

  if (loading && !payment) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
        {config.icon}
        <div className="flex-1">
          <Badge className={config.color}>{config.label}</Badge>
          {payment?.amount && (
            <p className="text-sm text-muted-foreground mt-1">
              {new Intl.NumberFormat('fr-FR').format(payment.amount)} FCFA
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={refresh}>
          <RefreshCw size={16} />
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {config.icon}
            Suivi du paiement
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw size={16} />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Statut</span>
          <Badge className={config.color}>{config.label}</Badge>
        </div>

        {/* Progress */}
        <div>
          <Progress value={config.progress} className="h-2" />
        </div>

        {/* Payment details */}
        {payment && (
          <div className="space-y-2 text-sm">
            {payment.amount && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('fr-FR').format(payment.amount)} FCFA
                </span>
              </div>
            )}
            {payment.payment_method && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Méthode</span>
                <span className="font-medium capitalize">{payment.payment_method}</span>
              </div>
            )}
            {payment.transaction_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction</span>
                <span className="font-mono text-xs">{payment.transaction_id}</span>
              </div>
            )}
            {payment.created_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>
                  {new Date(payment.created_at).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Logs */}
        {showLogs && logs.length > 0 && (
          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium mb-2">Historique</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-16">
                    {new Date(log.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentStatusTracker;
