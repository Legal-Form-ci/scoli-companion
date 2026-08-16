import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, ShoppingBag, Settings, LogOut, Package, CheckCircle, Truck, Bell, Clock, MapPin, Heart, Gift, Plus, Edit, Trash2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentStatusTracker from "@/components/PaymentStatusTracker";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  preferred_language: string | null;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  discount_amount: number;
  shipping_address: string | null;
  phone: string | null;
  delivery_received_at: string | null;
  delivery_delivered_at: string | null;
  customer_confirmed_at: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface Address {
  id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  phone: string;
  isDefault: boolean;
}

interface LoyaltyReward {
  id: string;
  reward_type: string;
  points_spent: number;
  coupon_code: string;
  is_used: boolean;
  expires_at: string;
  created_at: string;
}

const Account = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile>({
    first_name: "",
    last_name: "",
    phone: "",
    preferred_language: language,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoyaltyReward[]>([]);
  const [redeemingReward, setRedeemingReward] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    name: '',
    address: '',
    city: '',
    region: '',
    phone: '',
    isDefault: false
  });
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
    fetchOrders();
    fetchNotifications();
    fetchAddresses();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          preferred_language: data.preferred_language || language,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      
      // Fetch loyalty points from database function
      const { data: pointsData } = await supabase.rpc('get_user_loyalty_points');
      if (pointsData && pointsData[0]) {
        setLoyaltyPoints(pointsData[0].available || 0);
      } else {
        // Fallback calculation
        const deliveredOrders = (data || []).filter(o => o.status === 'delivered');
        const totalSpent = deliveredOrders.reduce((acc, o) => acc + o.total_amount, 0);
        setLoyaltyPoints(Math.floor(totalSpent / 1000));
      }

      // Fetch user's loyalty rewards
      const { data: rewards } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setLoyaltyRewards(rewards || []);

      // Fetch order items for each order
      for (const order of data || []) {
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);
        
        if (items) {
          setOrderItems(prev => ({ ...prev, [order.id]: items }));
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    try {
      const { data: accepted, error } = await (supabase as any).rpc('confirm_order_receipt', { _order_id: orderId });

      if (error) throw error;
      if (!accepted) throw new Error('Commande non autorisée');

      toast({
        title: "Livraison confirmée",
        description: "Merci d'avoir confirmé la réception de votre commande !",
      });

      fetchOrders();
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast({
        title: t.common.error,
        description: t.common.tryAgain,
        variant: "destructive",
      });
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleRedeemReward = async (rewardType: string, pointsRequired: number, rewardName: string) => {
    if (redeemingReward) return;
    if (loyaltyPoints < pointsRequired) {
      toast({
        title: "Points insuffisants",
        description: `Vous avez besoin de ${pointsRequired} points pour cette récompense.`,
        variant: "destructive",
      });
      return;
    }

    setRedeemingReward(rewardType);
    try {
      const { data, error } = await supabase.rpc('redeem_loyalty_points', {
        _reward_type: rewardType,
        _points_required: pointsRequired
      });

      if (error) throw error;

      const result = data?.[0];
      if (result?.success) {
        toast({
          title: "Récompense échangée !",
          description: `${rewardName} - Code: ${result.coupon_code}`,
        });
        // Refresh data
        fetchOrders();
      } else {
        toast({
          title: "Échec de l'échange",
          description: result?.message || "Une erreur est survenue",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast({
        title: t.common.error,
        description: t.common.tryAgain,
        variant: "destructive",
      });
    } finally {
      setRedeemingReward(null);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          preferred_language: profile.preferred_language,
        });

      if (error) throw error;

      if (profile.preferred_language) {
        setLanguage(profile.preferred_language as 'fr' | 'en' | 'de' | 'es');
      }

      toast({
        title: t.common.success,
        description: t.account.saveChanges,
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: t.common.error,
        description: t.common.tryAgain,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_addresses' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setAddresses((data as any[]).map(a => ({
          id: a.id,
          name: a.name,
          address: a.address,
          city: a.city,
          region: a.region,
          phone: a.phone || '',
          isDefault: a.is_default,
        })));
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const handleAddAddress = async () => {
    if (!user) return;
    if (!newAddress.name || !newAddress.address || !newAddress.city || !newAddress.region) {
      toast({ title: "Champs manquants", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_addresses' as any)
        .insert({
          user_id: user.id,
          name: newAddress.name.trim(),
          address: newAddress.address.trim(),
          city: newAddress.city.trim(),
          region: newAddress.region.trim(),
          phone: newAddress.phone?.trim() || null,
          is_default: newAddress.isDefault,
        })
        .select()
        .single();
      if (error) throw error;
      setAddresses(prev => [...prev, {
        id: (data as any).id,
        name: (data as any).name,
        address: (data as any).address,
        city: (data as any).city,
        region: (data as any).region,
        phone: (data as any).phone || '',
        isDefault: (data as any).is_default,
      }]);
      setNewAddress({ name: '', address: '', city: '', region: '', phone: '', isDefault: false });
      setIsAddressDialogOpen(false);
      toast({ title: "Adresse ajoutée", description: "L'adresse a été enregistrée avec succès." });
    } catch (err) {
      console.error('Error saving address:', err);
      toast({ title: "Erreur", description: "Impossible d'enregistrer l'adresse.", variant: "destructive" });
    }
  };

  const handleRemoveAddress = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_addresses' as any)
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);
      if (error) throw error;
      setAddresses(prev => prev.filter(a => a.id !== id));
      toast({ title: "Adresse supprimée" });
    } catch (err) {
      console.error('Error deleting address:', err);
      toast({ title: "Erreur", description: "Impossible de supprimer l'adresse.", variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' ' + t.common.currency;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-GB' : 'fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t.account.statusPending;
      case 'confirmed': return t.account.statusConfirmed;
      case 'shipped': return t.account.statusShipped;
      case 'delivered': return t.account.statusDelivered;
      case 'cancelled': return t.account.statusCancelled;
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const canConfirmDelivery = (order: Order) => {
    return order.delivery_delivered_at && !order.customer_confirmed_at;
  };

  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  // Calculate stats
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => !!o.customer_confirmed_at || o.status === 'delivered').length;
  const totalSpent = orders.filter(o => !!o.customer_confirmed_at || o.status === 'delivered').reduce((acc, o) => acc + o.total_amount, 0);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                {t.account.title}
              </h1>
              <p className="text-muted-foreground">Bienvenue, {profile.first_name || 'Client'}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut size={18} />
              <span className="hidden sm:inline">{t.nav.logout}</span>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ShoppingBag size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Commandes</p>
                    <p className="text-xl font-bold">{totalOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CheckCircle size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Livrées</p>
                    <p className="text-xl font-bold">{deliveredOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Gift size={20} className="text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Points fidélité</p>
                    <p className="text-xl font-bold">{loyaltyPoints}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/20">
                    <Package size={20} className="text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total dépensé</p>
                    <p className="text-lg font-bold">{formatPrice(totalSpent)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="orders" className="space-y-8">
            <TabsList className="bg-card border border-border flex-wrap h-auto p-1">
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingBag size={18} />
                <span className="hidden sm:inline">{t.account.orders}</span>
                {orders.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{orders.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2 relative">
                <Bell size={18} />
                <span className="hidden sm:inline">Notifications</span>
                {unreadNotifications > 0 && (
                  <Badge variant="destructive" className="ml-1">{unreadNotifications}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="addresses" className="flex items-center gap-2">
                <MapPin size={18} />
                <span className="hidden sm:inline">Adresses</span>
              </TabsTrigger>
              <TabsTrigger value="loyalty" className="flex items-center gap-2">
                <Gift size={18} />
                <span className="hidden sm:inline">Fidélité</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User size={18} />
                <span className="hidden sm:inline">{t.account.profile}</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings size={18} />
                <span className="hidden sm:inline">{t.account.settings}</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard size={18} />
                <span className="hidden sm:inline">Paiements</span>
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <h2 className="text-xl font-display font-bold text-foreground mb-6">
                  {t.account.orderHistory}
                </h2>

                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t.account.noOrders}</p>
                    <Button variant="hero" className="mt-4" onClick={() => navigate('/shop')}>
                      Découvrir nos produits
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 sm:p-6 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div>
                            <p className="font-semibold text-foreground flex items-center gap-2">
                              <Package size={18} />
                              Commande #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="font-bold text-primary text-lg">
                              {formatPrice(order.total_amount)}
                            </p>
                            {order.discount_amount > 0 && (
                              <p className="text-xs text-primary font-medium">
                                -{formatPrice(order.discount_amount)} économisé
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Order Items */}
                        {orderItems[order.id] && orderItems[order.id].length > 0 && (
                          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm font-medium mb-2">Articles commandés:</p>
                            <div className="space-y-1">
                              {orderItems[order.id].map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span>{item.product_name} x{item.quantity}</span>
                                  <span className="text-muted-foreground">{formatPrice(item.total_price)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Order Status Timeline */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                          
                          {order.delivery_received_at && (
                            <Badge variant="outline" className="text-xs">
                              <Truck size={12} className="mr-1" />
                              Réceptionné par livreur
                            </Badge>
                          )}
                          
                          {order.delivery_delivered_at && (
                            <Badge variant="outline" className="text-xs text-primary border-primary">
                              <CheckCircle size={12} className="mr-1" />
                              Livré
                            </Badge>
                          )}
                          
                          {order.customer_confirmed_at && (
                            <Badge className="bg-green-500 text-white text-xs">
                              <CheckCircle size={12} className="mr-1" />
                              Réception confirmée
                            </Badge>
                          )}
                        </div>

                        {/* Shipping Address */}
                        {order.shipping_address && (
                          <p className="text-sm text-muted-foreground mb-4 flex items-start gap-2">
                            <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                            {order.shipping_address}
                          </p>
                        )}

                        {/* Confirm Delivery Button */}
                        {canConfirmDelivery(order) && (
                          <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                            <p className="text-sm text-green-700 dark:text-green-400 mb-3">
                              Le livreur indique vous avoir remis cette commande. Confirmez uniquement si vous l'avez bien reçue.
                            </p>
                            <Button
                              variant="hero"
                              size="sm"
                              onClick={() => handleConfirmDelivery(order.id)}
                            >
                              <CheckCircle size={16} />
                              Confirmer la réception
                            </Button>
                          </div>
                        )}

                        {/* Pending Delivery */}
                        {order.status === 'shipped' && !order.delivery_delivered_at && (
                          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                            <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                              <Truck size={16} className="animate-pulse" />
                              Votre commande est en cours de livraison...
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <h2 className="text-xl font-display font-bold text-foreground mb-6">
                  Notifications
                </h2>

                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucune notification</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                        className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                          notification.is_read 
                            ? 'border-border bg-muted/30' 
                            : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full flex-shrink-0 ${
                            notification.type === 'order' ? 'bg-primary/10 text-primary' :
                            notification.type === 'delivery' ? 'bg-secondary/20 text-secondary-foreground' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {notification.type === 'order' ? <ShoppingBag size={16} /> :
                             notification.type === 'delivery' ? <Truck size={16} /> :
                             <Bell size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{notification.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <Clock size={12} />
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses">
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-display font-bold text-foreground">
                    Mes adresses de livraison
                  </h2>
                  <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="hero" size="sm">
                        <Plus size={16} />
                        Ajouter
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter une adresse</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Nom de l'adresse</Label>
                          <Input
                            placeholder="Ex: Maison, Bureau..."
                            value={newAddress.name}
                            onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Adresse complète</Label>
                          <Textarea
                            placeholder="Rue, quartier, repères..."
                            value={newAddress.address}
                            onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Ville</Label>
                            <Input
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Région</Label>
                            <Input
                              value={newAddress.region}
                              onChange={(e) => setNewAddress({ ...newAddress, region: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Téléphone</Label>
                          <Input
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                          />
                        </div>
                        <Button onClick={handleAddAddress} className="w-full">
                          Enregistrer l'adresse
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Aucune adresse enregistrée</p>
                    <p className="text-sm text-muted-foreground">
                      Ajoutez vos adresses pour accélérer vos futures commandes
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="p-4 border border-border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold flex items-center gap-2">
                              {addr.name}
                              {addr.isDefault && <Badge variant="secondary">Par défaut</Badge>}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">{addr.address}</p>
                            <p className="text-sm text-muted-foreground">{addr.city}, {addr.region}</p>
                            <p className="text-sm text-muted-foreground">{addr.phone}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveAddress(addr.id)}>
                            <Trash2 size={16} className="text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Loyalty Tab */}
            <TabsContent value="loyalty">
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <h2 className="text-xl font-display font-bold text-foreground mb-6">
                  Programme de fidélité
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gift className="text-primary" />
                        Vos points
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-primary">{loyaltyPoints}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Gagnez 1 point pour chaque 1000 FCFA dépensés
                      </p>
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Prochain palier (100 pts)</span>
                          <span>{loyaltyPoints}/100</span>
                        </div>
                        <Progress value={(loyaltyPoints / 100) * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Récompenses disponibles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">-5% sur la prochaine commande</p>
                          <p className="text-xs text-muted-foreground">50 points requis</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled={loyaltyPoints < 50 || redeemingReward === 'discount_5'}
                          onClick={() => handleRedeemReward('discount_5', 50, '-5% sur la prochaine commande')}
                        >
                          {redeemingReward === 'discount_5' ? 'Échange...' : 'Échanger'}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">Livraison express gratuite</p>
                          <p className="text-xs text-muted-foreground">100 points requis</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled={loyaltyPoints < 100 || redeemingReward === 'free_shipping'}
                          onClick={() => handleRedeemReward('free_shipping', 100, 'Livraison express gratuite')}
                        >
                          {redeemingReward === 'free_shipping' ? 'Échange...' : 'Échanger'}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">-10% sur votre commande</p>
                          <p className="text-xs text-muted-foreground">200 points requis</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled={loyaltyPoints < 200 || redeemingReward === 'discount_10'}
                          onClick={() => handleRedeemReward('discount_10', 200, '-10% sur votre commande')}
                        >
                          {redeemingReward === 'discount_10' ? 'Échange...' : 'Échanger'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mes récompenses échangées */}
                  {loyaltyRewards.length > 0 && (
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle>Mes récompenses échangées</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {loyaltyRewards.map((reward) => (
                            <div key={reward.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                              <div>
                                <p className="font-medium">
                                  {reward.reward_type === 'discount_5' && '-5% sur commande'}
                                  {reward.reward_type === 'free_shipping' && 'Livraison gratuite'}
                                  {reward.reward_type === 'discount_10' && '-10% sur commande'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Code: <span className="font-mono font-semibold">{reward.coupon_code}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Expire le: {new Date(reward.expires_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <Badge variant={reward.is_used ? "secondary" : "default"}>
                                {reward.is_used ? "Utilisé" : "Actif"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <h2 className="text-xl font-display font-bold text-foreground mb-6">
                  {t.account.profile}
                </h2>

                <div className="max-w-md space-y-4">
                  <div>
                    <Label htmlFor="firstName">{t.auth.firstName}</Label>
                    <Input
                      id="firstName"
                      value={profile.first_name || ""}
                      onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t.auth.lastName}</Label>
                    <Input
                      id="lastName"
                      value={profile.last_name || ""}
                      onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={profile.phone || ""}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user.email || ""}
                      disabled
                      className="mt-1 bg-muted"
                    />
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? t.common.loading : t.account.saveChanges}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <h2 className="text-xl font-display font-bold text-foreground mb-6">
                  {t.account.settings}
                </h2>

                <div className="max-w-md space-y-6">
                  <div>
                    <Label htmlFor="language">{t.account.language}</Label>
                    <select
                      id="language"
                      value={profile.preferred_language || language}
                      onChange={(e) => {
                        setProfile({ ...profile, preferred_language: e.target.value });
                        setLanguage(e.target.value as 'fr' | 'en' | 'de' | 'es');
                      }}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="de">Deutsch</option>
                      <option value="es">Español</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h3 className="font-semibold text-destructive mb-4">Zone dangereuse</h3>
                    <Button variant="outline" className="text-destructive border-destructive">
                      Supprimer mon compte
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <h2 className="text-xl font-display font-bold text-foreground mb-6">
                  Historique des paiements
                </h2>
                
                <PaymentStatusTracker
                  userId={user?.id}
                  showLogs={false}
                />

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Consultez l'historique de vos paiements et suivez leur statut en temps réel.
                    Les paiements sont automatiquement mis à jour.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </main>
  );
};

export default Account;