import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { 
  Bold, 
  Italic, 
  Strikethrough,
  List, 
  ListOrdered, 
  Quote, 
  Code,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  TableIcon,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { isSafeUrl } from '@/utils/security';
import { toast } from 'sonner';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const MenuButton = ({ 
  onClick, 
  isActive = false, 
  disabled = false,
  children,
  title
}: { 
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "h-8 w-8 p-0",
      isActive && "bg-primary/20 text-primary"
    )}
  >
    {children}
  </Button>
);

const RichTextEditor = ({ content, onChange, placeholder = "Rédigez votre contenu...", className }: RichTextEditorProps) => {
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Youtube.configure({
        width: 640,
        height: 480,
        HTMLAttributes: {
          class: 'rounded-lg my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'article-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  const addImage = useCallback(() => {
    if (imageUrl && editor) {
      if (!isSafeUrl(imageUrl)) {
        toast.error('URL non sécurisée. Utilisez une URL HTTPS.');
        return;
      }
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setIsImageDialogOpen(false);
    }
  }, [editor, imageUrl]);

  const addVideo = useCallback(() => {
    if (videoUrl && editor) {
      editor.chain().focus().setYoutubeVideo({ src: videoUrl }).run();
      setVideoUrl('');
      setIsVideoDialogOpen(false);
    }
  }, [editor, videoUrl]);

  const setLink = useCallback(() => {
    if (linkUrl && editor) {
      if (!isSafeUrl(linkUrl)) {
        toast.error('URL non sécurisée. Utilisez une URL HTTPS ou un lien relatif.');
        return;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl, target: '_blank', rel: 'noopener noreferrer' }).run();
      setLinkUrl('');
      setIsLinkDialogOpen(false);
    }
  }, [editor, linkUrl]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden bg-background", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-muted/50">
        {/* Undo/Redo */}
        <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Annuler">
          <Undo size={16} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rétablir">
          <Redo size={16} />
        </MenuButton>

        <div className="w-px h-6 bg-border mx-1 self-center" />

        {/* Headings */}
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
          isActive={editor.isActive('heading', { level: 1 })}
          title="Titre 1"
        >
          <Heading1 size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
          isActive={editor.isActive('heading', { level: 2 })}
          title="Titre 2"
        >
          <Heading2 size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
          isActive={editor.isActive('heading', { level: 3 })}
          title="Titre 3"
        >
          <Heading3 size={16} />
        </MenuButton>

        <div className="w-px h-6 bg-border mx-1 self-center" />

        {/* Text formatting */}
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBold().run()} 
          isActive={editor.isActive('bold')}
          title="Gras"
        >
          <Bold size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleItalic().run()} 
          isActive={editor.isActive('italic')}
          title="Italique"
        >
          <Italic size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleStrike().run()} 
          isActive={editor.isActive('strike')}
          title="Barré"
        >
          <Strikethrough size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleCode().run()} 
          isActive={editor.isActive('code')}
          title="Code"
        >
          <Code size={16} />
        </MenuButton>

        <div className="w-px h-6 bg-border mx-1 self-center" />

        {/* Lists */}
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()} 
          isActive={editor.isActive('bulletList')}
          title="Liste à puces"
        >
          <List size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()} 
          isActive={editor.isActive('orderedList')}
          title="Liste numérotée"
        >
          <ListOrdered size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBlockquote().run()} 
          isActive={editor.isActive('blockquote')}
          title="Citation"
        >
          <Quote size={16} />
        </MenuButton>

        <div className="w-px h-6 bg-border mx-1 self-center" />

        {/* Table */}
        <MenuButton 
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} 
          title="Insérer un tableau"
        >
          <TableIcon size={16} />
        </MenuButton>
        {editor.isActive('table') && (
          <>
            <MenuButton 
              onClick={() => editor.chain().focus().addColumnAfter().run()} 
              title="Ajouter colonne"
            >
              <span className="text-xs font-bold">+C</span>
            </MenuButton>
            <MenuButton 
              onClick={() => editor.chain().focus().addRowAfter().run()} 
              title="Ajouter ligne"
            >
              <span className="text-xs font-bold">+L</span>
            </MenuButton>
            <MenuButton 
              onClick={() => editor.chain().focus().deleteColumn().run()} 
              title="Supprimer colonne"
            >
              <span className="text-xs font-bold text-destructive">-C</span>
            </MenuButton>
            <MenuButton 
              onClick={() => editor.chain().focus().deleteRow().run()} 
              title="Supprimer ligne"
            >
              <span className="text-xs font-bold text-destructive">-L</span>
            </MenuButton>
            <MenuButton 
              onClick={() => editor.chain().focus().deleteTable().run()} 
              title="Supprimer tableau"
            >
              <Trash2 size={14} className="text-destructive" />
            </MenuButton>
          </>
        )}

        <div className="w-px h-6 bg-border mx-1 self-center" />

        {/* Media */}
        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Ajouter une image">
              <ImageIcon size={16} />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>URL de l'image</Label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemple.com/image.jpg"
                />
              </div>
              <Button onClick={addImage} className="w-full">Insérer l'image</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Ajouter une vidéo YouTube">
              <Video size={16} />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une vidéo YouTube</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>URL de la vidéo YouTube</Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              <Button onClick={addVideo} className="w-full">Insérer la vidéo</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className={cn("h-8 w-8 p-0", editor.isActive('link') && "bg-primary/20 text-primary")} title="Ajouter un lien">
              <LinkIcon size={16} />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un lien</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>URL du lien</Label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://exemple.com"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={setLink} className="flex-1">Appliquer le lien</Button>
                {editor.isActive('link') && (
                  <Button 
                    variant="outline" 
                    onClick={() => editor.chain().focus().unsetLink().run()}
                    className="flex-1"
                  >
                    Supprimer le lien
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;