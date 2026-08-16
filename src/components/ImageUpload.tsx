import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket: "product-images" | "article-images";
  label?: string;
  placeholder?: string;
  showUrlInput?: boolean;
}

export const ImageUpload = ({
  value,
  onChange,
  bucket,
  label = "Image",
  placeholder = "https://...",
  showUrlInput = true,
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté pour téléverser une image");
        setUploading(false);
        return;
      }
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const folder = bucket === "product-images" ? "products" : "articles";
      const filePath = `${user.id}/${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        // Fallback to base64 if storage upload fails
        console.error("Storage upload failed:", uploadError);
        const reader = new FileReader();
        reader.onloadend = () => {
          onChange(reader.result as string);
          toast.success("Image chargée (mode local)");
          setUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success("Image téléchargée avec succès");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors du téléchargement");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {/* Preview */}
      {value && (
        <div className="relative w-full max-w-xs">
          <img
            src={value}
            alt="Preview"
            className="w-full h-40 object-cover rounded-lg border border-border"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow-md hover:bg-destructive/90"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          id={`file-upload-${bucket}`}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0"
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Téléchargement...
            </>
          ) : (
            <>
              <Upload size={18} />
              Télécharger
            </>
          )}
        </Button>

        {/* URL Input */}
        {showUrlInput && (
          <Input
            type="url"
            placeholder={placeholder}
            value={value.startsWith("data:") ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1"
          />
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Formats acceptés : JPG, PNG, WebP. Taille max : 5 Mo
      </p>
    </div>
  );
};

export default ImageUpload;
