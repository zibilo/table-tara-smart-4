import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, ChefHat, Pencil, Trash2, Settings2, List, ArrowLeft, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  emoji: string | null;
  display_order: number;
}

interface Dish {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
}

interface CategoryOptionGroup {
  id: string;
  category: string;
  name: string;
  selection_type: "single" | "multiple";
  is_required: boolean;
  display_order: number;
  enable_description: boolean;
}

interface CategoryOption {
  id: string;
  option_group_id: string;
  name: string;
  extra_price: number;
  is_available: boolean;
  display_order: number;
}

const AdminCategoryOptions = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryDishes, setCategoryDishes] = useState<Dish[]>([]);
  const [optionGroups, setOptionGroups] = useState<CategoryOptionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "group" | "option"; id: string; name: string } | null>(null);
  const [editingGroup, setEditingGroup] = useState<CategoryOptionGroup | null>(null);
  const [selectedGroupForOptions, setSelectedGroupForOptions] = useState<CategoryOptionGroup | null>(null);
  const [groupOptions, setGroupOptions] = useState<CategoryOption[]>([]);
  const [editingOption, setEditingOption] = useState<CategoryOption | null>(null);

  const [groupFormData, setGroupFormData] = useState({
    name: "",
    selection_type: "single" as "single" | "multiple",
    is_required: false,
    display_order: 0,
    enable_description: false,
  });

  const [optionFormData, setOptionFormData] = useState({
    name: "",
    extra_price: "0",
    is_available: true,
    display_order: 0,
  });

  const { toast } = useToast();

  // Fetch categories from database
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchOptionGroups();
      fetchCategoryDishes();
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setCategories(data || []);
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

  const fetchCategoryDishes = async () => {
    if (!selectedCategory) return;

    try {
      const { data, error } = await supabase
        .from("dishes")
        .select("id, name, price, is_available")
        .ilike("category", selectedCategory)
        .order("name");

      if (error) throw error;
      setCategoryDishes(data || []);
    } catch (error) {
      console.error("Error fetching category dishes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les plats",
        variant: "destructive",
      });
    }
  };

  const fetchOptionGroups = async () => {
    if (!selectedCategory) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("category_option_groups")
        .select("*")
        .eq("category", selectedCategory)
        .order("display_order");

      if (error) throw error;
      setOptionGroups(data || []);
    } catch (error) {
      console.error("Error fetching option groups:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les groupes d'options",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupOptions = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from("category_options")
        .select("*")
        .eq("option_group_id", groupId)
        .order("display_order");

      if (error) throw error;
      setGroupOptions(data || []);
    } catch (error) {
      console.error("Error fetching options:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les options",
        variant: "destructive",
      });
    }
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupFormData.name || !selectedCategory) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingGroup) {
        const { error } = await supabase
          .from("category_option_groups")
          .update({
            name: groupFormData.name,
            selection_type: groupFormData.selection_type,
            is_required: groupFormData.is_required,
            display_order: groupFormData.display_order,
            enable_description: groupFormData.enable_description,
          })
          .eq("id", editingGroup.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Champ mis à jour",
        });
      } else {
        const { error } = await supabase
          .from("category_option_groups")
          .insert({
            category: selectedCategory,
            name: groupFormData.name,
            selection_type: groupFormData.selection_type,
            is_required: groupFormData.is_required,
            display_order: groupFormData.display_order,
            enable_description: groupFormData.enable_description,
          });

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Champ créé",
        });
      }

      setIsGroupDialogOpen(false);
      resetGroupForm();
      fetchOptionGroups();
    } catch (error: any) {
      console.error("Error saving option group:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!optionFormData.name || !selectedGroupForOptions) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const extraPrice = parseFloat(optionFormData.extra_price);

      if (editingOption) {
        const { error } = await supabase
          .from("category_options")
          .update({
            name: optionFormData.name,
            extra_price: extraPrice,
            is_available: optionFormData.is_available,
            display_order: optionFormData.display_order,
          })
          .eq("id", editingOption.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Option mise à jour",
        });
      } else {
        const { error } = await supabase
          .from("category_options")
          .insert({
            option_group_id: selectedGroupForOptions.id,
            name: optionFormData.name,
            extra_price: extraPrice,
            is_available: optionFormData.is_available,
            display_order: optionFormData.display_order,
          });

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Option ajoutée",
        });
      }

      setIsOptionDialogOpen(false);
      resetOptionForm();
      fetchGroupOptions(selectedGroupForOptions.id);
    } catch (error: any) {
      console.error("Error saving option:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleEditGroup = (group: CategoryOptionGroup) => {
    setEditingGroup(group);
    setGroupFormData({
      name: group.name,
      selection_type: group.selection_type,
      is_required: group.is_required,
      display_order: group.display_order,
      enable_description: group.enable_description || false,
    });
    setIsGroupDialogOpen(true);
  };

  const handleEditOption = (option: CategoryOption) => {
    setEditingOption(option);
    setOptionFormData({
      name: option.name,
      extra_price: option.extra_price.toString(),
      is_available: option.is_available,
      display_order: option.display_order,
    });
    setIsOptionDialogOpen(true);
  };

  const handleDeleteClick = (type: "group" | "option", id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "group") {
        const { error } = await supabase
          .from("category_option_groups")
          .delete()
          .eq("id", deleteTarget.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Champ supprimé",
        });
        fetchOptionGroups();
      } else {
        const { error } = await supabase
          .from("category_options")
          .delete()
          .eq("id", deleteTarget.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Option supprimée",
        });
        if (selectedGroupForOptions) {
          fetchGroupOptions(selectedGroupForOptions.id);
        }
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer",
        variant: "destructive",
      });
    } finally {
      setIsConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleManageOptions = async (group: CategoryOptionGroup) => {
    setSelectedGroupForOptions(group);
    await fetchGroupOptions(group.id);
  };

  const resetGroupForm = () => {
    setEditingGroup(null);
    setGroupFormData({
      name: "",
      selection_type: "single",
      is_required: false,
      display_order: optionGroups.length,
      enable_description: false,
    });
  };

  const resetOptionForm = () => {
    setEditingOption(null);
    setOptionFormData({
      name: "",
      extra_price: "0",
      is_available: true,
      display_order: groupOptions.length,
    });
  };

  const handleGroupDialogClose = (open: boolean) => {
    setIsGroupDialogOpen(open);
    if (!open) resetGroupForm();
  };

  const handleOptionDialogClose = (open: boolean) => {
    setIsOptionDialogOpen(open);
    if (!open) resetOptionForm();
  };

  const selectedCategoryData = categories.find((c) => c.name === selectedCategory);

  // Generate color class based on category name
  const getCategoryColor = (name: string) => {
    const colors = [
      "bg-orange-500",
      "bg-red-500", 
      "bg-blue-500",
      "bg-pink-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-yellow-500",
      "bg-indigo-500",
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Category Selection */}
          {!selectedCategory ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">✅ Gestion des Options par Catégorie</CardTitle>
                <CardDescription>
                  Cliquez sur une catégorie pour gérer les options de personnalisation associées
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chargement des catégories...
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-12">
                    <ChefHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground mb-4">
                      Aucune catégorie disponible. Veuillez d'abord créer des catégories.
                    </p>
                    <Button onClick={() => window.location.href = "/admin/categories"}>
                      Aller aux Catégories
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((category) => (
                      <Card
                        key={category.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                        onClick={() => setSelectedCategory(category.name)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4">
                            <div className={`w-16 h-16 ${getCategoryColor(category.name)} rounded-lg flex items-center justify-center text-4xl`}>
                              {category.emoji || "📦"}
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold">{category.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                Cliquez pour configurer les options
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Category Detail View */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedCategory(null);
                          setSelectedGroupForOptions(null);
                          setCategoryDishes([]);
                        }}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                          <span className="text-3xl">{selectedCategoryData?.emoji || "📦"}</span>
                          Catégorie : {selectedCategoryData?.name}
                        </CardTitle>
                        <CardDescription>
                          Gérez les options de personnalisation pour cette catégorie
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Dishes in Category Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5" />
                    Plats dans cette catégorie
                  </CardTitle>
                  <CardDescription>
                    Liste des plats qui utiliseront ces options de personnalisation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryDishes.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        Aucun plat dans cette catégorie
                      </p>
                      <Button onClick={() => window.location.href = "/admin/dishes"} variant="outline">
                        Ajouter des plats
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {categoryDishes.map((dish) => (
                        <Card key={dish.id} className="border-2">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{dish.name}</h4>
                                <p className="text-sm text-primary font-bold mt-1">
                                  {dish.price.toFixed(0)} XAF
                                </p>
                              </div>
                              <Badge variant={dish.is_available ? "default" : "secondary"}>
                                {dish.is_available ? "Disponible" : "Indisponible"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Option Groups Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Champs de Personnalisation</CardTitle>
                      <CardDescription>
                        Créez des champs avec des options à cocher pour permettre aux clients de personnaliser leurs plats
                      </CardDescription>
                    </div>
                    <Button onClick={() => setIsGroupDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un champ
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Chargement...
                    </div>
                  ) : optionGroups.length === 0 ? (
                    <div className="text-center py-12">
                      <Settings2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                      <p className="text-muted-foreground">
                        Aucun champ de personnalisation. Cliquez sur "Ajouter un champ" pour commencer.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom du Champ</TableHead>
                          <TableHead>Type de Sélection</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Options</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {optionGroups.map((group) => (
                          <TableRow key={group.id}>
                            <TableCell className="font-medium">{group.name}</TableCell>
                            <TableCell>
                              <Badge variant={group.selection_type === "single" ? "default" : "secondary"}>
                                {group.selection_type === "single" ? "☑ Unique" : "☑☑ Multiple"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={group.is_required ? "destructive" : "outline"}>
                                {group.is_required ? "Obligatoire" : "Optionnel"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleManageOptions(group)}
                              >
                                <List className="w-4 h-4 mr-2" />
                                Gérer les cases à cocher
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditGroup(group)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick("group", group.id, group.name)}
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

              {/* Options Management Card */}
              {selectedGroupForOptions && (
                <Card className="border-4 border-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>📋 Options pour : {selectedGroupForOptions.name}</CardTitle>
                        <CardDescription>
                          Type : {selectedGroupForOptions.selection_type === "single" ? "Sélection Unique" : "Sélection Multiple"} • 
                          {selectedGroupForOptions.is_required ? " Obligatoire" : " Optionnel"}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setSelectedGroupForOptions(null)}>
                          Fermer
                        </Button>
                        <Button onClick={() => setIsOptionDialogOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter une case à cocher
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {groupOptions.length === 0 ? (
                      <div className="text-center py-12">
                        <Settings2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground">
                          Aucune case à cocher. Cliquez sur "Ajouter une case à cocher" pour commencer.
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nom de l'Option</TableHead>
                            <TableHead>Prix Supplémentaire</TableHead>
                            <TableHead>Disponibilité</TableHead>
                            <TableHead>Ordre</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupOptions.map((option) => (
                            <TableRow key={option.id}>
                              <TableCell className="font-medium">
                                {selectedGroupForOptions.selection_type === "single" ? "⚪" : "☑"} {option.name}
                              </TableCell>
                              <TableCell>
                                {option.extra_price > 0 ? (
                                  <Badge variant="secondary">+ {option.extra_price.toFixed(0)} XAF</Badge>
                                ) : (
                                  <span className="text-muted-foreground">Gratuit</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={option.is_available ? "default" : "secondary"}>
                                  {option.is_available ? "Disponible" : "Indisponible"}
                                </Badge>
                              </TableCell>
                              <TableCell>{option.display_order}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditOption(option)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteClick("option", option.id, option.name)}
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
              )}
            </>
          )}
        </div>

        {/* Group Dialog */}
        <Dialog open={isGroupDialogOpen} onOpenChange={handleGroupDialogClose}>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSaveGroup}>
              <DialogHeader>
                <DialogTitle>
                  {editingGroup ? "Modifier le champ" : "Ajouter un nouveau champ de personnalisation"}
                </DialogTitle>
                <DialogDescription>
                  Créez un groupe d'options à cocher pour cette catégorie
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Catégorie Cible</Label>
                  <Input
                    value={selectedCategoryData?.name || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group-name">Nom du Champ *</Label>
                  <Input
                    id="group-name"
                    placeholder="Ex: Type de Hamburger, Choisissez vos Sauces"
                    value={groupFormData.name}
                    onChange={(e) =>
                      setGroupFormData({ ...groupFormData, name: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Ce nom sera affiché au client lors de la commande
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selection-type">Type de Sélection</Label>
                  <Select
                    value={groupFormData.selection_type}
                    onValueChange={(value: "single" | "multiple") =>
                      setGroupFormData({ ...groupFormData, selection_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">⚪ Sélection Unique (le client choisit une seule option)</SelectItem>
                      <SelectItem value="multiple">☑ Sélection Multiple (le client peut choisir plusieurs options)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between border rounded-lg p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="is-required">Ce champ est obligatoire ?</Label>
                    <p className="text-sm text-muted-foreground">
                      Le client devra obligatoirement faire un choix
                    </p>
                  </div>
                  <Switch
                    id="is-required"
                    checked={groupFormData.is_required}
                    onCheckedChange={(checked) =>
                      setGroupFormData({ ...groupFormData, is_required: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between border rounded-lg p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-description">📝 Zone de commentaire client</Label>
                    <p className="text-sm text-muted-foreground">
                      Permet au client d'ajouter des notes spéciales pour ce champ
                    </p>
                  </div>
                  <Switch
                    id="enable-description"
                    checked={groupFormData.enable_description}
                    onCheckedChange={(checked) =>
                      setGroupFormData({ ...groupFormData, enable_description: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display-order">Ordre d'affichage</Label>
                  <Input
                    id="display-order"
                    type="number"
                    min="0"
                    value={groupFormData.display_order}
                    onChange={(e) =>
                      setGroupFormData({ ...groupFormData, display_order: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Plus le nombre est petit, plus le champ apparaîtra en premier
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleGroupDialogClose(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingGroup ? "Mettre à jour" : "Créer le champ"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Option Dialog */}
        <Dialog open={isOptionDialogOpen} onOpenChange={handleOptionDialogClose}>
          <DialogContent>
            <form onSubmit={handleSaveOption}>
              <DialogHeader>
                <DialogTitle>
                  {editingOption ? "Modifier l'option" : "Ajouter une case à cocher"}
                </DialogTitle>
                <DialogDescription>
                  Créez une option de personnalisation pour : {selectedGroupForOptions?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="option-name">Nom de l'Option *</Label>
                  <Input
                    id="option-name"
                    placeholder="Ex: Hamburger Royale, Sauce BBQ, Bacon Supplémentaire"
                    value={optionFormData.name}
                    onChange={(e) =>
                      setOptionFormData({ ...optionFormData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extra-price">Prix Supplémentaire (XAF)</Label>
                  <Input
                    id="extra-price"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={optionFormData.extra_price}
                    onChange={(e) =>
                      setOptionFormData({ ...optionFormData, extra_price: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Laissez 0 si cette option est gratuite
                  </p>
                </div>

                <div className="flex items-center justify-between border rounded-lg p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="is-available">Option disponible</Label>
                    <p className="text-sm text-muted-foreground">
                      Le client peut sélectionner cette option
                    </p>
                  </div>
                  <Switch
                    id="is-available"
                    checked={optionFormData.is_available}
                    onCheckedChange={(checked) =>
                      setOptionFormData({ ...optionFormData, is_available: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="option-display-order">Ordre d'affichage</Label>
                  <Input
                    id="option-display-order"
                    type="number"
                    min="0"
                    value={optionFormData.display_order}
                    onChange={(e) =>
                      setOptionFormData({ ...optionFormData, display_order: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOptionDialogClose(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingOption ? "Mettre à jour" : "Ajouter l'option"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={isConfirmOpen}
          onOpenChange={setIsConfirmOpen}
          onConfirm={handleDeleteConfirm}
          title={`Supprimer ${deleteTarget?.type === "group" ? "le champ" : "l'option"}`}
          description={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.name}" ? Cette action est irréversible.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminCategoryOptions;