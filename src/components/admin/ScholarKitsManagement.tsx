import { useEffect, useMemo, useState, useRef } from "react";
import { Plus, Trash2, Pencil, Package, Save, X, Upload, Image as ImageIcon, ArrowUp, ArrowDown, Power, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const KIND = "scolaire" as const;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const CATEGORIES = [
  { value: "kit_maternelle", label: "Kit Maternelle" },
  { value: "kit_primaire", label: "Kit Primaire" },
  { value: "kit_secondaire", label: "Kit Secondaire" },
  { value: "kit_lycee", label: "Kit Lycée" },
  { value: "kit_universite", label: "Kit Université" },
  { value: "kit_personnalise", label: "Kit Personnalisé" },
];

type KitItem = { item_name: string; quantity: number; estimated_price: number; is_optional: boolean };
type Kit = {
  id: string;
  name: string;
  category: string | null;
  grade_level: string;
  image_url: string | null;
  total_price: number | null;
  status: string;
  is_active: boolean;
  options: string | null;
  description: string | null;
  school_id: string | null;
};

const emptyForm = {
  id: "" as string | undefined,
  name: "",
  category: "",
  school_id: "",
  grade_level: "",
  image_url: "",
  description: "",
  options: "",
  total_price: 0,
  status: "published",
  is_active: true,
  standard: [] as KitItem[],
  optional: [] as KitItem[],
};

const ScholarKitsManagement = () => {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [filterSchool, setFilterSchool] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return "Format non supporté (JPG, PNG ou WEBP uniquement).";
    if (file.size > MAX_SIZE) return `Image trop lourde (${(file.size / 1024 / 1024).toFixed(1)} Mo · max 5 Mo).`;
    return null;
  };

  const uploadCover = async (file: File) => {
    setUploadError(null);
    const err = validateFile(file);
    if (err) { setUploadError(err); toast.error(err); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploadError("Non authentifié"); return toast.error("Non authentifié"); }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/kits-scolaires/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success("Image téléchargée.");
    } catch (e: any) {
      const msg = e.message || "Échec de l'upload";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("smart_kits")
      .select("*")
      .eq("kind", KIND)
      .order("created_at", { ascending: false });
    if (error) toast.error("Erreur de chargement");
    setKits((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase.from("schools").select("id,name").order("name").then(({ data }) => setSchools((data as any) || []));
  }, []);

  const openCreate = () => {
    setForm({ ...emptyForm, standard: [], optional: [] });
    setUploadError(null);
    setOpen(true);
  };

  const openEdit = async (kit: Kit) => {
    const { data: items } = await supabase
      .from("smart_kit_items")
      .select("item_name,quantity,estimated_price,is_optional")
      .eq("kit_id", kit.id)
      .order("sort_order", { ascending: true });

    const all = (items as KitItem[]) || [];
    setUploadError(null);
    setForm({
      id: kit.id,
      name: kit.name,
      category: kit.category || "",
      school_id: kit.school_id || "",
      grade_level: kit.grade_level,
      image_url: kit.image_url || "",
      description: kit.description || "",
      options: kit.options || "",
      total_price: kit.total_price || 0,
      status: kit.status,
      is_active: kit.is_active,
      standard: all.filter((i) => !i.is_optional),
      optional: all.filter((i) => i.is_optional),
    });
    setOpen(true);
  };

  const addItem = (section: "standard" | "optional") =>
    setForm((f) => ({ ...f, [section]: [...f[section], { item_name: "", quantity: 1, estimated_price: 0, is_optional: section === "optional" }] }) as any);

  const removeItem = (section: "standard" | "optional", idx: number) =>
    setForm((f) => ({ ...f, [section]: f[section].filter((_, i) => i !== idx) }) as any);

  const updateItem = (section: "standard" | "optional", idx: number, patch: Partial<KitItem>) =>
    setForm((f) => ({ ...f, [section]: f[section].map((it, i) => (i === idx ? { ...it, ...patch } : it)) }) as any);

  const moveItem = (section: "standard" | "optional", idx: number, dir: -1 | 1) =>
    setForm((f) => {
      const arr = [...f[section]];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return f;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...f, [section]: arr } as any;
    });

  const computedTotal = useMemo(
    () =>
      [...form.standard, ...form.optional].reduce(
        (s, i) => s + (Number(i.estimated_price) || 0) * (Number(i.quantity) || 0),
        0
      ),
    [form.standard, form.optional]
  );

  const save = async () => {
    if (!form.name || !form.category || !form.grade_level) {
      return toast.error("Nom, catégorie et niveau sont obligatoires.");
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        category: form.category,
        grade_level: form.grade_level,
        school_id: form.school_id || null,
        image_url: form.image_url || null,
        description: form.description || null,
        options: form.options || null,
        total_price: computedTotal || form.total_price || 0,
        status: form.status,
        is_active: form.is_active,
        kind: KIND,
      };
      let kitId = form.id;
      if (kitId) {
        const { error } = await supabase.from("smart_kits").update(payload).eq("id", kitId);
        if (error) throw error;
        await supabase.from("smart_kit_items").delete().eq("kit_id", kitId);
      } else {
        const { data, error } = await supabase.from("smart_kits").insert(payload).select("id").single();
        if (error) throw error;
        kitId = data.id;
      }

      const combined = [
        ...form.standard.map((i) => ({ ...i, is_optional: false })),
        ...form.optional.map((i) => ({ ...i, is_optional: true })),
      ].filter((i) => i.item_name.trim());

      if (combined.length && kitId) {
        const rows = combined.map((i, idx) => ({
          kit_id: kitId!,
          item_name: i.item_name,
          quantity: Number(i.quantity) || 1,
          estimated_price: Number(i.estimated_price) || 0,
          is_optional: !!i.is_optional,
          sort_order: idx,
        }));
        const { error } = await supabase.from("smart_kit_items").insert(rows);
        if (error) throw error;
      }
      toast.success("Kit Scolaire enregistré.");
      setOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce kit ?")) return;
    const { error } = await supabase.from("smart_kits").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Kit supprimé");
    load();
  };

  const toggleActive = async (kit: Kit) => {
    const { error } = await supabase.from("smart_kits").update({ is_active: !kit.is_active }).eq("id", kit.id);
    if (error) return toast.error(error.message);
    toast.success(kit.is_active ? "Kit désactivé" : "Kit activé");
    load();
  };

  const catLabel = (c: string | null) => CATEGORIES.find((x) => x.value === c)?.label || "—";

  const filtered = kits.filter((k) => {
    if (filterCategory !== "all" && k.category !== filterCategory) return false;
    if (filterSchool !== "all" && (k.school_id || "none") !== filterSchool) return false;
    if (filterActive === "active" && !k.is_active) return false;
    if (filterActive === "inactive" && k.is_active) return false;
    return true;
  });

  const renderItems = (section: "standard" | "optional", title: string) => (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between mb-2">
        <Label>{title}</Label>
        <Button size="sm" variant="outline" onClick={() => addItem(section)}>
          <Plus className="h-3 w-3 mr-1" /> Ajouter
        </Button>
      </div>
      <div className="space-y-2">
        {form[section].length === 0 && (
          <p className="text-xs text-muted-foreground">Aucun article.</p>
        )}
        {form[section].map((it, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center rounded-md border p-2">
            <Input
              className="col-span-5"
              value={it.item_name}
              onChange={(e) => updateItem(section, idx, { item_name: e.target.value })}
              placeholder="Libellé"
            />
            <Input
              className="col-span-2"
              type="number"
              min={1}
              value={it.quantity}
              onChange={(e) => updateItem(section, idx, { quantity: Number(e.target.value) })}
              placeholder="Qté"
            />
            <Input
              className="col-span-3"
              type="number"
              min={0}
              value={it.estimated_price}
              onChange={(e) => updateItem(section, idx, { estimated_price: Number(e.target.value) })}
              placeholder="Prix unitaire"
            />
            <div className="col-span-2 flex justify-end gap-1">
              <Button size="icon" variant="ghost" onClick={() => moveItem(section, idx, -1)} disabled={idx === 0}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => moveItem(section, idx, 1)} disabled={idx === form[section].length - 1}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => removeItem(section, idx)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Kits Scolaires
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Composez librement des kits scolaires (fournitures standard + options).
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" /> Nouveau Kit Scolaire
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{form.id ? "Modifier le Kit Scolaire" : "Créer un Kit Scolaire"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Catégorie *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Établissement lié</Label>
                  <Select value={form.school_id || "none"} onValueChange={(v) => setForm({ ...form, school_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Aucun établissement" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="none">Aucun établissement</SelectItem>
                      {schools.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Niveau *</Label>
                  <Select value={form.grade_level} onValueChange={(v) => setForm({ ...form, grade_level: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir un niveau" /></SelectTrigger>
                    <SelectContent>
                      {[
                        "Petite Section","Moyenne Section","Grande Section",
                        "CP1","CP2","CE1","CE2","CM1","CM2",
                        "6ème","5ème","4ème","3ème",
                        "2nde A","2nde C","1ère A","1ère C","1ère D",
                        "Terminale A","Terminale C","Terminale D",
                        "Licence 1","Licence 2","Licence 3","Master 1","Master 2",
                      ].map((lvl) => (<SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Nom du kit *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex : Kit Scolaire CE2 — Standard" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Image de couverture</Label>
                  <div className="flex items-start gap-3">
                    <div className="w-24 h-24 rounded-lg border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                      {form.image_url ? <img src={form.image_url} alt="Aperçu" className="w-full h-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ""; }}
                      />
                      <div className="flex gap-2 flex-wrap">
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                          <Upload className="h-4 w-4 mr-1" />
                          {uploading ? "Envoi…" : form.image_url ? "Remplacer" : "Choisir une image"}
                        </Button>
                        {form.image_url && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => { setForm({ ...form, image_url: "" }); setUploadError(null); }}>Supprimer</Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">JPG/PNG/WEBP · max 5 Mo.</p>
                      {uploadError && (
                        <div className="flex items-start gap-1.5 text-xs text-destructive bg-destructive/10 rounded-md px-2 py-1.5">
                          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>{uploadError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Description</Label>
                  <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>

                {renderItems("standard", "Fournitures standard")}
                {renderItems("optional", "Produits d'option")}

                <div className="md:col-span-2 flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <span className="text-sm">Prix total calculé</span>
                  <span className="font-bold text-primary">{new Intl.NumberFormat("fr-FR").format(computedTotal)} FCFA</span>
                </div>
                <div className="space-y-2">
                  <Label>Prix affiché (override)</Label>
                  <Input type="number" min={0} value={form.total_price} onChange={(e) => setForm({ ...form, total_price: Number(e.target.value) })} placeholder="0 pour utiliser le calcul auto" />
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="published">Publié</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="md:col-span-2 flex items-center gap-2 text-sm">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  Kit actif (visible côté client)
                </label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}><X className="h-4 w-4 mr-1" /> Annuler</Button>
                <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" /> {saving ? "Enregistrement…" : "Enregistrer"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSchool} onValueChange={setFilterSchool}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Établissement" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">Tous établissements</SelectItem>
                <SelectItem value="none">Sans établissement</SelectItem>
                {schools.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun Kit Scolaire.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="p-2">Nom</th>
                    <th className="p-2">Catégorie</th>
                    <th className="p-2">Niveau</th>
                    <th className="p-2">Prix total</th>
                    <th className="p-2">Statut</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((k) => (
                    <tr key={k.id} className="border-b hover:bg-muted/30">
                      <td className="p-2 font-medium">{k.name}</td>
                      <td className="p-2"><Badge variant="secondary">{catLabel(k.category)}</Badge></td>
                      <td className="p-2">{k.grade_level}</td>
                      <td className="p-2 whitespace-nowrap">{new Intl.NumberFormat("fr-FR").format(k.total_price || 0)} FCFA</td>
                      <td className="p-2">
                        <Badge variant={k.is_active ? "default" : "outline"}>{k.is_active ? "Actif" : "Inactif"}</Badge>
                      </td>
                      <td className="p-2 text-right">
                        <Button size="icon" variant="ghost" title={k.is_active ? "Désactiver" : "Activer"} onClick={() => toggleActive(k)}>
                          <Power className={`h-4 w-4 ${k.is_active ? "text-emerald-600" : "text-muted-foreground"}`} />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(k)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(k.id)}><Trash2 className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScholarKitsManagement;
