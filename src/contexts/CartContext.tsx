import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

const LOCAL_CART_KEY = 'izyscoly_guest_cart';
const KITS_CART_KEY = 'scoly_kits_cart';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product?: {
    id: string;
    name_fr: string;
    name_en: string;
    name_de: string;
    name_es: string;
    price: number;
    original_price: number | null;
    image_url: string | null;
    stock: number;
  };
}

interface GuestCartItem {
  product_id: string;
  quantity: number;
}

export interface KitCompositionEntry {
  name: string;
  quantity: number;
  is_optional: boolean;
  estimated_price: number;
  product_id?: string | null;
}

export interface KitCartEntry {
  kit_id: string;
  name: string;
  price: number;
  quantity: number;
  school_id?: string | null;
  school_name?: string | null;
  grade_level?: string | null;
  category?: string | null;
  image_url?: string | null;
  composition: KitCompositionEntry[];
  added_at: string;
}

interface CartContextType {
  items: CartItem[];
  kits: KitCartEntry[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  addKit: (kit: Omit<KitCartEntry, 'added_at' | 'quantity'> & { quantity?: number }) => void;
  removeKit: (kitId: string) => void;
  updateKitQuantity: (kitId: string, quantity: number) => void;
  clearKits: () => void;
  clearCart: () => Promise<void>;
  itemCount: number;
  total: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [kits, setKits] = useState<KitCartEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const getGuestCart = (): GuestCartItem[] => {
    try {
      const saved = localStorage.getItem(LOCAL_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveGuestCart = (cart: GuestCartItem[]) => {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
  };

  const clearGuestCart = () => {
    localStorage.removeItem(LOCAL_CART_KEY);
  };

  // ---------- Kits (localStorage-only, product-catalog independent) ----------
  const loadKits = (): KitCartEntry[] => {
    try {
      const raw = localStorage.getItem(KITS_CART_KEY);
      return raw ? (JSON.parse(raw) as KitCartEntry[]) : [];
    } catch {
      return [];
    }
  };

  const persistKits = (next: KitCartEntry[]) => {
    localStorage.setItem(KITS_CART_KEY, JSON.stringify(next));
    setKits(next);
  };

  const addKit: CartContextType['addKit'] = (kit) => {
    const current = loadKits();
    const idx = current.findIndex((k) => k.kit_id === kit.kit_id);
    if (idx >= 0) {
      current[idx] = {
        ...current[idx],
        quantity: current[idx].quantity + (kit.quantity ?? 1),
        price: kit.price,
        composition: kit.composition,
      };
    } else {
      current.push({
        ...kit,
        quantity: kit.quantity ?? 1,
        added_at: new Date().toISOString(),
      });
    }
    persistKits(current);
    toast({
      title: 'Kit ajouté au panier',
      description: `${kit.name} — ${new Intl.NumberFormat('fr-FR').format(Math.round(kit.price))} FCFA`,
    });
  };

  const removeKit: CartContextType['removeKit'] = (kitId) => {
    persistKits(loadKits().filter((k) => k.kit_id !== kitId));
  };

  const updateKitQuantity: CartContextType['updateKitQuantity'] = (kitId, quantity) => {
    if (quantity < 1) return removeKit(kitId);
    const next = loadKits().map((k) => (k.kit_id === kitId ? { ...k, quantity } : k));
    persistKits(next);
  };

  const clearKits = () => {
    localStorage.removeItem(KITS_CART_KEY);
    setKits([]);
  };

  const fetchGuestCartWithProducts = async () => {
    const guestCart = getGuestCart();
    if (guestCart.length === 0) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const productIds = guestCart.map(item => item.product_id);
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name_fr, name_en, name_de, name_es, price, original_price, image_url, stock')
        .in('id', productIds);

      if (error) throw error;

      const cartWithProducts: CartItem[] = guestCart.map((item, index) => ({
        id: `guest_${index}_${item.product_id}`,
        product_id: item.product_id,
        quantity: item.quantity,
        product: products?.find(p => p.id === item.product_id)
      })).filter(item => item.product);

      setItems(cartWithProducts);
    } catch (error) {
      console.error('Error fetching guest cart products:', error);
    } finally {
      setLoading(false);
    }
  };

  const migrateGuestCartToUser = async () => {
    if (!user) return;
    const guestCart = getGuestCart();
    if (guestCart.length === 0) return;
    try {
      for (const item of guestCart) {
        const { data: existing } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', user.id)
          .eq('product_id', item.product_id)
          .single();

        if (existing) {
          await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + item.quantity })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              product_id: item.product_id,
              quantity: item.quantity
            });
        }
      }
      clearGuestCart();
    } catch (error) {
      console.error('Error migrating guest cart:', error);
    }
  };

  const fetchCart = async () => {
    if (!user) {
      await fetchGuestCartWithProducts();
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          products (
            id,
            name_fr,
            name_en,
            name_de,
            name_es,
            price,
            original_price,
            image_url,
            stock
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formattedItems = (data || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.products as CartItem['product'],
      }));

      setItems(formattedItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setKits(loadKits());
    if (user) {
      migrateGuestCartToUser().then(() => fetchCart());
    } else {
      fetchCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) {
      const guestCart = getGuestCart();
      const existingIndex = guestCart.findIndex(item => item.product_id === productId);
      if (existingIndex >= 0) {
        guestCart[existingIndex].quantity += quantity;
      } else {
        guestCart.push({ product_id: productId, quantity });
      }
      saveGuestCart(guestCart);
      await fetchGuestCartWithProducts();
      toast({ title: 'Ajouté au panier', description: 'Le produit a été ajouté à votre panier.' });
      return;
    }

    try {
      const existingItem = items.find(item => item.product_id === productId);
      if (existingItem) {
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({ user_id: user.id, product_id: productId, quantity });
        if (error) throw error;
        toast({ title: 'Ajouté au panier', description: 'Le produit a été ajouté à votre panier.' });
        await fetchCart();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'ajouter le produit au panier.",
        variant: 'destructive',
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) {
      const guestCart = getGuestCart();
      const productId = itemId.split('_').slice(2).join('_');
      const updatedCart = guestCart.filter(item => item.product_id !== productId);
      saveGuestCart(updatedCart);
      await fetchGuestCartWithProducts();
      toast({ title: 'Produit retiré', description: 'Le produit a été retiré de votre panier.' });
      return;
    }
    try {
      const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
      if (error) throw error;
      setItems(prev => prev.filter(item => item.id !== itemId));
      toast({ title: 'Produit retiré', description: 'Le produit a été retiré de votre panier.' });
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(itemId);
      return;
    }
    if (!user) {
      const guestCart = getGuestCart();
      const productId = itemId.split('_').slice(2).join('_');
      const itemIndex = guestCart.findIndex(item => item.product_id === productId);
      if (itemIndex >= 0) {
        guestCart[itemIndex].quantity = quantity;
        saveGuestCart(guestCart);
        await fetchGuestCartWithProducts();
      }
      return;
    }
    try {
      const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
      if (error) throw error;
      setItems(prev => prev.map(item => (item.id === itemId ? { ...item, quantity } : item)));
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const clearCart = async () => {
    clearKits();
    if (!user) {
      clearGuestCart();
      setItems([]);
      return;
    }
    try {
      const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id);
      if (error) throw error;
      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const productsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const kitsCount = kits.reduce((sum, k) => sum + k.quantity, 0);
  const itemCount = productsCount + kitsCount;

  const productsTotal = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const kitsTotal = kits.reduce((sum, k) => sum + k.price * k.quantity, 0);
  const total = productsTotal + kitsTotal;

  return (
    <CartContext.Provider value={{
      items,
      kits,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      addKit,
      removeKit,
      updateKitQuantity,
      clearKits,
      clearCart,
      itemCount,
      total,
      refreshCart: fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
