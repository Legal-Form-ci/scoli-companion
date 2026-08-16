import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Package, 
  DollarSign, 
  ShoppingBag, 
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Store,
  BarChart3,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name_fr: string;
  price: number;
  stock: number;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface VendorSettings {
  store_name: string;
  store_description: string | null;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  total_sales: number;
  pending_payout: number;
  commission_rate: number;
}

const VendorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<VendorSettings | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    pendingOrders: 0,
    revenue: 0
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkVendorAccess();
  }, [user, navigate]);

  const checkVendorAccess = async () => {
    if (!user) return;

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasAccess = roles?.some(r => 
      r.role === 'super_admin' || r.role === 'admin' || r.role === 'commercial' || r.role === 'vendor'
    );

    if (!hasAccess) {
      toast.error("Accès non autorisé");
      navigate("/");
      return;
    }

    fetchData();
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch vendor settings
      const { data: vendorData } = await supabase
        .from('vendor_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (vendorData) {
        setSettings(vendorData);
      } else {
        // Create vendor settings if not exists
        const { data: newVendor } = await supabase
          .from('vendor_settings')
          .insert({
            user_id: user.id,
            store_name: 'Ma Boutique'
          })
          .select()
          .single();
        
        if (newVendor) {
          setSettings(newVendor);
        }
      }

      // Fetch vendor products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });
      
      setProducts(productsData || []);

      // Fetch orders containing vendor products
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          order_id,
          total_price,
          product_id
        `)
        .in('product_id', (productsData || []).map(p => p.id));

      if (orderItems && orderItems.length > 0) {
        const orderIds = [...new Set(orderItems.map(oi => oi.order_id))];
        
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .in('id', orderIds)
          .order('created_at', { ascending: false });
        
        setOrders(ordersData || []);

        // Calculate stats
        const totalRevenue = orderItems.reduce((sum, oi) => sum + oi.total_price, 0);
        const pendingOrders = (ordersData || []).filter(o => o.status === 'pending').length;

        setStats({
          totalProducts: (productsData || []).length,
          totalSales: orderItems.length,
          pendingOrders,
          revenue: totalRevenue
        });
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const updateSettings = async () => {
    if (!user || !settings) return;

    try {
      await supabase
        .from('vendor_settings')
        .update({
          store_name: settings.store_name,
          store_description: settings.store_description,
          phone: settings.phone,
          address: settings.address,
          city: settings.city
        })
        .eq('user_id', user.id);
      
      toast.success("Paramètres mis à jour");
      setShowSettingsDialog(false);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;

    try {
      await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      toast.success("Produit supprimé");
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const toggleProductStatus = async (productId: string, isActive: boolean) => {
    try {
      await supabase
        .from('products')
        .update({ is_active: !isActive })
        .eq('id', productId);
      
      toast.success(isActive ? "Produit désactivé" : "Produit activé");
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                {settings?.store_name || 'Ma Boutique'}
              </h1>
              <p className="text-muted-foreground">
                Gérez vos produits et suivez vos ventes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
                <Settings size={18} />
                Paramètres
              </Button>
              <Button variant="hero" onClick={() => navigate('/admin')}>
                <Plus size={18} />
                Nouveau produit
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Produits</p>
                    <p className="text-2xl font-bold">{stats.totalProducts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenus</p>
                    <p className="text-2xl font-bold">{stats.revenue.toLocaleString()} FCFA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                    <ShoppingBag className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ventes</p>
                    <p className="text-2xl font-bold">{stats.totalSales}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/20">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">À encaisser</p>
                    <p className="text-2xl font-bold">
                      {(settings?.pending_payout || 0).toLocaleString()} FCFA
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="products" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="products" className="gap-2">
                <Package size={16} />
                Mes Produits
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2">
                <ShoppingBag size={16} />
                Commandes
                {stats.pendingOrders > 0 && (
                  <Badge variant="destructive">{stats.pendingOrders}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2">
                <BarChart3 size={16} />
                Statistiques
              </TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Mes Produits</CardTitle>
                  <CardDescription>
                    Gérez votre catalogue de produits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {products.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun produit</p>
                      <Button variant="hero" className="mt-4" onClick={() => navigate('/admin')}>
                        <Plus size={18} />
                        Ajouter un produit
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead>Prix</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {product.image_url && (
                                    <img 
                                      src={product.image_url} 
                                      alt={product.name_fr}
                                      className="w-10 h-10 rounded object-cover"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">{product.name_fr}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(product.created_at)}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{product.price.toLocaleString()} FCFA</TableCell>
                              <TableCell>
                                <Badge variant={product.stock > 0 ? "secondary" : "destructive"}>
                                  {product.stock}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={product.is_active ? "default" : "outline"}>
                                  {product.is_active ? "Actif" : "Inactif"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => window.open(`/product/${product.id}`, '_blank')}
                                  >
                                    <Eye size={16} />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => toggleProductStatus(product.id, product.is_active)}
                                  >
                                    {product.is_active ? '🔴' : '🟢'}
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => deleteProduct(product.id)}
                                  >
                                    <Trash2 size={16} className="text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Commandes</CardTitle>
                  <CardDescription>
                    Suivez les commandes contenant vos produits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune commande</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div 
                          key={order.id}
                          className="p-4 border border-border rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">
                                Commande #{order.id.slice(0, 8).toUpperCase()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(order.created_at)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">
                                {order.total_amount.toLocaleString()} FCFA
                              </p>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats">
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques</CardTitle>
                  <CardDescription>
                    Aperçu de vos performances
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-muted/50 rounded-lg">
                      <h3 className="font-semibold mb-4">Commission</h3>
                      <p className="text-3xl font-bold text-primary">
                        {settings?.commission_rate || 10}%
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Taux de commission sur vos ventes
                      </p>
                    </div>
                    <div className="p-6 bg-muted/50 rounded-lg">
                      <h3 className="font-semibold mb-4">Total des ventes</h3>
                      <p className="text-3xl font-bold text-green-600">
                        {(settings?.total_sales || 0).toLocaleString()} FCFA
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Montant total de vos ventes
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Paramètres de la boutique</DialogTitle>
          </DialogHeader>
          {settings && (
            <div className="space-y-4">
              <div>
                <Label>Nom de la boutique</Label>
                <Input
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={settings.store_description || ''}
                  onChange={(e) => setSettings({ ...settings, store_description: e.target.value })}
                />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input
                  value={settings.phone || ''}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Ville</Label>
                <Input
                  value={settings.city || ''}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                />
              </div>
              <div>
                <Label>Adresse</Label>
                <Input
                  value={settings.address || ''}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                />
              </div>
              <Button className="w-full" onClick={updateSettings}>
                Enregistrer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  );
};

export default VendorDashboard;
