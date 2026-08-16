import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessAdminSection } from "@/lib/rbac";
import AccessDenied from "@/components/AccessDenied";

import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  ShoppingBag, 
  Users, 
  Tag, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Bell,
  DollarSign,
  Truck,
  Store,
  Gift,
  BarChart3,
  HelpCircle,
  FileText,
  Menu,
  UserPlus,
  Shield,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminDashboard from "@/components/admin/AdminDashboard";
import UserManagement from "@/components/admin/UserManagement";
import RolesPermissionsManagement from "@/components/admin/RolesPermissionsManagement";
import CommissionsManagement from "@/components/admin/CommissionsManagement";
import ReferralsManagement from "@/components/admin/ReferralsManagement";
import ProductForm from "@/components/admin/ProductForm";
import BulkProductImport from "@/components/admin/BulkProductImport";
import PublicationsReview from "@/components/admin/PublicationsReview";
import CouponManagement from "@/components/admin/CouponManagement";
import AdvertisementsManagement from "@/components/admin/AdvertisementsManagement";
import FAQManagement from "@/components/admin/FAQManagement";
import PlatformSettings from "@/components/admin/PlatformSettings";
import AdvancedStats from "@/components/admin/AdvancedStats";
import PaymentsTab from "@/components/admin/PaymentsTab";
import ShareStatsTab from "@/components/admin/ShareStatsTab";
import PromotionsManagement from "@/components/admin/PromotionsManagement";
import FlashDealsManagement from "@/components/admin/FlashDealsManagement";
import SocialMediaManager from "@/components/admin/SocialMediaManager";
import DocumentationManager from "@/components/admin/DocumentationManager";
import EmailMarketing from "@/components/admin/EmailMarketing";
import EmailLogsDashboard from "@/components/admin/EmailLogsDashboard";
import CampaignAnalyticsDashboard from "@/components/admin/CampaignAnalyticsDashboard";
import ProviderMonitoring from "@/components/admin/ProviderMonitoring";
import ZonesManagement from "@/components/admin/ZonesManagement";
import SchoolKitsManagement from "@/components/admin/SchoolKitsManagement";
import ScholarKitsManagement from "@/components/admin/ScholarKitsManagement";
import SmartImage from "@/components/SmartImage";

import { sortCategories, getCategoryInitials } from "@/lib/categoryAssets";

import { Share2 } from "lucide-react";

type TabType =
  | "dashboard"
  | "products"
  | "categories"
  | "orders"
  | "users"
  | "roles"
  | "articles"
  | "review"
  | "promotions"
  | "promotions_mgmt"
  | "notifications"
  | "advertisements"
  | "faq"
  | "stats"
  | "sharestats"
  | "settings"
  | "database"
  | "vendors"
  | "commissions"
  | "deliveries"
  | "loyalty"
  | "payments"
  | "referrals"
  | "flash_deals"
  | "zones"
  | "school_kits"
  | "scholar_kits"
  ;

const Admin = () => {
  useLanguage();
  const { roles } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMenuGroup, setOpenMenuGroup] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);

  const allMenuGroups: Array<{ label: string; items: Array<{ id: string; label: string; icon: any }> }> = [

    {
      label: "Pilotage",
      items: [
        { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
        { id: "stats", label: "Statistiques", icon: BarChart3 },
      ],
    },
    {
      label: "Catalogue",
      items: [
        { id: "products", label: "Produits", icon: Package },
        { id: "scholar_kits", label: "Kits scolaires", icon: Package },
        { id: "school_kits", label: "Kits école", icon: Package },
        { id: "categories", label: "Catégories", icon: FolderTree },
        { id: "flash_deals", label: "Ventes flash", icon: Zap },
        { id: "promotions_mgmt", label: "Promotions", icon: Tag },
        { id: "promotions", label: "Coupons", icon: Tag },
      ],
    },
    {
      label: "Commandes",
      items: [
        { id: "orders", label: "Commandes", icon: ShoppingBag },
        { id: "payments", label: "Paiements", icon: DollarSign },
        { id: "deliveries", label: "Livraisons", icon: Truck },
      ],
    },

    {
      label: "Utilisateurs & zones",
      items: [
        { id: "users", label: "Utilisateurs", icon: Users },
        { id: "roles", label: "Rôles & permissions", icon: Shield },
        { id: "zones", label: "Zones & Commerciaux", icon: Truck },
        { id: "referrals", label: "Référents", icon: UserPlus },
        { id: "commissions", label: "Commissions", icon: DollarSign },
      ],
    },
    {
      label: "Contenu",
      items: [
        { id: "articles", label: "Actualités", icon: FileText },
        { id: "review", label: "Validation", icon: Eye },
        { id: "advertisements", label: "Publicités", icon: Bell },
      ],
    },
    {
      label: "Système",
      items: [
        { id: "faq", label: "FAQ", icon: HelpCircle },
        { id: "settings", label: "Paramètres", icon: Settings },
      ],
    },
  ];

  const menuGroups = allMenuGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => canAccessAdminSection(roles, i.id)) }))
    .filter((g) => g.items.length > 0);
  const menuItems = menuGroups.flatMap((g) => g.items);
  const canRender = (section: string) =>
    activeTab === section && canAccessAdminSection(roles, section);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };


  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <div className="min-h-screen flex w-full min-w-0 overflow-x-hidden">


        {/* Sidebar - Desktop : hover pur CSS, zéro state React → zéro clignotement */}
        <aside
          ref={sidebarRef}
          className="w-64 shrink-0 bg-card border-r border-border hidden lg:block sticky top-0 h-screen overflow-y-auto"
        >
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-display font-bold text-foreground">Administration</h2>
            <p className="text-xs text-muted-foreground">Menu interne</p>
          </div>
          <nav className="px-3 py-4 space-y-2">
            {menuGroups.map((group) => (
              <div
                key={group.label}
                className="group/menu rounded-lg border border-border/60 bg-background/40"
              >
                <div className="w-full px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 flex items-center justify-between cursor-default select-none">
                  {group.label}
                  <ChevronRight
                    size={13}
                    className="transition-transform group-hover/menu:rotate-90"
                  />
                </div>
                <div className="hidden group-hover/menu:block space-y-1 px-2 pb-2 pt-1">
                  {group.items.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => handleTabChange(item.id as TabType)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                        activeTab === item.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <item.icon size={16} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>



        {/* Mobile Menu Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[min(20rem,92vw)] max-w-[92vw] p-0 z-[60] overflow-hidden">
            <SheetHeader className="p-6 border-b border-border">
              <SheetTitle>Administration</SheetTitle>
            </SheetHeader>
            <nav className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-100px)]">
              {menuGroups.map((group, groupIndex) => {
                const isGroupOpen = openMenuGroup === group.label;
                const panelId = `admin-menu-mobile-${groupIndex}`;
                return (
                  <div key={group.label} className="rounded-lg border border-border/70">
                    <button
                      type="button"
                      aria-expanded={isGroupOpen}
                      aria-controls={panelId}
                      onClick={() =>
                        setOpenMenuGroup((cur) => (cur === group.label ? null : group.label))
                      }
                      className="w-full px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 flex items-center justify-between hover:text-foreground"
                    >
                      {group.label}
                      <ChevronRight
                        size={13}
                        className={`transition-transform ${isGroupOpen ? "rotate-90" : ""}`}
                      />
                    </button>
                    {isGroupOpen && (
                      <div id={panelId} className="space-y-1 px-2 pb-2 pt-1">
                        {group.items.map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => handleTabChange(item.id as TabType)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                              activeTab === item.id
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <item.icon size={16} />
                            <span className="truncate">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden flex flex-col">
          {/* Mobile Header */}
          <header className="lg:hidden sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="shrink-0 gap-2 border-primary text-primary"
              aria-label="Ouvrir le menu admin"
            >
              <Menu size={16} />
              Menu admin
            </Button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Section active</p>
              <h1 className="truncate text-sm font-semibold text-foreground">
                {menuItems.find((item) => item.id === activeTab)?.label ?? "Tableau de bord"}
              </h1>
            </div>
            </div>
          </header>
          
          <div className="min-w-0 max-w-full overflow-x-hidden p-3 sm:p-6 lg:p-8 pb-20 lg:pb-8 pt-4">

          {canRender("dashboard") && <AdminDashboard />}
          {canRender("stats") && <AdvancedStats />}
          {canRender("products") && <ProductsTab />}

          {canRender("categories") && <CategoriesTab />}
          {canRender("orders") && <OrdersTab />}
          {canRender("payments") && <PaymentsTab />}
          {canRender("deliveries") && <DeliveriesTab />}
          {canRender("users") && <UserManagement />}
          {canRender("roles") && <RolesPermissionsManagement />}
          {canRender("commissions") && <CommissionsManagement />}
          {canRender("promotions_mgmt") && <PromotionsManagement />}
          {canRender("flash_deals") && <FlashDealsManagement />}
          {canRender("review") && <PublicationsReview />}
          {canRender("articles") && <ArticlesTab />}
          {canRender("promotions") && <CouponManagement />}
          {canRender("advertisements") && <AdvertisementsManagement />}
          {canRender("faq") && <FAQManagement />}
          {canRender("referrals") && <ReferralsManagement />}
          {canRender("settings") && <PlatformSettings />}
          {canRender("zones") && <ZonesManagement />}
          {canRender("school_kits") && <SchoolKitsManagement />}
          {canRender("scholar_kits") && <ScholarKitsManagement />}
          {!canAccessAdminSection(roles, activeTab) && (
            <AccessDenied description="Votre rôle ne vous autorise pas à ouvrir cette section d'administration." />
          )}

          </div>
        </div>
      </div>
    </main>
  );
};

// Products Tab
const ProductsTab = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();

    const channel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*, categories(name_fr)")
      .order("created_at", { ascending: false });
    setProducts(data || []);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name_fr");
    setCategories(data || []);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;
    
    const { error } = await supabase.from("products").delete().eq("id", id);
    
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Produit supprimé");
      fetchProducts();
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name_fr.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground">Produits</h1>
        <div className="flex gap-2">
          <BulkProductImport onDone={fetchProducts} />
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingProduct(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus size={18} />
                Ajouter un produit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Modifier le produit" : "Ajouter un produit"}</DialogTitle>
              </DialogHeader>
              <ProductForm 
                product={editingProduct}
                categories={categories}
                onSubmit={() => { setIsDialogOpen(false); setEditingProduct(null); fetchProducts(); }}
                onCancel={() => { setIsDialogOpen(false); setEditingProduct(null); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Image</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nom</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Catégorie</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Prix</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Stock</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Statut</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-t border-border">
                  <td className="py-3 px-4">
                    <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                      <SmartImage 
                        src={product.image_url || "/placeholder.svg"} 
                        alt="" 
                        className="w-full h-full object-cover"
                        fallbackSrc="/placeholder.svg"
                        width={48}
                        height={48}
                        sizes="48px"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-sm">{product.name_fr}</td>
                  <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{product.categories?.name_fr || "-"}</td>
                  <td className="py-3 px-4 font-medium text-sm">{product.price.toLocaleString()} FCFA</td>
                  <td className="py-3 px-4 hidden sm:table-cell">{product.stock}</td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Categories Tab
const CategoriesTab = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name_fr: "",
    name_en: "",
    name_de: "",
    name_es: "",
    slug: "",
    image_url: "",
    parent_id: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name_fr");
    setCategories(data || []);
  };

  const handleSubmit = async () => {
    const slug = formData.slug || formData.name_fr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const categoryData = {
      name_fr: formData.name_fr,
      name_en: formData.name_en || formData.name_fr,
      name_de: formData.name_de || formData.name_fr,
      name_es: formData.name_es || formData.name_fr,
      slug,
      image_url: null,
      parent_id: formData.parent_id || null,
    };

    if (editingCategory) {
      const { error } = await supabase.from("categories").update(categoryData).eq("id", editingCategory.id);
      if (error) toast.error("Erreur lors de la modification");
      else toast.success("Catégorie modifiée");
    } else {
      const { error } = await supabase.from("categories").insert(categoryData);
      if (error) toast.error("Erreur lors de l'ajout");
      else toast.success("Catégorie ajoutée");
    }

    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({ name_fr: "", name_en: "", name_de: "", name_es: "", slug: "", image_url: "", parent_id: "" });
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error("Erreur");
    else { toast.success("Catégorie supprimée"); fetchCategories(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground">Catégories</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground"><Plus size={18} />Ajouter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Modifier" : "Ajouter"} une catégorie</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nom (FR) *</Label><Input value={formData.name_fr} onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })} /></div>
                <div><Label>Nom (EN)</Label><Input value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} /></div>
              </div>
              <div><Label>Slug</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="auto-generé si vide" /></div>
              <div><Label>URL Image</Label><Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} /></div>
              <Button onClick={handleSubmit}>{editingCategory ? "Modifier" : "Ajouter"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortCategories(categories).map((cat) => (
          <div key={cat.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {getCategoryInitials(cat.name_fr || "?")}
              </div>
              <div>
                <p className="font-medium">{cat.name_fr}</p>
                <p className="text-xs text-muted-foreground">{cat.slug}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(cat); setFormData(cat); setIsDialogOpen(true); }}>
                <Edit size={16} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
                <Trash2 size={16} className="text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Orders Tab
const OrdersTab = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, profiles(first_name, last_name), order_items(*)")
      .order("created_at", { ascending: false });
    setOrders(data || []);
  };

  const updateStatus = async (id: string, status: 'confirmed' | 'shipped' | 'delivered' | 'cancelled') => {
    await supabase.from("orders").update({ status }).eq("id", id);
    toast.success("Statut mis à jour");
    fetchOrders();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    const labels: Record<string, string> = {
      pending: "En attente",
      confirmed: "Confirmée",
      shipped: "Expédiée",
      delivered: "Livrée",
      cancelled: "Annulée"
    };
    return <Badge className={colors[status] || ""}>{labels[status] || status}</Badge>;
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Commandes</h1>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">N° Commande</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Total</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="py-3 px-4 font-mono text-sm">{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    {order.profiles?.first_name} {order.profiles?.last_name}
                  </td>
                  <td className="py-3 px-4 font-medium">{order.total_amount.toLocaleString()} FCFA</td>
                  <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                            <Eye size={16} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Commande #{order.id.slice(0, 8).toUpperCase()}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Adresse de livraison</p>
                              <p className="font-medium">{order.shipping_address || "Non renseignée"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Téléphone</p>
                              <p className="font-medium">{order.phone || "Non renseigné"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Articles</p>
                              {order.order_items?.map((item: any) => (
                                <div key={item.id} className="flex justify-between text-sm py-2 border-b border-border">
                                  <span>{item.product_name} x{item.quantity}</span>
                                  <span>{item.total_price.toLocaleString()} FCFA</span>
                                </div>
                              ))}
                            </div>
                            <div className="pt-4">
                              <Label>Changer le statut</Label>
                              <Select onValueChange={(val) => updateStatus(order.id, val as 'confirmed' | 'shipped' | 'delivered' | 'cancelled')}>
                                <SelectTrigger><SelectValue placeholder="Choisir un statut" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="confirmed">Confirmée</SelectItem>
                                  <SelectItem value="shipped">Expédiée</SelectItem>
                                  <SelectItem value="delivered">Livrée</SelectItem>
                                  <SelectItem value="cancelled">Annulée</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Deliveries Tab
const DeliveriesTab = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveryUsers, setDeliveryUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchDeliveryOrders();
    fetchDeliveryUsers();
  }, []);

  const fetchDeliveryOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, profiles(first_name, last_name)")
      .in("status", ["confirmed", "shipped"])
      .order("created_at", { ascending: false });
    setOrders(data || []);
  };

  const fetchDeliveryUsers = async () => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["commercial", "delivery"]);
    
    if (roleData && roleData.length > 0) {
      const userIds = roleData.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", userIds);
      setDeliveryUsers(profiles || []);
    }
  };

  const assignDelivery = async (orderId: string, deliveryUserId: string) => {
    await supabase.from("orders").update({ 
      delivery_user_id: deliveryUserId,
      status: 'shipped'
    }).eq("id", orderId);
    toast.success("Livreur assigné");
    fetchDeliveryOrders();
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Gestion des Livraisons</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">En attente d'assignation</p>
          <p className="text-3xl font-display font-bold text-yellow-600">
            {orders.filter(o => !o.delivery_user_id).length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">En cours de livraison</p>
          <p className="text-3xl font-display font-bold text-blue-600">
            {orders.filter(o => o.delivery_user_id && o.status === 'shipped').length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Livreurs disponibles</p>
          <p className="text-3xl font-display font-bold text-green-600">
            {deliveryUsers.length}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Commande</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Adresse</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Livreur</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="py-3 px-4 font-mono text-sm">{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="py-3 px-4">{order.profiles?.first_name} {order.profiles?.last_name}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate hidden md:table-cell">
                    {order.shipping_address || "Non renseignée"}
                  </td>
                  <td className="py-3 px-4">
                    {order.delivery_user_id ? (
                      <Badge variant="default">Assigné</Badge>
                    ) : (
                      <Select onValueChange={(val) => assignDelivery(order.id, val)}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Assigner" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.first_name} {user.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="icon">
                      <Eye size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Vendors Tab
const VendorsTab = () => {
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    const { data } = await supabase
      .from("vendor_settings")
      .select("*, profiles(first_name, last_name, email)")
      .order("created_at", { ascending: false });
    setVendors(data || []);
  };

  const toggleVerification = async (id: string, currentStatus: boolean) => {
    await supabase.from("vendor_settings").update({ is_verified: !currentStatus }).eq("id", id);
    toast.success(currentStatus ? "Vendeur désactivé" : "Vendeur vérifié");
    fetchVendors();
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Gestion des Vendeurs</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Total vendeurs</p>
          <p className="text-3xl font-display font-bold text-primary">{vendors.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Vendeurs vérifiés</p>
          <p className="text-3xl font-display font-bold text-green-600">
            {vendors.filter(v => v.is_verified).length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">En attente de vérification</p>
          <p className="text-3xl font-display font-bold text-yellow-600">
            {vendors.filter(v => !v.is_verified).length}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Boutique</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Propriétaire</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Commission</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ventes</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="border-t border-border">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {vendor.logo_url ? (
                        <img src={vendor.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <Store size={20} className="text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{vendor.store_name}</p>
                        <p className="text-xs text-muted-foreground">{vendor.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    {vendor.profiles?.first_name} {vendor.profiles?.last_name}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">{vendor.commission_rate}%</td>
                  <td className="py-3 px-4">{(vendor.total_sales || 0).toLocaleString()} FCFA</td>
                  <td className="py-3 px-4">
                    <Badge variant={vendor.is_verified ? "default" : "secondary"}>
                      {vendor.is_verified ? "Vérifié" : "En attente"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Switch
                      checked={vendor.is_verified}
                      onCheckedChange={() => toggleVerification(vendor.id, vendor.is_verified)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Commissions Tab
const CommissionsTab = () => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0 });

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    const { data } = await supabase
      .from("commissions")
      .select("*, vendor_settings(store_name)")
      .order("created_at", { ascending: false });
    setCommissions(data || []);

    const total = data?.reduce((sum, c) => sum + c.commission_amount, 0) || 0;
    const pending = data?.filter(c => c.status === "pending").reduce((sum, c) => sum + c.commission_amount, 0) || 0;
    const paid = data?.filter(c => c.status === "paid").reduce((sum, c) => sum + c.commission_amount, 0) || 0;
    setStats({ total, pending, paid });
  };

  const markAsPaid = async (id: string) => {
    await supabase.from("commissions").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    toast.success("Commission marquée comme payée");
    fetchCommissions();
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Gestion des Commissions</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Total commissions</p>
          <p className="text-3xl font-display font-bold text-primary">{stats.total.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">En attente</p>
          <p className="text-3xl font-display font-bold text-yellow-600">{stats.pending.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Payées</p>
          <p className="text-3xl font-display font-bold text-green-600">{stats.paid.toLocaleString()} FCFA</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vendeur</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Montant vente</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Taux</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Commission</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((commission) => (
                <tr key={commission.id} className="border-t border-border">
                  <td className="py-3 px-4 text-sm">{new Date(commission.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 px-4">{commission.vendor_settings?.store_name || "-"}</td>
                  <td className="py-3 px-4 hidden md:table-cell">{commission.sale_amount.toLocaleString()} FCFA</td>
                  <td className="py-3 px-4 hidden sm:table-cell">{commission.commission_rate}%</td>
                  <td className="py-3 px-4 font-medium text-primary">{commission.commission_amount.toLocaleString()} FCFA</td>
                  <td className="py-3 px-4">
                    <Badge variant={commission.status === "paid" ? "default" : "secondary"}>
                      {commission.status === "paid" ? "Payé" : "En attente"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {commission.status === "pending" && (
                      <Button variant="outline" size="sm" onClick={() => markAsPaid(commission.id)}>
                        Marquer payé
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Loyalty Tab
const LoyaltyTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalPoints: 0, usersWithPoints: 0, averagePoints: 0 });

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    // Get all users with their orders to calculate loyalty points
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email");

    const { data: orders } = await supabase
      .from("orders")
      .select("user_id, total_amount, status")
      .eq("status", "delivered");

    // Calculate points for each user (1 point per 1000 FCFA)
    const userPoints = profiles?.map(profile => {
      const userOrders = orders?.filter(o => o.user_id === profile.id) || [];
      const totalSpent = userOrders.reduce((acc, o) => acc + o.total_amount, 0);
      const points = Math.floor(totalSpent / 1000);
      return {
        ...profile,
        points,
        totalSpent,
        ordersCount: userOrders.length
      };
    }).filter(u => u.points > 0).sort((a, b) => b.points - a.points) || [];

    setUsers(userPoints);

    // Calculate stats
    const totalPoints = userPoints.reduce((acc, u) => acc + u.points, 0);
    const usersWithPoints = userPoints.length;
    const averagePoints = usersWithPoints > 0 ? Math.round(totalPoints / usersWithPoints) : 0;
    setStats({ totalPoints, usersWithPoints, averagePoints });
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Programme de Fidélité</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Total points distribués</p>
          <p className="text-3xl font-display font-bold text-primary">{stats.totalPoints.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Clients avec points</p>
          <p className="text-3xl font-display font-bold text-green-600">{stats.usersWithPoints}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Points moyens/client</p>
          <p className="text-3xl font-display font-bold text-blue-600">{stats.averagePoints}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Règle d'acquisition</p>
          <p className="text-lg font-bold text-foreground">1 pt / 1000 FCFA</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 mb-8">
        <h3 className="font-semibold mb-4">Récompenses disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="font-medium">-5% sur commande</p>
            <p className="text-sm text-muted-foreground">50 points requis</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="font-medium">Livraison express</p>
            <p className="text-sm text-muted-foreground">100 points requis</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="font-medium">-10% sur commande</p>
            <p className="text-sm text-muted-foreground">200 points requis</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Top clients fidèles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rang</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Points</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Total dépensé</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Commandes</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 20).map((user, index) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-amber-100 text-amber-800' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      <Gift size={14} />
                      {user.points}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">{user.totalSpent.toLocaleString()} FCFA</td>
                  <td className="py-3 px-4 hidden md:table-cell">{user.ordersCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Articles Tab
const ArticlesTab = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchArticles();

    const channel = supabase
      .channel('articles-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, fetchArticles)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchArticles = async () => {
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });
    setArticles(data || []);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("articles").update({ 
      status, 
      published_at: status === "published" ? new Date().toISOString() : null 
    }).eq("id", id);
    toast.success(`Article ${status === "published" ? "publié" : "mis en brouillon"}`);
    fetchArticles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet article ?")) return;
    await supabase.from("articles").delete().eq("id", id);
    toast.success("Article supprimé");
    fetchArticles();
  };

  const filteredArticles = articles.filter((a) =>
    a.title_fr.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="default" className="bg-green-500">Publié</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500 text-black">En attente</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="outline">Brouillon</Badge>;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground">Gestion des Actualités</h1>
        <Button onClick={() => navigate('/actualites/write')} className="bg-primary text-primary-foreground">
          <Plus size={18} />
          Nouvelle actualité
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un article..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Image</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Titre</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Catégorie</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Vues</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Likes</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map((article) => (
                <tr key={article.id} className="border-t border-border">
                  <td className="py-3 px-4">
                    <div className="w-16 h-12 bg-muted rounded-lg overflow-hidden">
                      <img 
                        src={article.cover_image || "/placeholder.svg"} 
                        alt="" 
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium max-w-xs truncate">{article.title_fr}</td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <Badge variant="outline">{article.category}</Badge>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">{article.views || 0}</td>
                  <td className="py-3 px-4 hidden md:table-cell">{article.likes || 0}</td>
                  <td className="py-3 px-4">
                    {getStatusBadge(article.status)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => navigate(`/actualites/edit/${article.id}`)}
                        title="Modifier"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => updateStatus(article.id, article.status === "published" ? "draft" : "published")}
                      >
                        {article.status === "published" ? "Dépublier" : "Publier"}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)}>
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Resources Admin Tab
const ResourcesAdminTab = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchResources(); }, []);

  const fetchResources = async () => {
    setLoading(true);
    const { data } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
    setResources(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette ressource ?")) return;
    await supabase.from("resources").delete().eq("id", id);
    toast.success("Supprimée");
    fetchResources();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground">Ressources Éducatives</h1>
        <Badge variant="outline">{resources.length} ressources</Badge>
      </div>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucune ressource éducative.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">Titre</th>
                  <th className="text-left p-3 hidden sm:table-cell">Catégorie</th>
                  <th className="text-left p-3 hidden md:table-cell">Matière</th>
                  <th className="text-left p-3">Prix</th>
                  <th className="text-left p-3 hidden md:table-cell">Téléch.</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((res) => (
                  <tr key={res.id} className="border-t border-border">
                    <td className="p-3 font-medium">{res.title_fr}</td>
                    <td className="p-3 hidden sm:table-cell"><Badge variant="outline">{res.category}</Badge></td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{res.subject || 'Général'}</td>
                    <td className="p-3">
                      <Badge variant={res.is_free ? "default" : "secondary"}>
                        {res.is_free ? "Gratuit" : `${res.price} FCFA`}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{res.downloads || 0}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(res.id)}>
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Referrals Admin Tab
const ReferralsAdminTab = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [refResult, rewResult] = await Promise.all([
      supabase.from("referrals").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("referral_rewards").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setReferrals(refResult.data || []);
    setRewards(rewResult.data || []);
    setLoading(false);
  };

  const completedCount = referrals.filter(r => r.status === 'completed').length;
  const totalRewards = rewards.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground">Programme de Parrainage</h1>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">{referrals.length} parrainages</Badge>
          <Badge variant="default">{completedCount} complétés</Badge>
          <Badge variant="secondary">{totalRewards.toLocaleString()} FCFA récompenses</Badge>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{referrals.length}</p>
          <p className="text-xs text-muted-foreground">Total parrainages</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{completedCount}</p>
          <p className="text-xs text-muted-foreground">Complétés</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{rewards.length}</p>
          <p className="text-xs text-muted-foreground">Récompenses</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalRewards.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">FCFA distribués</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : referrals.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <UserPlus size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucun parrainage enregistré.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">Code</th>
                  <th className="text-left p-3 hidden sm:table-cell">Date</th>
                  <th className="text-left p-3">Statut</th>
                  <th className="text-left p-3 hidden md:table-cell">Récompense</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref) => (
                  <tr key={ref.id} className="border-t border-border">
                    <td className="p-3 font-mono font-medium">{ref.referral_code}</td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">
                      {new Date(ref.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-3">
                      <Badge variant={ref.status === 'completed' ? 'default' : 'secondary'}>
                        {ref.status === 'completed' ? 'Complété' : 'En attente'}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <Badge variant={ref.reward_given ? 'default' : 'outline'}>
                        {ref.reward_given ? '✅ Donnée' : '⏳ En attente'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;