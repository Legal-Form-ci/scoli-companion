import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SchoolCombobox } from "@/components/kits/SchoolCombobox";
import CityCombobox from "@/components/common/CityCombobox";
import { REGIONS, regionForCity } from "@/lib/ivoryCities";

const schema = z.object({
  first_name: z.string().trim().min(2, "Prénom trop court").max(80),
  last_name: z.string().trim().min(2, "Nom trop court").max(80),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?225)?[0-9\s]{8,}$/, "Numéro invalide")
    .max(30),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  region: z.string().trim().max(120).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  school_name: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

interface Props {
  /** "referent" : un commercial enregistre un référent. "filleul" : un référent soumet un filleul. */
  mode: "referent" | "filleul";
  onSubmitted?: () => void;
}

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  city: "",
  region: "",
  address: "",
  school_name: "",
  notes: "",
};

const ReferentApplicationForm = ({ mode, onSubmitted }: Props) => {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string>("");
  const [zones, setZones] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("zones")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      setZones(data || []);
    })();
  }, []);

  const set = (k: keyof typeof emptyForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onCity = (city: string) => {
    const region = regionForCity(city);
    setForm((f) => ({ ...f, city, region: region || f.region }));
  };

  const title = useMemo(
    () =>
      mode === "referent"
        ? "Enregistrer un nouveau référent"
        : "Soumettre un filleul",
    [mode],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(
        Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
          "Formulaire invalide",
      );
      return;
    }
    setSaving(true);
    try {
      let assignedCommercial: string | null = mode === "referent" ? user.id : null;

      // Filleul : routage automatique vers un commercial disponible de la zone
      if (mode === "filleul" && zoneId) {
        const { data } = await supabase.rpc("pick_available_commercial", {
          _zone_id: zoneId,
        });
        assignedCommercial = (data as string | null) ?? null;
      }

      const { error } = await supabase.from("referent_applications").insert({
        submitted_by: user.id,
        submitted_role: mode === "referent" ? "commercial" : "referent",
        sponsor_referent_id: mode === "filleul" ? user.id : null,
        assigned_commercial_id: assignedCommercial,
        zone_id: zoneId || null,
        school_id: schoolId,
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        email: parsed.data.email.toLowerCase(),
        phone: parsed.data.phone,
        school_name: parsed.data.school_name || null,
        city: parsed.data.city || null,
        region: parsed.data.region || null,
        address: parsed.data.address || null,
        notes: parsed.data.notes || null,
        // Commercial → directement soumis à l'admin. Référent → passe d'abord par le commercial de zone.
        status: mode === "referent" ? "submitted" : "pending",
      });
      if (error) throw error;

      toast.success(
        mode === "referent"
          ? "Candidature transmise à l'administration"
          : "Filleul transmis au commercial de votre zone",
      );
      setForm(emptyForm);
      setSchoolId(null);
      setZoneId("");
      onSubmitted?.();
    } catch (err: any) {
      toast.error(err.message || "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ra-first">Prénom *</Label>
            <Input
              id="ra-first"
              value={form.first_name}
              onChange={(e) => set("first_name", e.target.value)}
              maxLength={80}
              required
            />
          </div>
          <div>
            <Label htmlFor="ra-last">Nom *</Label>
            <Input
              id="ra-last"
              value={form.last_name}
              onChange={(e) => set("last_name", e.target.value)}
              maxLength={80}
              required
            />
          </div>
          <div>
            <Label htmlFor="ra-email">Email *</Label>
            <Input
              id="ra-email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              maxLength={255}
              required
            />
          </div>
          <div>
            <Label htmlFor="ra-phone">Téléphone *</Label>
            <Input
              id="ra-phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+225 07 00 00 00 00"
              maxLength={30}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Label>Établissement</Label>
            <SchoolCombobox value={schoolId} onChange={(s) => setSchoolId(s?.id ?? null)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ra-school-name">Établissement (si absent de la liste)</Label>
            <Input
              id="ra-school-name"
              value={form.school_name}
              onChange={(e) => set("school_name", e.target.value)}
              maxLength={200}
            />
          </div>

          <div>
            <Label>Ville</Label>
            <CityCombobox value={form.city} onChange={onCity} />
          </div>
          <div>
            <Label>Région (déduite, modifiable)</Label>
            <Select value={form.region} onValueChange={(v) => set("region", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Zone commerciale</Label>
            <Select value={zoneId} onValueChange={setZoneId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une zone" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((z) => (
                  <SelectItem key={z.id} value={z.id}>
                    {z.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="ra-address">Adresse</Label>
            <Input
              id="ra-address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              maxLength={300}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="ra-notes">Notes</Label>
            <Textarea
              id="ra-notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2">
              <Send className="h-4 w-4" />
              {saving ? "Envoi…" : "Soumettre la candidature"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReferentApplicationForm;
