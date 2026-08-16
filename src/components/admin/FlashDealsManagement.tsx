import { useState, useEffect } from "react";
import { Zap, Edit, Trash2, Search, Save, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FlashDealsManagement = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editForm, setEditForm] = useState({ discount_percent: 0, original_price: 0, price: 0, image_url: "" });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  useEffect(() => { fetchFlashDeals(); }, []);

  const fetchFlashDeals = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name_fr, price, original_price, discount_percent, image_url, images, stock, is_active")
      .gt("discount_percent", 0)
      .order("discount_percent", { ascending: false });
    setProducts(data || []);
  };

  const fetchAllProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name_fr, price, original_price, discount_percent, image_url, is_active")
      .eq("is_active", true)
      .order("name_fr");
    setAllProducts(data || []);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setEditForm({
      discount_percent: product.discount_percent || 0,
      original_price: product.original_price || product.price,
      price: product.price,
      image_url: product.image_url || "",
    });
  };

  const handleSave = async () => {
    if (!editingProduct) return;
    const discountedPrice = Math.round(editForm.original_price * (1 - editForm.discount_percent / 100));
    const { error } = await supabase.from("products").update({
      discount_percent: editForm.discount_percent,
      original_price: editForm.original_price,
      price: discountedPrice,
      image_url: editForm.image_url || editingProduct.image_url,
    }).eq("id", editingProduct.id);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Vente flash mise à jour");
    setEditingProduct(null);
    fetchFlashDeals();
  };

  const removeFlashDeal = async (id: string) => {
    if (!confirm("Retirer des ventes flash ?")) return;
    await supabase.from("products").update({ discount_percent: 0 }).eq("id", id);
    toast.success("Retiré des ventes flash");
    fetchFlashDeals();
  };

  const addFlashDeal = async (product: any) => {
    const originalPrice = product.original_price || product.price;
    const discountedPrice = Math.round(originalPrice * 0.8); // 20% default
    await supabase.from("products").update({
      discount_percent: 20,
      original_price: originalPrice,
      price: discountedPrice,
    }).eq("id", product.id);
    toast.success(`${product.name_fr} ajouté en vente flash`);
    setShowAddDialog(false);
    fetchFlashDeals();
  };

  const filtered = products.filter(p => p.name_fr.toLowerCase().includes(search.toLowerCase()));
  const availableProducts = allProducts.filter(p =>
    (p.discount_percent || 0) === 0 && p.name_fr.toLowerCase().includes(addSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-destructive/10">
            <Zap size={20} className="text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Ventes Flash</h2>
            <p className="text-sm text-muted-foreground">{products.length} produits en promotion</p>
          </div>
        </div>
        <Button onClick={() => { fetchAllProducts(); setShowAddDialog(true); }}>
          <Zap size={16} /> Ajouter un produit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{products.length}</p>
          <p className="text-xs text-muted-foreground">Produits en flash</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-destructive">
            {products.length > 0 ? Math.round(products.reduce((s, p) => s + (p.discount_percent || 0), 0) / products.length) : 0}%
          </p>
          <p className="text-xs text-muted-foreground">Remise moyenne</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {products.reduce((s, p) => s + (p.stock || 0), 0)}
          </p>
          <p className="text-xs text-muted-foreground">Stock total</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            {products.filter(p => p.is_active).length}
          </p>
          <p className="text-xs text-muted-foreground">Actifs</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Flash deals list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Zap size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucune vente flash active.</p>
          <Button variant="outline" className="mt-4" onClick={() => { fetchAllProducts(); setShowAddDialog(true); }}>
            Ajouter un produit en vente flash
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">Image</th>
                  <th className="text-left p-3">Produit</th>
                  <th className="text-left p-3">Prix original</th>
                  <th className="text-left p-3">Remise</th>
                  <th className="text-left p-3">Prix flash</th>
                  <th className="text-left p-3 hidden sm:table-cell">Stock</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => (
                  <tr key={product.id} className="border-t border-border">
                    <td className="p-3">
                      <div className="w-14 h-14 bg-muted rounded-lg overflow-hidden">
                        <img
                          src={product.image_url || (product.images?.[0]) || "/placeholder.svg"}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                        />
                      </div>
                    </td>
                    <td className="p-3 font-medium max-w-[200px] truncate">{product.name_fr}</td>
                    <td className="p-3 text-muted-foreground line-through">
                      {(product.original_price || product.price).toLocaleString()} FCFA
                    </td>
                    <td className="p-3">
                      <Badge variant="destructive" className="animate-pulse">-{product.discount_percent}%</Badge>
                    </td>
                    <td className="p-3 font-bold text-primary">{product.price.toLocaleString()} FCFA</td>
                    <td className="p-3 hidden sm:table-cell">{product.stock || 0}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} title="Modifier">
                          <Edit size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeFlashDeal(product.id)} title="Retirer">
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
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={o => { if (!o) setEditingProduct(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la vente flash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground">{editingProduct?.name_fr}</p>
            <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src={editForm.image_url || "/placeholder.svg"}
                alt=""
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
            </div>
            <div>
              <Label>URL de l'image</Label>
              <Input value={editForm.image_url} onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prix original (FCFA)</Label>
                <Input type="number" value={editForm.original_price} onChange={e => setEditForm(f => ({ ...f, original_price: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Remise (%)</Label>
                <Input type="number" min={1} max={90} value={editForm.discount_percent} onChange={e => setEditForm(f => ({ ...f, discount_percent: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Prix après remise</p>
              <p className="text-xl font-bold text-primary">
                {Math.round(editForm.original_price * (1 - editForm.discount_percent / 100)).toLocaleString()} FCFA
              </p>
            </div>
            <Button onClick={handleSave} className="w-full">
              <Save size={16} /> Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Ajouter un produit en vente flash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher un produit..." value={addSearch} onChange={e => setAddSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {availableProducts.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">Aucun produit disponible</p>
              ) : (
                availableProducts.slice(0, 20).map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded overflow-hidden">
                        <img src={product.image_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{product.name_fr}</p>
                        <p className="text-xs text-muted-foreground">{product.price.toLocaleString()} FCFA</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => addFlashDeal(product)}>
                      <Zap size={14} /> Flash -20%
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlashDealsManagement;
