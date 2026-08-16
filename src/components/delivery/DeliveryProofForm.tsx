import { useState, useRef } from 'react';
import { Camera, MapPin, User, FileText, Loader2, CheckCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DeliveryProofFormProps {
  orderId: string;
  proofType: 'pickup' | 'delivery';
  onSuccess: () => void;
  onCancel: () => void;
}

const DeliveryProofForm = ({ orderId, proofType, onSuccess, onCancel }: DeliveryProofFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [recipientPhoto, setRecipientPhoto] = useState<File | null>(null);
  const [recipientPhotoPreview, setRecipientPhotoPreview] = useState<string | null>(null);
  const [cniPhoto, setCniPhoto] = useState<File | null>(null);
  const [cniPhotoPreview, setCniPhotoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const recipientPhotoRef = useRef<HTMLInputElement>(null);
  const cniPhotoRef = useRef<HTMLInputElement>(null);

  const getLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non supportée');
      return;
    }

    setGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocoding (simple fallback address)
      const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      
      setLocation({ lat: latitude, lng: longitude, address });
      toast.success('Position enregistrée');
    } catch (error) {
      console.error('Error getting location:', error);
      toast.error('Impossible d\'obtenir la position');
    }
    setGettingLocation(false);
  };

  const handlePhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (s: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (file: File, folder: string): Promise<string | null> => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${orderId}-${Date.now()}.${fileExt}`;
    const filePath = `${authUser.id}/${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from('article-media') // Reuse existing bucket
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('article-media')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    if (proofType === 'delivery' && !recipientName.trim()) {
      toast.error('Le nom du destinataire est requis');
      return;
    }

    setLoading(true);
    try {
      let recipientPhotoUrl: string | null = null;
      let cniPhotoUrl: string | null = null;

      // Upload photos if provided
      if (recipientPhoto) {
        recipientPhotoUrl = await uploadPhoto(recipientPhoto, 'delivery-proofs/recipient');
      }
      if (cniPhoto) {
        cniPhotoUrl = await uploadPhoto(cniPhoto, 'delivery-proofs/cni');
      }

      // Create delivery proof record
      const { error: proofError } = await supabase
        .from('delivery_proofs')
        .insert({
          order_id: orderId,
          delivery_user_id: user.id,
          proof_type: proofType,
          recipient_name: recipientName || null,
          recipient_photo_url: recipientPhotoUrl,
          recipient_cni_photo_url: cniPhotoUrl,
          location_lat: location?.lat || null,
          location_lng: location?.lng || null,
          location_address: location?.address || null,
          notes: notes || null
        });

      if (proofError) throw proofError;

      const { data: accepted, error: orderError } = await (supabase as any).rpc(
        proofType === 'pickup' ? 'delivery_mark_picked_up' : 'delivery_submit_handoff',
        { _order_id: orderId }
      );

      if (orderError) throw orderError;
      if (!accepted) throw new Error('Commande non autorisée');

      toast.success(proofType === 'pickup' ? 'Réception confirmée' : 'Remise au client soumise — attente confirmation client');
      onSuccess();
    } catch (error) {
      console.error('Error submitting proof:', error);
      toast.error('Erreur lors de la soumission');
    }
    setLoading(false);
  };

  return (
    <Dialog open onOpenChange={() => !loading && onCancel()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {proofType === 'pickup' ? 'Confirmer la réception' : 'Confirmer la livraison'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Position GPS
            </Label>
            {location ? (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                <p className="text-green-700 dark:text-green-300">Position enregistrée</p>
                <p className="text-xs text-muted-foreground">{location.address}</p>
              </div>
            ) : (
              <Button 
                variant="outline" 
                onClick={getLocation} 
                disabled={gettingLocation}
                className="w-full"
              >
                {gettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MapPin className="h-4 w-4 mr-2" />
                )}
                Enregistrer ma position
              </Button>
            )}
          </div>

          {/* Recipient Name (for delivery only) */}
          {proofType === 'delivery' && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nom du destinataire *
              </Label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Nom complet du réceptionnaire"
              />
            </div>
          )}

          {/* Recipient Photo */}
          {proofType === 'delivery' && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Photo du destinataire (optionnel)
              </Label>
              <input
                ref={recipientPhotoRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handlePhotoChange(e, setRecipientPhoto, setRecipientPhotoPreview)}
              />
              {recipientPhotoPreview ? (
                <div className="relative">
                  <img src={recipientPhotoPreview} alt="Destinataire" className="w-full h-32 object-cover rounded-lg" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => { setRecipientPhoto(null); setRecipientPhotoPreview(null); }}
                  >
                    Supprimer
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => recipientPhotoRef.current?.click()}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Prendre une photo
                </Button>
              )}
            </div>
          )}

          {/* CNI Photo */}
          {proofType === 'delivery' && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Photo CNI (optionnel)
              </Label>
              <input
                ref={cniPhotoRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handlePhotoChange(e, setCniPhoto, setCniPhotoPreview)}
              />
              {cniPhotoPreview ? (
                <div className="relative">
                  <img src={cniPhotoPreview} alt="CNI" className="w-full h-32 object-cover rounded-lg" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => { setCniPhoto(null); setCniPhotoPreview(null); }}
                  >
                    Supprimer
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => cniPhotoRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Photo de la pièce d'identité
                </Button>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Commentaires supplémentaires..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryProofForm;
