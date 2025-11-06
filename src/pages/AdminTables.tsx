import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Pencil, Trash2, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/AdminLayout";

interface TableData {
  id: string;
  table_number: number;
  qr_code_data: string;
  restaurant_id: string;
  is_active: boolean;
  created_at: string;
}

const AdminTables = () => {
  const [tables, setTables] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<{ id: string; number: number } | null>(null);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  const [formData, setFormData] = useState({
    table_number: "",
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .order("table_number", { ascending: true });

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les tables",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.table_number) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un numéro de table",
        variant: "destructive",
      });
      return;
    }

    try {
      const tableNumber = parseInt(formData.table_number);
      const qrCodeData = `table-${tableNumber}-${Date.now()}`;

      if (editingTable) {
        // Update existing table
        const { error } = await supabase
          .from("tables")
          .update({
            table_number: tableNumber,
            is_active: formData.is_active,
          })
          .eq("id", editingTable.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Table mise à jour avec succès",
        });
      } else {
        // Get or create restaurant (with better error handling)
        let restaurantId: string;
        
        try {
          const { data: restaurant, error: fetchError } = await supabase
            .from("restaurants")
            .select("id")
            .limit(1)
            .maybeSingle();

          if (fetchError) {
            console.error("Error fetching restaurant:", fetchError);
          }

          if (restaurant) {
            restaurantId = restaurant.id;
          } else {
            // Create restaurant without authentication check
            const { data: newRestaurant, error: insertError } = await supabase
              .from("restaurants")
              .insert({
                name: "Mon Restaurant",
                address: "Adresse du restaurant",
                email_admin: "admin@restaurant.com"
              })
              .select("id")
              .single();

            if (insertError) {
              console.error("Error creating restaurant:", insertError);
              // If creation fails, try to get any existing restaurant again
              const { data: existingRestaurant } = await supabase
                .from("restaurants")
                .select("id")
                .limit(1)
                .maybeSingle();
              
              if (existingRestaurant) {
                restaurantId = existingRestaurant.id;
              } else {
                throw new Error("Impossible de créer ou récupérer le restaurant. Veuillez contacter l'administrateur.");
              }
            } else {
              restaurantId = newRestaurant.id;
            }
          }
        } catch (error) {
          console.error("Restaurant initialization error:", error);
          throw new Error("Erreur lors de l'initialisation du restaurant");
        }

        // Create new table
        const { error } = await supabase.from("tables").insert({
          table_number: tableNumber,
          qr_code_data: qrCodeData,
          restaurant_id: restaurantId,
          is_active: formData.is_active,
        });

        if (error) throw error;

        toast({
          title: "Succès",
          description: `Table ${tableNumber} ajoutée avec succès`,
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTables();
    } catch (error: any) {
      console.error("Error saving table:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de la table",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (table: TableData) => {
    setEditingTable(table);
    setFormData({
      table_number: table.table_number.toString(),
      is_active: table.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string, tableNumber: number) => {
    setTableToDelete({ id, number: tableNumber });
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tableToDelete) return;

    try {
      const { error } = await supabase.from("tables").delete().eq("id", tableToDelete.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Table supprimée avec succès",
      });
      fetchTables();
    } catch (error) {
      console.error("Error deleting table:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la table",
        variant: "destructive",
      });
    } finally {
      setIsConfirmOpen(false);
      setTableToDelete(null);
    }
  };

  const handleToggleActive = async (table: TableData) => {
    try {
      const { error } = await supabase
        .from("tables")
        .update({ is_active: !table.is_active })
        .eq("id", table.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Table ${table.table_number} ${!table.is_active ? "activée" : "désactivée"}`,
      });
      fetchTables();
    } catch (error) {
      console.error("Error toggling table status:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingTable(null);
    setFormData({
      table_number: "",
      is_active: true,
    });
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Gestion des Tables</CardTitle>
                  <CardDescription>
                    Gérez les numéros de table de votre restaurant
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une table
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleSubmit}>
                      <DialogHeader>
                        <DialogTitle>
                          {editingTable ? "Modifier la table" : "Ajouter une nouvelle table"}
                        </DialogTitle>
                        <DialogDescription>
                          Remplissez les informations de la table
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="table_number">Numéro de table *</Label>
                          <Input
                            id="table_number"
                            type="number"
                            placeholder="Ex: 5"
                            value={formData.table_number}
                            onChange={(e) =>
                              setFormData({ ...formData, table_number: e.target.value })
                            }
                            min="1"
                            required
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="is_active">Table active</Label>
                            <p className="text-sm text-muted-foreground">
                              Les clients peuvent commander depuis cette table
                            </p>
                          </div>
                          <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, is_active: checked })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleDialogClose(false)}
                        >
                          Annuler
                        </Button>
                        <Button type="submit">
                          {editingTable ? "Mettre à jour" : "Ajouter"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : tables.length === 0 ? (
                <div className="text-center py-12">
                  <QrCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground">
                    Aucune table créée. Cliquez sur "Ajouter une table" pour commencer.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Code QR</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date de création</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tables.map((table) => (
                      <TableRow key={table.id}>
                        <TableCell className="font-medium">
                          Table {table.table_number}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {table.qr_code_data}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={table.is_active}
                            onCheckedChange={() => handleToggleActive(table)}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(table.created_at).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(table)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(table.id, table.table_number)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <ConfirmDialog
          open={isConfirmOpen}
          onOpenChange={setIsConfirmOpen}
          onConfirm={handleDeleteConfirm}
          title="Supprimer la table"
          description={`Êtes-vous sûr de vouloir supprimer la table ${tableToDelete?.number} ? Cette action est irréversible.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminTables;