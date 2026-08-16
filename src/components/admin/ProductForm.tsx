import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import MultiImageUpload from "@/components/MultiImageUpload";

interface ProductFormProps {
  product?: any;
  categories: any[];
  onSubmit: () => void;
  onCancel: () => void;
}

type ProductType = "book" | "school_supply" | "office";

type Cycle = "preschool" | "primary" | "secondary" | "university" | "other";

const subjectsByCycle: Record<Cycle, { value: string; label: string }[]> = {
  preschool: [
    { value: "eveil", label: "Éveil" },
    { value: "graphisme", label: "Graphisme" },
    { value: "prelecture", label: "Pré-lecture" },
    { value: "premaths", label: "Pré-mathématiques" },
    { value: "coloriage", label: "Coloriage" },
  ],
  primary: [
    { value: "francais", label: "Français" },
    { value: "maths", label: "Mathématiques" },
    { value: "eveil", label: "Éveil" },
    { value: "dessin", label: "Dessin" },
    { value: "ecriture", label: "Écriture" },
  ],
  secondary: [
    { value: "francais", label: "Français" },
    { value: "maths", label: "Mathématiques" },
    { value: "physique", label: "Physique-Chimie" },
    { value: "svt", label: "SVT" },
    { value: "histoire-geo", label: "Histoire-Géographie" },
    { value: "anglais", label: "Anglais" },
    { value: "espagnol", label: "Espagnol" },
    { value: "allemand", label: "Allemand" },
    { value: "philosophie", label: "Philosophie" },
  ],
  university: [
    { value: "droit", label: "Droit" },
    { value: "economie", label: "Économie" },
    { value: "gestion", label: "Gestion" },
    { value: "informatique", label: "Informatique" },
    { value: "medecine", label: "Médecine" },
    { value: "sciences", label: "Sciences" },
    { value: "lettres", label: "Lettres" },
  ],
  other: [],
};

const ProductForm = ({ product, categories, onSubmit, onCancel }: ProductFormProps) => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);

  const [formData, setFormData] = useState({
    // Multilang
    name_fr: "",
    name_en: "",
    name_de: "",
    name_es: "",
    description_fr: "",
    description_en: "",
    description_de: "",
    description_es: "",

    // Pricing
    price: "",
    original_price: "",
    discount_percent: "",
    stock: "0",

    // Catalog
    category_id: "",
    product_type: "school_supply" as ProductType,
    product_genre: "",
    education_level: "",
    education_series: "",
    author_name: "",
    author_details: "",
    cycle: "other" as Cycle,
    subject: "",

    // Media
    image_url: "",
    images: [] as string[],

    // Flags
    is_active: true,
    is_featured: false,

    // Office
    is_office_supply: false,
    brand: "",
    model: "",
    color: "",
    material: "",
    dimensions: "",
  });

  const texts = useMemo(
    () =>
      ({
        fr: {
          category: "Catégorie",
          selectCategory: "Sélectionner une catégorie",
          type: "Type de produit",
          typeBook: "Livre / Ouvrage",
          typeSchool: "Fourniture scolaire",
          typeOffice: "Bureautique",
          cycle: "Cycle",
          cyclePreschool: "Maternelle",
          cyclePrimary: "Primaire",
          cycleSecondary: "Secondaire",
          cycleUniversity: "Université",
          cycleOther: "Autre",
          subject: "Matière",
          selectSubject: "Sélectionner une matière",
          genre: "Genre / Famille",
          level: "Niveau (ex: 3e, Tle)",
          series: "Série (ex: A1, D)",
          authorName: "Auteur de l'œuvre",
          authorDetails: "Infos auteur (optionnel)",
          nameFr: "Nom (Français) *",
          nameEn: "Nom (Anglais)",
          nameDe: "Nom (Allemand)",
          nameEs: "Nom (Espagnol)",
          autoTranslate: "Traduire",
          translating: "Traduction…",
          descriptionFr: "Description (Français)",
          price: "Prix (FCFA) *",
          originalPrice: "Prix original",
          discount: "Réduction (%)",
          stock: "Stock",
          imageUrl: "URL de l'image",
          uploadImage: "Ou télécharger une image",
          active: "Actif",
          featured: "En vedette",
          officeFields: "Détails bureautique",
          brand: "Marque",
          model: "Modèle",
          color: "Couleur",
          material: "Matériau",
          dimensions: "Dimensions",
          save: "Enregistrer",
          cancel: "Annuler",
        },
        en: {
          category: "Category",
          selectCategory: "Select a category",
          type: "Product type",
          typeBook: "Book",
          typeSchool: "School supply",
          typeOffice: "Office",
          cycle: "Cycle",
          cyclePreschool: "Preschool",
          cyclePrimary: "Primary",
          cycleSecondary: "Secondary",
          cycleUniversity: "University",
          cycleOther: "Other",
          subject: "Subject",
          selectSubject: "Select a subject",
          genre: "Genre / Family",
          level: "Level",
          series: "Series",
          authorName: "Author",
          authorDetails: "Author info (optional)",
          nameFr: "Name (French) *",
          nameEn: "Name (English)",
          nameDe: "Name (German)",
          nameEs: "Name (Spanish)",
          autoTranslate: "Translate",
          translating: "Translating…",
          descriptionFr: "Description (French)",
          price: "Price (FCFA) *",
          originalPrice: "Original price",
          discount: "Discount (%)",
          stock: "Stock",
          imageUrl: "Image URL",
          uploadImage: "Or upload an image",
          active: "Active",
          featured: "Featured",
          officeFields: "Office details",
          brand: "Brand",
          model: "Model",
          color: "Color",
          material: "Material",
          dimensions: "Dimensions",
          save: "Save",
          cancel: "Cancel",
        },
        de: {
          category: "Kategorie",
          selectCategory: "Kategorie auswählen",
          type: "Produkttyp",
          typeBook: "Buch",
          typeSchool: "Schulbedarf",
          typeOffice: "Bürobedarf",
          cycle: "Zyklus",
          cyclePreschool: "Kindergarten",
          cyclePrimary: "Grundschule",
          cycleSecondary: "Sekundarstufe",
          cycleUniversity: "Universität",
          cycleOther: "Andere",
          subject: "Fach",
          selectSubject: "Fach auswählen",
          genre: "Genre / Familie",
          level: "Niveau",
          series: "Serie",
          authorName: "Autor",
          authorDetails: "Autorinfo (optional)",
          nameFr: "Name (Französisch) *",
          nameEn: "Name (Englisch)",
          nameDe: "Name (Deutsch)",
          nameEs: "Name (Spanisch)",
          autoTranslate: "Übersetzen",
          translating: "Übersetzen…",
          descriptionFr: "Beschreibung (Französisch)",
          price: "Preis (FCFA) *",
          originalPrice: "Originalpreis",
          discount: "Rabatt (%)",
          stock: "Lager",
          imageUrl: "Bild-URL",
          uploadImage: "Oder Bild hochladen",
          active: "Aktiv",
          featured: "Hervorgehoben",
          officeFields: "Bürodetails",
          brand: "Marke",
          model: "Modell",
          color: "Farbe",
          material: "Material",
          dimensions: "Maße",
          save: "Speichern",
          cancel: "Abbrechen",
        },
        es: {
          category: "Categoría",
          selectCategory: "Seleccionar categoría",
          type: "Tipo de producto",
          typeBook: "Libro",
          typeSchool: "Útil escolar",
          typeOffice: "Oficina",
          cycle: "Ciclo",
          cyclePreschool: "Preescolar",
          cyclePrimary: "Primaria",
          cycleSecondary: "Secundaria",
          cycleUniversity: "Universidad",
          cycleOther: "Otro",
          subject: "Asignatura",
          selectSubject: "Seleccionar asignatura",
          genre: "Género / Familia",
          level: "Nivel",
          series: "Serie",
          authorName: "Autor",
          authorDetails: "Info del autor (opcional)",
          nameFr: "Nombre (Francés) *",
          nameEn: "Nombre (Inglés)",
          nameDe: "Nombre (Alemán)",
          nameEs: "Nombre (Español)",
          autoTranslate: "Traducir",
          translating: "Traduciendo…",
          descriptionFr: "Descripción (Francés)",
          price: "Precio (FCFA) *",
          originalPrice: "Precio original",
          discount: "Descuento (%)",
          stock: "Stock",
          imageUrl: "URL de imagen",
          uploadImage: "O subir una imagen",
          active: "Activo",
          featured: "Destacado",
          officeFields: "Detalles oficina",
          brand: "Marca",
          model: "Modelo",
          color: "Color",
          material: "Material",
          dimensions: "Dimensiones",
          save: "Guardar",
          cancel: "Cancelar",
        },
      } as const),
    []
  );

  const t = (texts as any)[language] || texts.fr;

  // Infer type/cycle from selected category slug
  useEffect(() => {
    if (!formData.category_id) return;
    const category = categories.find((c) => c.id === formData.category_id);
    const slug = (category?.slug || "").toLowerCase();

    const isOffice = slug.includes("bureautique") || slug.includes("office");
    const isPreschool = slug.includes("maternelle") || slug.includes("prescolaire") || slug.includes("preschool");
    const isUniversity = slug.includes("universite") || slug.includes("university");
    const isSecondary =
      slug.includes("secondaire") || slug.includes("secondary") || slug.includes("college") || slug.includes("lycee");
    const isPrimary = slug.includes("primaire") || slug.includes("primary");

    setFormData((prev) => ({
      ...prev,
      is_office_supply: isOffice,
      product_type: isOffice ? "office" : prev.product_type,
      cycle: isPreschool ? "preschool" : isPrimary ? "primary" : isSecondary ? "secondary" : isUniversity ? "university" : prev.cycle,
      education_level: isPreschool && !prev.education_level ? "Maternelle" : prev.education_level,
    }));
  }, [formData.category_id, categories]);

  // Load existing product
  useEffect(() => {
    if (!product) return;

    // Build images array from product data
    let existingImages: string[] = [];
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      existingImages = product.images;
    } else if (product.image_url) {
      existingImages = [product.image_url];
    }

    setFormData((prev) => ({
      ...prev,
      name_fr: product.name_fr || "",
      name_en: product.name_en || "",
      name_de: product.name_de || "",
      name_es: product.name_es || "",
      description_fr: product.description_fr || "",
      description_en: product.description_en || "",
      description_de: product.description_de || "",
      description_es: product.description_es || "",
      price: product.price?.toString() || "",
      original_price: product.original_price?.toString() || "",
      discount_percent: product.discount_percent?.toString() || "",
      stock: product.stock?.toString() || "0",
      category_id: product.category_id || "",
      image_url: product.image_url || "",
      images: existingImages,
      is_active: product.is_active ?? true,
      is_featured: product.is_featured ?? false,

      product_type: (product.product_type as ProductType) || prev.product_type,
      product_genre: product.product_genre || "",
      education_level: product.education_level || "",
      education_series: product.education_series || "",
      author_name: product.author_name || "",
      author_details: product.author_details || "",
      cycle: (product.cycle as Cycle) || prev.cycle,
      subject: product.subject || "",

      is_office_supply: product.is_office_supply ?? prev.is_office_supply,
      brand: product.brand || "",
      model: product.model || "",
      color: product.color || "",
      material: product.material || "",
      dimensions: product.dimensions || "",
    }));
  }, [product]);

  // Auto-calculate discount
  useEffect(() => {
    const price = parseFloat(formData.price) || 0;
    const originalPrice = parseFloat(formData.original_price) || 0;
    if (originalPrice > 0 && price > 0 && originalPrice > price) {
      const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
      setFormData((prev) => ({ ...prev, discount_percent: discount.toString() }));
    }
  }, [formData.price, formData.original_price]);

  const subjects = formData.cycle ? subjectsByCycle[formData.cycle] : [];

  const translateTimer = useRef<number | null>(null);

  const doTranslate = async (source: string) => {
    const base = source.trim();
    if (!base) return;

    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-product", {
        body: { text: base },
      });

      if (error) {
        toast.error("Traduction indisponible");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        name_en: data?.en || prev.name_en,
        name_de: data?.de || prev.name_de,
        name_es: data?.es || prev.name_es,
      }));
      toast.success("Traductions mises à jour");
    } catch (e) {
      console.error(e);
      toast.error("Erreur de traduction");
    } finally {
      setTranslating(false);
    }
  };

  // Debounced auto-translate while typing (only if target fields are empty)
  useEffect(() => {
    const canAuto = !!formData.name_fr.trim() && !formData.name_en && !formData.name_de && !formData.name_es;
    if (!canAuto) return;

    if (translateTimer.current) window.clearTimeout(translateTimer.current);
    translateTimer.current = window.setTimeout(() => {
      doTranslate(formData.name_fr);
    }, 900);

    return () => {
      if (translateTimer.current) window.clearTimeout(translateTimer.current);
    };
  }, [formData.name_fr]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté");
        setUploading(false);
        return;
      }
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/products/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, file);

      if (uploadError) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({ ...prev, image_url: reader.result as string }));
          setUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name_fr.trim() || !formData.price) {
      toast.error("Nom et prix requis");
      return;
    }

    // Validate mandatory image
    const hasImage = formData.images.length > 0 || !!formData.image_url;
    if (!hasImage) {
      toast.error("Une image est obligatoire pour publier un produit");
      return;
    }

    // Validate mandatory fields for books
    if (formData.product_type === "book") {
      if (!formData.subject) {
        toast.error("La matière est obligatoire pour un livre");
        return;
      }
      if (!formData.education_level) {
        toast.error("Le niveau est obligatoire pour un livre");
        return;
      }
    }

    if (!formData.category_id) {
      toast.error("La catégorie est obligatoire");
      return;
    }

    setLoading(true);

    // Prepare images array - use formData.images if available, otherwise create from image_url
    const imagesArray = formData.images.length > 0 
      ? formData.images 
      : (formData.image_url ? [formData.image_url] : []);

    const productData = {
      name_fr: formData.name_fr.trim(),
      name_en: formData.name_en?.trim() || formData.name_fr.trim(),
      name_de: formData.name_de?.trim() || formData.name_fr.trim(),
      name_es: formData.name_es?.trim() || formData.name_fr.trim(),
      description_fr: formData.description_fr?.trim() || null,
      description_en: formData.description_en?.trim() || formData.description_fr?.trim() || null,
      description_de: formData.description_de?.trim() || formData.description_fr?.trim() || null,
      description_es: formData.description_es?.trim() || formData.description_fr?.trim() || null,

      price: parseFloat(formData.price) || 0,
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      discount_percent: formData.discount_percent ? parseInt(formData.discount_percent) : 0,
      stock: parseInt(formData.stock) || 0,

      category_id: formData.category_id || null,
      image_url: imagesArray[0] || formData.image_url || null,
      images: imagesArray.length > 0 ? imagesArray : null,
      is_active: formData.is_active,
      is_featured: formData.is_featured,

      product_type: formData.product_type || null,
      product_genre: formData.product_genre || null,
      education_level: formData.education_level || null,
      education_series: formData.education_series || null,
      author_name: formData.author_name || null,
      author_details: formData.author_details || null,
      subject: formData.subject || null,

      is_office_supply: formData.product_type === "office" ? true : formData.is_office_supply,
      brand: formData.brand || null,
      model: formData.model || null,
      color: formData.color || null,
      material: formData.material || null,
      dimensions: formData.dimensions || null,
    };

    try {
      if (product) {
        const { error } = await supabase.from("products").update(productData).eq("id", product.id);
        if (error) throw error;
        toast.success("Produit modifié avec succès");
      } else {
        const { error } = await supabase.from("products").insert(productData);
        if (error) throw error;
        toast.success("Produit ajouté avec succès");
      }

      onSubmit();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const showEducationFields = formData.product_type !== "office";
  const showBookFields = formData.product_type === "book";
  const showOfficeFields = formData.product_type === "office";

  return (
    <div className="grid gap-5 py-4">
      {/* Category — REQUIRED */}
      <div>
        <Label>
          {t.category} <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => setFormData((p) => ({ ...p, category_id: value }))}
        >
          <SelectTrigger
            className={!formData.category_id ? "border-destructive/40" : ""}
            aria-required="true"
          >
            <SelectValue placeholder={t.selectCategory} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name_fr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!formData.category_id && (
          <p className="text-xs text-destructive mt-1">
            La catégorie est obligatoire pour publier un produit.
          </p>
        )}
      </div>

      {/* Product Type */}
      <div>
        <Label>{t.type}</Label>
        <Select
          value={formData.product_type}
          onValueChange={(value: ProductType) =>
            setFormData((p) => ({
              ...p,
              product_type: value,
              is_office_supply: value === "office",
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="book">{t.typeBook}</SelectItem>
            <SelectItem value="school_supply">{t.typeSchool}</SelectItem>
            <SelectItem value="office">{t.typeOffice}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Education fields */}
      {showEducationFields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t.cycle}</Label>
            <Select value={formData.cycle} onValueChange={(v: Cycle) => setFormData((p) => ({ ...p, cycle: v, subject: "" }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preschool">{t.cyclePreschool}</SelectItem>
                <SelectItem value="primary">{t.cyclePrimary}</SelectItem>
                <SelectItem value="secondary">{t.cycleSecondary}</SelectItem>
                <SelectItem value="university">{t.cycleUniversity}</SelectItem>
                <SelectItem value="other">{t.cycleOther}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {subjects.length > 0 && (
            <div>
              <Label>{t.subject}</Label>
              <Select value={formData.subject} onValueChange={(value) => setFormData((p) => ({ ...p, subject: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectSubject} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subj) => (
                    <SelectItem key={subj.value} value={subj.value}>
                      {subj.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>{t.genre}</Label>
            <Input
              value={formData.product_genre}
              onChange={(e) => setFormData((p) => ({ ...p, product_genre: e.target.value }))}
              placeholder="Ex: Cahier, Roman, Ensemble géométrie…"
            />
          </div>

          <div>
            <Label>{t.level}</Label>
            <Input
              value={formData.education_level}
              onChange={(e) => setFormData((p) => ({ ...p, education_level: e.target.value }))}
              placeholder="Ex: 3e, Tle, Licence 1…"
            />
          </div>

          <div>
            <Label>{t.series}</Label>
            <Input
              value={formData.education_series}
              onChange={(e) => setFormData((p) => ({ ...p, education_series: e.target.value }))}
              placeholder="Ex: A1, A2, D, G1…"
            />
          </div>

          {showBookFields && (
            <>
              <div>
                <Label>{t.authorName}</Label>
                <Input
                  value={formData.author_name}
                  onChange={(e) => setFormData((p) => ({ ...p, author_name: e.target.value }))}
                  placeholder="Ex: Ahmadou Kourouma"
                />
              </div>
              <div>
                <Label>{t.authorDetails}</Label>
                <Input
                  value={formData.author_details}
                  onChange={(e) => setFormData((p) => ({ ...p, author_details: e.target.value }))}
                  placeholder="Ex: Éditeur, année, etc."
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Names with AI translate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label>{t.nameFr}</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => doTranslate(formData.name_fr)} disabled={translating || !formData.name_fr.trim()}>
              {translating ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              {translating ? t.translating : t.autoTranslate}
            </Button>
          </div>
          <Input value={formData.name_fr} onChange={(e) => setFormData((p) => ({ ...p, name_fr: e.target.value }))} />
        </div>
        <div>
          <Label>{t.nameEn}</Label>
          <Input value={formData.name_en} onChange={(e) => setFormData((p) => ({ ...p, name_en: e.target.value }))} />
        </div>
        <div>
          <Label>{t.nameDe}</Label>
          <Input value={formData.name_de} onChange={(e) => setFormData((p) => ({ ...p, name_de: e.target.value }))} />
        </div>
        <div>
          <Label>{t.nameEs}</Label>
          <Input value={formData.name_es} onChange={(e) => setFormData((p) => ({ ...p, name_es: e.target.value }))} />
        </div>
      </div>

      <div>
        <Label>{t.descriptionFr}</Label>
        <Textarea value={formData.description_fr} onChange={(e) => setFormData((p) => ({ ...p, description_fr: e.target.value }))} />
      </div>

      {/* Office fields */}
      {showOfficeFields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="md:col-span-2">
            <div className="text-sm font-medium text-foreground mb-2">{t.officeFields}</div>
          </div>
          <div>
            <Label>{t.brand}</Label>
            <Input value={formData.brand} onChange={(e) => setFormData((p) => ({ ...p, brand: e.target.value }))} placeholder="Ex: BIC" />
          </div>
          <div>
            <Label>{t.model}</Label>
            <Input value={formData.model} onChange={(e) => setFormData((p) => ({ ...p, model: e.target.value }))} placeholder="Ex: Gel-ocity" />
          </div>
          <div>
            <Label>{t.color}</Label>
            <Input value={formData.color} onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))} />
          </div>
          <div>
            <Label>{t.material}</Label>
            <Input value={formData.material} onChange={(e) => setFormData((p) => ({ ...p, material: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Label>{t.dimensions}</Label>
            <Input value={formData.dimensions} onChange={(e) => setFormData((p) => ({ ...p, dimensions: e.target.value }))} placeholder="Ex: A4, 20cm x 30cm" />
          </div>
        </div>
      )}

      {/* Price / stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>{t.price}</Label>
          <Input type="number" value={formData.price} onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))} />
        </div>
        <div>
          <Label>{t.originalPrice}</Label>
          <Input type="number" value={formData.original_price} onChange={(e) => setFormData((p) => ({ ...p, original_price: e.target.value }))} />
        </div>
        <div>
          <Label>{t.discount}</Label>
          <Input type="number" value={formData.discount_percent} onChange={(e) => setFormData((p) => ({ ...p, discount_percent: e.target.value }))} />
        </div>
        <div>
          <Label>{t.stock}</Label>
          <Input type="number" value={formData.stock} onChange={(e) => setFormData((p) => ({ ...p, stock: e.target.value }))} />
        </div>
      </div>

      {/* Images */}
      <div>
        <Label>Images du produit</Label>
        <MultiImageUpload
          images={formData.images}
          onChange={(images) => {
            setFormData((p) => ({ 
              ...p, 
              images,
              image_url: images[0] || p.image_url 
            }));
          }}
          maxImages={10}
        />
      </div>

      {/* Flags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div>
            <div className="text-sm font-medium text-foreground">{t.active}</div>
          </div>
          <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_active: checked }))} />
        </div>
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div>
            <div className="text-sm font-medium text-foreground">{t.featured}</div>
          </div>
          <Switch checked={formData.is_featured} onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_featured: checked }))} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={onCancel}>
          {t.cancel}
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t.save}
        </Button>
      </div>
    </div>
  );
};

export default ProductForm;
