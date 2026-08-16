import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon, Video, GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MediaItem {
  url: string;
  type: "image" | "video";
}

interface MediaUploadProps {
  value: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  bucket: string;
  label?: string;
  maxItems?: number;
}

export const MediaUpload = ({
  value = [],
  onChange,
  bucket,
  label = "Médias",
  maxItems = 10,
}: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (value.length + files.length > maxItems) {
      toast.error(`Maximum ${maxItems} médias autorisés`);
      return;
    }

    setUploading(true);
    const newMedia: MediaItem[] = [];

    try {
      for (const file of Array.from(files)) {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          toast.error(`Format non supporté: ${file.name}`);
          continue;
        }

        // Size limits
        const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error(`${file.name} dépasse la taille maximale (${isVideo ? "50 Mo" : "5 Mo"})`);
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const folder = isVideo ? "videos" : "images";
        const filePath = `${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          // Fallback to base64 for images only
          if (isImage) {
            const reader = new FileReader();
            const base64Url = await new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
            newMedia.push({ url: base64Url, type: "image" });
          } else {
            toast.error(`Erreur lors du téléchargement de ${file.name}`);
          }
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        newMedia.push({
          url: publicUrl,
          type: isVideo ? "video" : "image",
        });
      }

      if (newMedia.length > 0) {
        onChange([...value, ...newMedia]);
        toast.success(`${newMedia.length} média(s) ajouté(s)`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors du téléchargement");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const updated = [...value];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, removed);
    onChange(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>

      {/* Media Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((media, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group aspect-video rounded-lg border border-border overflow-hidden bg-muted cursor-move ${
                draggedIndex === index ? "opacity-50" : ""
              }`}
            >
              {media.type === "video" ? (
                <video
                  src={media.url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={media.url}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              )}
              
              {/* Overlay with icons */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <GripVertical className="text-white" size={20} />
              </div>

              {/* Type badge */}
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-white text-xs flex items-center gap-1">
                {media.type === "video" ? <Video size={12} /> : <ImageIcon size={12} />}
                {index === 0 && " (couverture)"}
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full shadow-md hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          id={`media-upload-${bucket}`}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || value.length >= maxItems}
          className="w-full border-dashed h-20"
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Téléchargement en cours...
            </>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <Plus size={18} />
                <span>Ajouter des images ou vidéos</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {value.length}/{maxItems} • Glisser pour réorganiser
              </span>
            </div>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Images: JPG, PNG, WebP (max 5 Mo) • Vidéos: MP4, MOV (max 50 Mo)
      </p>
    </div>
  );
};

export default MediaUpload;
