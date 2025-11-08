import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, UtensilsCrossed, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Dish {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  restaurant_id: string;
  created_at: string;
}

const CATEGORIES = [
  "Entrées",
  "Plats",
  "Desserts",
  "Boissons",
  "Accompagnements",
];

export default function DishTypeManager() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [dishToDelete, setDishToDelete] = useState<{ id: string; name: string } | null>(null);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    is_available: true,
    restaurant_id: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    await initializeRestaurant();
    await fetchDishes();
  };

  const initializeRestaurant = async () => {
    try {
      let { data: restaurant, error: fetchError } = await supabase
        .from("restaurants")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching restaurant:", fetchError);
        return;
      }

      if (!restaurant) {
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
          return;
        }

        restaurant = newRestaurant;
      }

      if (restaurant) {
        setFormData((prev) => ({ ...prev, restaurant_id: restaurant.id }));
      }
    } catch (error) {
      console.error("Error initializing restaurant:", error);
    }
  };

  const fetchDishes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setDishes(data || []);
    } catch (error) {
      console.error("Error fetching dishes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les plats",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (!formData.restaurant_id) {
      toast({
        title: "Erreur",
        description: "Restaurant non initialisé. Veuillez actualiser la page.",
        variant: "destructive",
      });
      return;
    }

    try {
      const price = parseFloat(formData.price);

      if (editingDish) {
        const { error } = await supabase
          .from("dishes")
          .update({
            name: formData.name,
            description: formData.description || null,
            price: price,
            category: formData.category,
            image_url: formData.image_url || null,
            is_available: formData.is_available,
          })
          .eq("id", editingDish.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Plat mis à jour avec succès",
        });
      } else {
        const { error } = await supabase.from("dishes").insert({
          name: formData.name,
          description: formData.description || null,
          price: price,
          category: formData.category,
          image_url: formData.image_url || null,
          is_available: formData.is_available,
          restaurant_id: formData.restaurant_id,
        });

        if (error) throw error;

        toast({
          title: "Succès",
          description: `${formData.name} ajouté avec succès`,
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchDishes();
    } catch (error: any) {
      console.error("Error saving dish:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish);
    setFormData({
      name: dish.name,
      description: dish.description || "",
      price: dish.price.toString(),
      category: dish.category,
      image_url: dish.image_url || "",
      is_available: dish.is_available,
      restaurant_id: dish.restaurant_id,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDishToDelete({ id, name });
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!dishToDelete) return;

    try {
      const { error } = await supabase.from("dishes").delete().eq("id", dishToDelete.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Plat supprimé avec succès",
      });
      fetchDishes();
    } catch (error) {
      console.error("Error deleting dish:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le plat",
        variant: "destructive",
      });
    } finally {
      setIsConfirmOpen(false);
      setDishToDelete(null);
    }
  };

  const handleToggleAvailable = async (dish: Dish) => {
    try {
      const { error } = await supabase
        .from("dishes")
        .update({ is_available: !dish.is_available })
        .eq("id", dish.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `${dish.name} ${!dish.is_available ? "activé" : "désactivé"}`,
      });
      fetchDishes();
    } catch (error) {
      console.error("Error toggling dish availability:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingDish(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      image_url: "",
      is_available: true,
      restaurant_id: formData.restaurant_id,
    });
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Gestion des Types de Plat</CardTitle>
              <CardDescription>
                Ajoutez, modifiez et gérez les plats de votre menu
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un plat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingDish ? "Modifier le plat" : "Ajouter un nouveau plat"}
                    </DialogTitle>
                    <DialogDescription>
                      Remplissez les informations du plat
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom du plat *</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Hamburger Classique"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Décrivez le plat..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Prix (XAF) *</Label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="Ex: 5000"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({ ...formData, price: e.target.value })
                          }
                          min="0"
                          step="1"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Catégorie *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            setFormData({ ...formData, category: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat.toLowerCase()}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image_url">URL de l'image</Label>
                      <Input
                        id="image_url"
                        type="url"
                        placeholder="https://exemple.com/image.jpg"
                        value={formData.image_url}
                        onChange={(e) =>
                          setFormData({ ...formData, image_url: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="is_available">Plat disponible</Label>
                        <p className="text-sm text-muted-foreground">
                          Les clients peuvent commander ce plat
                        </p>
                      </div>
                      <Switch
                        id="is_available"
                        checked={formData.is_available}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_available: checked })
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
                      {editingDish ? "Mettre à jour" : "Ajouter"}
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
          ) : dishes.length === 0 ? (
            <div className="text-center py-12">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">
                Aucun plat créé. Cliquez sur "Ajouter un plat" pour commencer.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dishes.map((dish) => (
                  <TableRow key={dish.id}>
                    <TableCell className="font-medium">{dish.name}</TableCell>
                    <TableCell className="capitalize">{dish.category}</TableCell>
                    <TableCell>{dish.price.toFixed(0)} XAF</TableCell>
                    <TableCell>
                      <Switch
                        checked={dish.is_available}
                        onCheckedChange={() => handleToggleAvailable(dish)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(dish)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(dish.id, dish.name)}
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

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le plat"
        description={`Êtes-vous sûr de vouloir supprimer "${dishToDelete?.name}" ? Cette action est irréversible.`}
      />
    </>
  );
}
