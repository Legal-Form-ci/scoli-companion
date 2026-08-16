import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useWishlist = () => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) fetchWishlistIds();
    else setWishlistIds(new Set());
  }, [user]);

  const fetchWishlistIds = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', user.id);
    
    setWishlistIds(new Set((data || []).map(w => w.product_id)));
  };

  const toggleWishlist = useCallback(async (productId: string) => {
    if (!user) {
      toast.error("Connectez-vous pour ajouter aux favoris");
      return;
    }

    const isInWishlist = wishlistIds.has(productId);
    
    if (isInWishlist) {
      await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', productId);
      setWishlistIds(prev => { const next = new Set(prev); next.delete(productId); return next; });
      toast.success("Retiré de la liste de souhaits");
    } else {
      await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId });
      setWishlistIds(prev => new Set(prev).add(productId));
      toast.success("Ajouté à la liste de souhaits");
    }
  }, [user, wishlistIds]);

  const isInWishlist = useCallback((productId: string) => wishlistIds.has(productId), [wishlistIds]);

  return { toggleWishlist, isInWishlist, wishlistCount: wishlistIds.size };
};