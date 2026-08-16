import { useMemo, useState } from "react";
import { Upload, Loader2, Sparkles, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  onDone?: () => void;
}

const MAX_FILES = 100;
const MAX_SIZE = 20 * 1024 * 1024; // 20MB per file
const CLIENT_BATCH_SIZE = 5;

const compressImage = (file: File): Promise<File> =>
  new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.size < 900_000) return resolve(file);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const maxSide = 1400;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }) : file);
        },
        "image/jpeg",
        0.82
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      resolve(s.split(",")[1] || "");
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const BulkProductImport = ({ onDone }: Props) => {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, created: 0, skipped: 0 });

  const batches = useMemo(() => Math.ceil(files.length / CLIENT_BATCH_SIZE), [files.length]);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    const ok = list.filter((f) => {
      if (f.size > MAX_SIZE) {
        toast.error(`${f.name} dépasse 20 Mo`);
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...ok].slice(0, MAX_FILES));
  };

  const removeAt = (i: number) =>
    setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleImport = async () => {
    if (files.length === 0) {
      toast.error("Aucun fichier sélectionné");
      return;
    }
    setLoading(true);
    setProgress({ done: 0, created: 0, skipped: 0 });
    try {
      let created = 0;
      let skipped = 0;
      for (let i = 0; i < files.length; i += CLIENT_BATCH_SIZE) {
        const batch = files.slice(i, i + CLIENT_BATCH_SIZE);
        const payload = await Promise.all(
          batch.map(async (f) => {
            const prepared = await compressImage(f);
            return {
              name: prepared.name,
              mime: prepared.type || f.type || "application/octet-stream",
              dataBase64: await fileToBase64(prepared),
            };
          })
        );

        const { data, error } = await supabase.functions.invoke("bulk-create-products", {
          body: { files: payload, batchIndex: Math.floor(i / CLIENT_BATCH_SIZE), totalBatches: batches },
        });

        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);

        created += (data as any)?.count ?? 0;
        skipped += (data as any)?.skipped ?? 0;
        setProgress({ done: Math.min(files.length, i + batch.length), created, skipped });
      }

      toast.success(`${created} produit(s) créé(s) et publié(s).${skipped ? ` ${skipped} doublon(s) ignoré(s).` : ""}`);
      setFiles([]);
      setOpen(false);
      onDone?.();
    } catch (e: any) {
      toast.error(e?.message || "Échec de la création IA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles size={16} /> Créer avec IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} /> Création IA — Produits en lot
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Déposez de simples photos d'articles, listes scolaires (même manuscrites avec ratures), ou catalogues.
            L'IA reconnaît automatiquement chaque fourniture, génère titres multilingues, descriptions, prix et publie directement les produits classés par catégorie.
            <br /><span className="font-medium">Jusqu'à {MAX_FILES} fichiers, 20 Mo chacun. Les fichiers sont compressés et envoyés par lots pour éviter les blocages.</span>
          </p>

          <label className="block border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/40 transition-colors">
            <Upload className="mx-auto mb-2 text-muted-foreground" />
            <span className="text-sm">Choisir des fichiers</span>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
              className="hidden"
              onChange={onSelect}
              disabled={loading}
            />
          </label>

          {loading && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Loader2 className="animate-spin" size={16} /> Analyse IA en lots ({progress.done}/{files.length})
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${files.length ? Math.round((progress.done / files.length) * 100) : 0}%` }} />
              </div>
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 size={13} /> {progress.created} créé(s), {progress.skipped} doublon(s) ignoré(s)
              </p>
            </div>
          )}

          {files.length > 0 && (
            <div className="text-xs text-muted-foreground">{files.length} fichier(s) sélectionné(s)</div>
          )}
          {files.length > 0 && (
            <ul className="space-y-1 max-h-48 overflow-y-auto text-sm">
              {files.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between bg-muted/40 rounded px-2 py-1"
                >
                  <span className="truncate">{f.name}</span>
                  <button
                    onClick={() => removeAt(i)}
                    className="text-muted-foreground hover:text-destructive"
                    type="button"
                    disabled={loading}
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={handleImport} disabled={loading || files.length === 0}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-1" size={16} /> L'IA analyse...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-1" /> Créer les produits
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkProductImport;
