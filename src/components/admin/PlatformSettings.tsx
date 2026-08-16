import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Settings, Globe, CreditCard, Truck, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

const PlatformSettings = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Local form state
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .order("key");

    if (!error && data) {
      setSettings(data);
      const values: Record<string, string> = {};
      data.forEach(s => { values[s.key] = s.value; });
      setFormValues(values);
    }
    setLoading(false);
  };

  const updateSetting = async (key: string, value: string) => {
    const existing = settings.find(s => s.key === key);
    
    if (existing) {
      const { error } = await supabase
        .from("platform_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      
      if (error) {
        toast.error("Erreur lors de la mise à jour");
        return false;
      }
    } else {
      const { error } = await supabase
        .from("platform_settings")
        .insert({ key, value });
      
      if (error) {
        toast.error("Erreur lors de l'ajout");
        return false;
      }
    }
    
    return true;
  };

  const handleSaveAll = async () => {
    setSaving(true);
    let success = true;

    for (const [key, value] of Object.entries(formValues)) {
      const result = await updateSetting(key, value);
      if (!result) success = false;
    }

    if (success) {
      toast.success("Paramètres enregistrés avec succès");
      fetchSettings();
    }
    setSaving(false);
  };

  const getValue = (key: string, defaultValue: string = "") => {
    return formValues[key] ?? defaultValue;
  };

  const setValue = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Paramètres de la Plateforme</h1>
          <p className="text-muted-foreground">Configurez les paramètres généraux de Scoly</p>
        </div>
        <Button onClick={handleSaveAll} disabled={saving}>
          <Save size={18} />
          {saving ? "Enregistrement..." : "Enregistrer tout"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Settings size={16} className="mr-2" />
            Général
          </TabsTrigger>
          <TabsTrigger value="shipping">
            <Truck size={16} className="mr-2" />
            Livraison
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard size={16} className="mr-2" />
            Paiement
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell size={16} className="mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>Paramètres de base de la plateforme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nom de la plateforme</Label>
                  <Input 
                    value={getValue("platform_name", "Scoly")} 
                    onChange={(e) => setValue("platform_name", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Email de contact</Label>
                  <Input 
                    type="email"
                    value={getValue("contact_email", "")} 
                    onChange={(e) => setValue("contact_email", e.target.value)}
                    placeholder="contact@scoly.ci"
                  />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input 
                    value={getValue("contact_phone", "")} 
                    onChange={(e) => setValue("contact_phone", e.target.value)}
                    placeholder="+225 XX XX XX XX"
                  />
                </div>
                <div>
                  <Label>Adresse</Label>
                  <Input 
                    value={getValue("address", "")} 
                    onChange={(e) => setValue("address", e.target.value)}
                    placeholder="Abidjan, Côte d'Ivoire"
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={getValue("platform_description", "")} 
                  onChange={(e) => setValue("platform_description", e.target.value)}
                  placeholder="Description de la plateforme..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Réseaux sociaux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Facebook</Label>
                  <Input 
                    value={getValue("facebook_url", "")} 
                    onChange={(e) => setValue("facebook_url", e.target.value)}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input 
                    value={getValue("instagram_url", "")} 
                    onChange={(e) => setValue("instagram_url", e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <Label>Twitter/X</Label>
                  <Input 
                    value={getValue("twitter_url", "")} 
                    onChange={(e) => setValue("twitter_url", e.target.value)}
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input 
                    value={getValue("whatsapp_number", "")} 
                    onChange={(e) => setValue("whatsapp_number", e.target.value)}
                    placeholder="+225..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de livraison</CardTitle>
              <CardDescription>Configurez les options de livraison</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Seuil livraison gratuite (FCFA)</Label>
                  <Input 
                    type="number"
                    value={getValue("free_shipping_threshold", "15500")} 
                    onChange={(e) => setValue("free_shipping_threshold", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Frais de livraison standard (FCFA)</Label>
                  <Input 
                    type="number"
                    value={getValue("standard_shipping_fee", "1500")} 
                    onChange={(e) => setValue("standard_shipping_fee", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Délai de livraison estimé (jours)</Label>
                  <Input 
                    type="number"
                    value={getValue("estimated_delivery_days", "3")} 
                    onChange={(e) => setValue("estimated_delivery_days", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Zones de livraison</Label>
                  <Input 
                    value={getValue("delivery_zones", "Abidjan, Côte d'Ivoire")} 
                    onChange={(e) => setValue("delivery_zones", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Méthodes de paiement</CardTitle>
              <CardDescription>Configurez les options de paiement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Mobile Money (Orange, MTN, Wave, Moov)</p>
                    <p className="text-sm text-muted-foreground">Paiement via KkiaPay</p>
                  </div>
                  <Switch 
                    checked={getValue("payment_mobile_money_enabled", "true") === "true"}
                    onCheckedChange={(checked) => setValue("payment_mobile_money_enabled", checked.toString())}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Paiement à la livraison</p>
                    <p className="text-sm text-muted-foreground">Cash on delivery</p>
                  </div>
                  <Switch 
                    checked={getValue("payment_cod_enabled", "true") === "true"}
                    onCheckedChange={(checked) => setValue("payment_cod_enabled", checked.toString())}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div>
                  <Label>Taux de commission vendeurs (%)</Label>
                  <Input 
                    type="number"
                    value={getValue("vendor_commission_rate", "10")} 
                    onChange={(e) => setValue("vendor_commission_rate", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Montant minimum de commande (FCFA)</Label>
                  <Input 
                    type="number"
                    value={getValue("minimum_order_amount", "0")} 
                    onChange={(e) => setValue("minimum_order_amount", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications email</CardTitle>
              <CardDescription>Configurez les notifications automatiques</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Email de confirmation de commande</p>
                    <p className="text-sm text-muted-foreground">Envoyé automatiquement à chaque nouvelle commande</p>
                  </div>
                  <Switch 
                    checked={getValue("email_order_confirmation", "true") === "true"}
                    onCheckedChange={(checked) => setValue("email_order_confirmation", checked.toString())}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Email d'expédition</p>
                    <p className="text-sm text-muted-foreground">Envoyé quand la commande est expédiée</p>
                  </div>
                  <Switch 
                    checked={getValue("email_order_shipped", "true") === "true"}
                    onCheckedChange={(checked) => setValue("email_order_shipped", checked.toString())}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Email de livraison</p>
                    <p className="text-sm text-muted-foreground">Envoyé quand la commande est livrée</p>
                  </div>
                  <Switch 
                    checked={getValue("email_order_delivered", "true") === "true"}
                    onCheckedChange={(checked) => setValue("email_order_delivered", checked.toString())}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Notifications admin</p>
                    <p className="text-sm text-muted-foreground">Alertes pour les nouvelles commandes</p>
                  </div>
                  <Switch 
                    checked={getValue("notify_admin_new_order", "true") === "true"}
                    onCheckedChange={(checked) => setValue("notify_admin_new_order", checked.toString())}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlatformSettings;
