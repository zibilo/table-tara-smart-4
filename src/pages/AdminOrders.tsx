import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListOrdered, Eye, CheckCircle, Clock, ChefHat, XCircle, Sparkles, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  dish_id: string;
  dish_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  comment: string | null;
  customizations: string | null;
}

interface Order {
  id: string;
  table_number: string;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

interface Customization {
  optionGroupId: number;
  optionGroupName: string;
  optionId: number;
  optionName: string;
  extraPrice: number;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription for orders
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      // Fetch orders with table info
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          total,
          status,
          created_at,
          tables!inner(table_number)
        `)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch order items with dish info for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order: any) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from("order_items")
            .select(`
              id,
              dish_id,
              quantity,
              unit_price,
              subtotal,
              comment,
              customizations,
              dishes!inner(name)
            `)
            .eq("order_id", order.id);

          if (itemsError) throw itemsError;

          return {
            id: order.id,
            table_number: order.tables.table_number,
            total: order.total,
            status: order.status,
            created_at: order.created_at,
            items: (itemsData || []).map((item: any) => ({
              id: item.id,
              dish_id: item.dish_id,
              dish_name: item.dishes.name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
              comment: item.comment,
              customizations: item.customizations,
            })),
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commandes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `Commande marquée comme "${getStatusLabel(newStatus)}"`,
      });

      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      received: "Reçue",
      preparing: "En préparation",
      ready: "Prête",
      served: "Servie",
      cancelled: "Annulée",
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      received: "outline",
      preparing: "default",
      ready: "secondary",
      served: "default",
      cancelled: "destructive",
    };
    return variants[status] || "outline";
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      received: Clock,
      preparing: ChefHat,
      ready: CheckCircle,
      served: CheckCircle,
      cancelled: XCircle,
    };
    const Icon = icons[status] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const parseCustomizations = (customizationsJson: string | null): Customization[] => {
    if (!customizationsJson) return [];
    try {
      return JSON.parse(customizationsJson);
    } catch {
      return [];
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    return order.status === activeTab;
  });

  const getOrderCount = (status: string) => {
    if (status === "all") return orders.length;
    return orders.filter((o) => o.status === status).length;
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <ListOrdered className="h-6 w-6" />
                    Gestion des Commandes
                  </CardTitle>
                  <CardDescription>
                    Consultez et gérez les commandes avec personnalisations
                  </CardDescription>
                </div>
                <Button onClick={fetchOrders} variant="outline" size="sm">
                  🔄 Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6 mb-6">
                  <TabsTrigger value="all" className="relative">
                    Toutes
                    {getOrderCount("all") > 0 && (
                      <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {getOrderCount("all")}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="received" className="relative">
                    Reçues
                    {getOrderCount("received") > 0 && (
                      <Badge variant="outline" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {getOrderCount("received")}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="preparing" className="relative">
                    En cours
                    {getOrderCount("preparing") > 0 && (
                      <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {getOrderCount("preparing")}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="ready" className="relative">
                    Prêtes
                    {getOrderCount("ready") > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {getOrderCount("ready")}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="served">
                    Servies
                  </TabsTrigger>
                  <TabsTrigger value="cancelled">
                    Annulées
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  {isLoading ? (
                    <div className="text-center py-12">
                      <ChefHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-bounce" />
                      <p className="text-muted-foreground">Chargement des commandes...</p>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <ListOrdered className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                      <p className="text-muted-foreground">
                        {activeTab === "all"
                          ? "Aucune commande pour le moment."
                          : `Aucune commande "${getStatusLabel(activeTab)}".`}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>N° Commande</TableHead>
                            <TableHead>Table</TableHead>
                            <TableHead>Heure</TableHead>
                            <TableHead>Articles</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono text-xs">
                                {order.id.slice(0, 8).toUpperCase()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">Table {order.table_number}</Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(order.created_at).toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  {order.items.slice(0, 2).map((item) => (
                                    <div key={item.id} className="text-sm">
                                      {item.quantity}x {item.dish_name}
                                      {parseCustomizations(item.customizations).length > 0 && (
                                        <Sparkles className="inline h-3 w-3 ml-1 text-purple-500" />
                                      )}
                                    </div>
                                  ))}
                                  {order.items.length > 2 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{order.items.length - 2} autre(s)
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-bold">
                                {order.total.toFixed(0)} XAF
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusVariant(order.status)} className="gap-1">
                                  {getStatusIcon(order.status)}
                                  {getStatusLabel(order.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(order)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Détails
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Order Details Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedOrder && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    <ListOrdered className="h-6 w-6" />
                    Commande #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-4">
                    <span>Table {selectedOrder.table_number}</span>
                    <span>•</span>
                    <span>
                      {new Date(selectedOrder.created_at).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Status Management */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Gestion du statut</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={selectedOrder.status === "received" ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateOrderStatus(selectedOrder.id, "received")}
                          disabled={selectedOrder.status === "received"}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Reçue
                        </Button>
                        <Button
                          variant={selectedOrder.status === "preparing" ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateOrderStatus(selectedOrder.id, "preparing")}
                          disabled={selectedOrder.status === "preparing"}
                        >
                          <ChefHat className="h-4 w-4 mr-2" />
                          En préparation
                        </Button>
                        <Button
                          variant={selectedOrder.status === "ready" ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => updateOrderStatus(selectedOrder.id, "ready")}
                          disabled={selectedOrder.status === "ready"}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Prête
                        </Button>
                        <Button
                          variant={selectedOrder.status === "served" ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateOrderStatus(selectedOrder.id, "served")}
                          disabled={selectedOrder.status === "served"}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Servie
                        </Button>
                        <Button
                          variant={selectedOrder.status === "cancelled" ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => updateOrderStatus(selectedOrder.id, "cancelled")}
                          disabled={selectedOrder.status === "cancelled"}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Annuler
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Items */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Articles commandés</h3>
                    {selectedOrder.items.map((item, index) => {
                      const customizations = parseCustomizations(item.customizations);
                      return (
                        <Card
                          key={item.id}
                          className="border-2 bg-gradient-to-br from-orange-50 to-yellow-50"
                        >
                          <CardContent className="p-4 space-y-3">
                            {/* Item Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-orange-500">#{index + 1}</Badge>
                                  <h4 className="font-bold text-lg">{item.dish_name}</h4>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                  <span>{item.unit_price.toFixed(0)} XAF</span>
                                  <span>×</span>
                                  <span className="font-bold text-base">{item.quantity}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-base px-3 py-1">
                                  {item.subtotal.toFixed(0)} XAF
                                </Badge>
                              </div>
                            </div>

                            {/* Customizations */}
                            {customizations.length > 0 && (
                              <div className="bg-white rounded-lg p-4 border-2 border-blue-300 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                  <Sparkles className="h-5 w-5 text-purple-500" />
                                  <h5 className="font-bold text-purple-700 uppercase text-sm">
                                    Personnalisations Client
                                  </h5>
                                </div>
                                <div className="space-y-2">
                                  {customizations.map((custom, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-purple-600">
                                          {custom.optionGroupName}:
                                        </span>
                                        <span className="text-sm text-gray-700">
                                          {custom.optionName}
                                        </span>
                                      </div>
                                      {custom.extraPrice > 0 && (
                                        <Badge
                                          variant="secondary"
                                          className="bg-yellow-200 text-yellow-800"
                                        >
                                          +{custom.extraPrice} XAF
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Special Notes */}
                            {item.comment && (
                              <div className="bg-purple-100 rounded-lg p-4 border-2 border-purple-300">
                                <div className="flex items-start gap-2">
                                  <MessageSquare className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
                                  <div className="flex-1">
                                    <h5 className="font-bold text-purple-700 text-sm mb-1">
                                      📝 Instructions spéciales:
                                    </h5>
                                    <p className="text-sm text-gray-800 italic leading-relaxed">
                                      "{item.comment}"
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Total */}
                  <Card className="border-2 bg-gradient-to-br from-green-50 to-blue-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between text-2xl font-bold">
                        <span>Total de la commande</span>
                        <span className="text-green-600">
                          {selectedOrder.total.toFixed(0)} XAF
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;