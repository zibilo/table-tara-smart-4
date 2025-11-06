import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CategoryData {
  id: string;
  name: string;
  emoji: string;
  display_order: number;
  created_at: string;
  dish_count?: number;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    emoji: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const { data: categoriesData, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;

      // Count dishes for each category
      const categoriesWithCount = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count } = await supabase
            .from("dishes")
            .select("*", { count: "exact", head: true })
            .eq("category", getCategoryFullName(category.name, category.emoji || ""));

          return {
            ...category,
            dish_count: count || 0,
          };
        })
      );

      setCategories(categoriesWithCount);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les catégories",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryFullName = (name: string, emoji: string) => {
    return emoji ? `${emoji} ${name}` : name;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un nom de catégorie",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from("categories")
          .update({
            name: formData.name.trim(),
            emoji: formData.emoji.trim(),
          })
          .eq("id", editingCategory.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Catégorie mise à jour avec succès",
        });
      } else {
        // Create new category
        const { error } = await supabase
          .from("categories")
          .insert({
            name: formData.name.trim(),
            emoji: formData.emoji.trim(),
            display_order: categories.length,
          });

        if (error) {
          if (error.code === "23505") {
            toast({
              title: "Erreur",
              description: "Cette catégorie existe déjà",
              variant: "destructive",
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Succès",
          description: `Catégorie "${getCategoryFullName(formData.name.trim(), formData.emoji.trim())}" créée avec succès`,
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (category: CategoryData) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      emoji: category.emoji || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (category: CategoryData) => {
    setCategoryToDelete({ id: category.id, name: getCategoryFullName(category.name, category.emoji || "") });
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      // Check if category is used by any dishes
      const { data: dishes, error: dishError } = await supabase
        .from("dishes")
        .select("id")
        .eq("category", categoryToDelete.name)
        .limit(1);

      if (dishError) throw dishError;

      if (dishes && dishes.length > 0) {
        toast({
          title: "Impossible de supprimer",
          description: "Cette catégorie est utilisée par des plats. Supprimez ou déplacez ces plats avant de supprimer la catégorie.",
          variant: "destructive",
        });
        setIsConfirmOpen(false);
        setCategoryToDelete(null);
        return;
      }

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryToDelete.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Catégorie supprimée avec succès",
      });
      
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la catégorie",
        variant: "destructive",
      });
    } finally {
      setIsConfirmOpen(false);
      setCategoryToDelete(null);
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      emoji: "",
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
                  <CardTitle className="text-2xl">Gestion des Catégories</CardTitle>
                  <CardDescription>
                    Gérez les catégories de votre menu
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une catégorie
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleSubmit}>
                      <DialogHeader>
                        <DialogTitle>
                          {editingCategory ? "Modifier la catégorie" : "Ajouter une nouvelle catégorie"}
                        </DialogTitle>
                        <DialogDescription>
                          Créez une nouvelle catégorie pour organiser vos plats
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nom de la catégorie *</Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="Ex: Hamburgers"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emoji">Emoji (optionnel)</Label>
                          <Input
                            id="emoji"
                            type="text"
                            placeholder="Ex: 🍔"
                            value={formData.emoji}
                            onChange={(e) =>
                              setFormData({ ...formData, emoji: e.target.value })
                            }
                            maxLength={2}
                          />
                          <div className="flex flex-wrap gap-2 mt-2">
                            {["🍔", "🍕", "🥤", "🍰", "🍜", "🍗", "🥗", "🍱", "🌮", "🍣"].map((emoji) => (
                              <Button
                                key={emoji}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setFormData({ ...formData, emoji })}
                                className="text-xl"
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        </div>
                        {formData.name && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Aperçu:</p>
                            <p className="text-lg font-semibold">
                              {getCategoryFullName(formData.name, formData.emoji)}
                            </p>
                          </div>
                        )}
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
                          {editingCategory ? "Mettre à jour" : "Ajouter"}
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
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <Tags className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground mb-4">
                    Aucune catégorie trouvée. Cliquez sur "Ajouter une catégorie" pour commencer.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Nombre de plats</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {category.emoji && (
                              <span className="text-2xl">{category.emoji}</span>
                            )}
                            <span className="text-lg">{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {category.dish_count || 0} plat{(category.dish_count || 0) > 1 ? "s" : ""}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(category)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(category)}
                              disabled={(category.dish_count || 0) > 0}
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
          title="Supprimer la catégorie"
          description={`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryToDelete?.name}" ? Cette action est irréversible.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;