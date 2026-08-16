import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Truck, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** Dashboard commercial : commandes filtrées strictement sur ses zones assignées. */
const CommercialDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState<{ id: string; name: string }[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: zoneRows } = await supabase
        .from("commercial_zones")
        .select("zone_id, zones(id, name)")
        .eq("user_id", user.id);

      const myZones = (zoneRows || [])
        .map((r: any) => r.zones)
        .filter(Boolean) as { id: string; name: string }[];
      setZones(myZones);

      if (myZones.length > 0) {
        const { data } = await supabase
          .from("orders")
          .select("id, total_amount, status, created_at, shipping_address, phone, zone_id")
          .in("zone_id", myZones.map((z) => z.id))
          .order("created_at", { ascending: false })
          .limit(100);
        setOrders(data || []);
      } else {
        setOrders([]);
      }
      setLoading(false);
    })();
  }, [user]);

  const count = (s: string) => orders.filter((o) => o.status === s).length;
  const revenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Chargement…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Zones assignées", value: zones.length, icon: MapPin },
          { label: "Commandes en attente", value: count("pending"), icon: Package },
          { label: "En livraison", value: count("shipped"), icon: Truck },
          { label: "Livrées", value: count("delivered"), icon: CheckCircle2 },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <kpi.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Chiffre livré sur mes zones : {revenue.toLocaleString("fr-FR")} FCFA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {zones.map((z) => (
              <Badge key={z.id} variant="outline">{z.name}</Badge>
            ))}
            {zones.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucune zone ne vous est assignée. Contactez un administrateur.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commandes de mes zones</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-2 px-3">Commande</th>
                <th className="text-left py-2 px-3">Montant</th>
                <th className="text-left py-2 px-3">Statut</th>
                <th className="text-left py-2 px-3">Adresse</th>
                <th className="text-left py-2 px-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="py-2 px-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                  <td className="py-2 px-3">{Number(o.total_amount).toLocaleString("fr-FR")} FCFA</td>
                  <td className="py-2 px-3"><Badge variant="outline">{o.status}</Badge></td>
                  <td className="py-2 px-3 max-w-[240px] truncate">{o.shipping_address}</td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground">
                    Aucune commande sur vos zones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommercialDashboard;
