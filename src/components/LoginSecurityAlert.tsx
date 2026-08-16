import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Monitor, MapPin, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLoginSecurity } from '@/hooks/useLoginSecurity';

interface LoginSecurityAlertProps {
  notification: {
    id: string;
    data: {
      session_id: string;
      ip_address: string | null;
      device_info: string | null;
      requires_confirmation: boolean;
      origin_device_fingerprint?: string;
    } | null;
  };
  onClose: () => void;
}

const LoginSecurityAlert = ({ notification, onClose }: LoginSecurityAlertProps) => {
  const [loading, setLoading] = useState(false);
  const [showTrustPrompt, setShowTrustPrompt] = useState(false);
  const { blockLoginSession, confirmLoginSession, getStoredFingerprint, isNotificationForCurrentDevice } = useLoginSecurity();
  
  const data = notification.data;

  // Check if this alert is for the current device - if so, don't show it
  useEffect(() => {
    if (data && isNotificationForCurrentDevice(data as Record<string, unknown>)) {
      console.log('[Security Alert] This notification is for the current device - auto-closing');
      onClose();
    }
  }, [data, isNotificationForCurrentDevice, onClose]);

  // Double check with fingerprint
  const currentFingerprint = getStoredFingerprint();
  if (data?.origin_device_fingerprint && data.origin_device_fingerprint === currentFingerprint) {
    console.log('[Security Alert] Fingerprint match - not showing alert on origin device');
    return null;
  }

  if (!data?.requires_confirmation) return null;

  const handleConfirm = async (isMe: boolean, trustDevice: boolean = false) => {
    if (loading) return; // guard against double clicks
    setLoading(true);
    
    try {
      if (isMe) {
        // User confirms it's them
        const success = await confirmLoginSession(data.session_id);
        
        if (!success) {
          throw new Error('Failed to confirm session');
        }

        // Mark notification as read
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notification.id);

        if (trustDevice) {
          toast.success('Connexion confirmée et appareil ajouté aux appareils de confiance');
        } else {
          toast.success('Connexion confirmée avec succès');
        }
      } else {
        // User says it's NOT them - BLOCK the session
        console.log('[Security] User clicked "Not me" - blocking session:', data.session_id);
        
        const success = await blockLoginSession(data.session_id);
        
        if (!success) {
          throw new Error('Failed to block session');
        }

        // Mark notification as read
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notification.id);

        // Show strong warning with password change prompt
        toast.warning(
          'Session bloquée ! L\'accès depuis cet appareil a été révoqué.',
          { duration: 8000 }
        );
        
        // Prompt for password change - this is critical for security
        // After blocking, the user should change their password immediately
        setTimeout(() => {
          const shouldChangePassword = window.confirm(
            '⚠️ SÉCURITÉ IMPORTANTE\n\n' +
            'Une connexion suspecte a été bloquée. Pour protéger votre compte, il est fortement recommandé de changer votre mot de passe immédiatement.\n\n' +
            'Voulez-vous changer votre mot de passe maintenant ?'
          );
          
          if (shouldChangePassword) {
            // Redirect to account settings for password change
            window.location.href = '/account?action=change-password';
          }
        }, 500);

        console.log('[Security] Session blocked successfully. Password change recommended.');
      }
    } catch (error) {
      console.error('[Security] Error handling login confirmation:', error);
      toast.error('Erreur lors de la confirmation. Veuillez réessayer.');
    } finally {
      setLoading(false);
      setShowTrustPrompt(false);
      onClose();
    }
  };

  const handleYesItsMe = () => {
    setShowTrustPrompt(true);
  };

  if (showTrustPrompt) {
    return (
      <Dialog open onOpenChange={() => !loading && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Faire confiance à cet appareil ?
            </DialogTitle>
            <DialogDescription>
              Voulez-vous ajouter cet appareil à vos appareils de confiance ? Les futures connexions depuis cet appareil ne déclencheront plus d'alerte.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">
                  {data.device_info || 'Appareil inconnu'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">
                  IP: {data.ip_address || 'Inconnue'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => handleConfirm(true, false)}
              disabled={loading}
              className="flex-1"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Non, juste cette fois'}
            </Button>
            <Button
              onClick={() => handleConfirm(true, true)}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Oui, faire confiance
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={() => !loading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Nouvelle connexion détectée
          </DialogTitle>
          <DialogDescription>
            Une nouvelle connexion a été détectée sur votre compte depuis un autre appareil. Est-ce vous ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">
                {data.device_info || 'Appareil inconnu'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">
                IP: {data.ip_address || 'Inconnue'}
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Si vous ne reconnaissez pas cette connexion, cliquez sur "Ce n'est pas moi" pour <strong>bloquer immédiatement</strong> cette session et sécuriser votre compte.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="destructive"
            onClick={() => handleConfirm(false)}
            disabled={loading}
            className="flex-1"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Ce n'est pas moi
              </>
            )}
          </Button>
          <Button
            onClick={handleYesItsMe}
            disabled={loading}
            className="flex-1"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Oui, c'est moi
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoginSecurityAlert;
