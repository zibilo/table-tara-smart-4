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
  name: string;
  emoji: string;
  count: number;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
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
      const { data, error } = await supabase
        .from("dishes")
        .select("category");

      if (error) throw error;

      // Count dishes by category and extract unique categories
      const categoryMap: { [key: string]: { count: number } } = {};
      data.forEach((dish) => {
        const cat = dish.category;
        if (!categoryMap[cat]) {
          categoryMap[cat] = { count: 0 };
        }
        categoryMap[cat].count++;
      });

      // Parse category names to extract emoji and name
      const categoryStats: CategoryData[] = Object.entries(categoryMap).map(
        ([fullCategory, stats]) => {
          // Extract emoji (usually at the start)
          const emojiMatch = fullCategory.match(/^([\u{1F300}-\u{1F9FF}])/u);
          const emoji = emojiMatch ? emojiMatch[1] : "";
          const name = emoji ? fullCategory.replace(emoji, "").trim() : fullCategory;
          
          return {
            name,
            emoji,
            count: stats.count,
          };
        }
      );

      setCategories(categoryStats);
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
      const newCategoryName = getCategoryFullName(formData.name.trim(), formData.emoji.trim());

      if (editingCategory) {
        // Update existing category - rename all dishes with this category
        const oldCategoryName = getCategoryFullName(editingCategory.name, editingCategory.emoji);
        
        const { error } = await supabase
          .from("dishes")
          .update({ category: newCategoryName })
          .eq("category", oldCategoryName);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Catégorie mise à jour avec succès",
        });
      } else {
        // Check if category already exists
        const existingCategory = categories.find(
          (cat) => getCategoryFullName(cat.name, cat.emoji).toLowerCase() === newCategoryName.toLowerCase()
        );

        if (existingCategory) {
          toast({
            title: "Erreur",
            description: "Cette catégorie existe déjà",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Succès",
          description: `Catégorie "${newCategoryName}" créée. Ajoutez des plats à cette catégorie dans la section "Gestion des Plats".`,
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
      emoji: category.emoji,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (category: CategoryData) => {
    const fullName = getCategoryFullName(category.name, category.emoji);
    setCategoryToDelete(fullName);
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      // Check if category has dishes
      const categoryWithCount = categories.find(
        (cat) => getCategoryFullName(cat.name, cat.emoji) === categoryToDelete
      );

      if (categoryWithCount && categoryWithCount.count > 0) {
        toast({
          title: "Impossible de supprimer",
          description: `Cette catégorie contient ${categoryWithCount.count} plat(s). Supprimez ou déplacez ces plats avant de supprimer la catégorie.`,
          variant: "destructive",
        });
        setIsConfirmOpen(false);
        setCategoryToDelete(null);
        return;
      }

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

  const popularEmojis = ["🍔", "🍕", "🥤", "🍰", "🍜", "🍗", "🥗", "🍱", "🌮", "🍣"];

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
                            {popularEmojis.map((emoji) => (
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
                    {categories.map((category) => {
                      const fullName = getCategoryFullName(category.name, category.emoji);
                      return (
                        <TableRow key={fullName}>
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
                              {category.count} plat{category.count > 1 ? "s" : ""}
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
                                disabled={category.count > 0}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
          description={`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryToDelete}" ? Cette action est irréversible.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;