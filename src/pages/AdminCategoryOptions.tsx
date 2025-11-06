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
import { Plus, ChefHat, Pencil, Trash2, Settings2, List, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const MAIN_CATEGORIES = [
  { id: "hamburger", name: "Hamburger", emoji: "🍔", color: "bg-orange-500" },
  { id: "pizza", name: "Pizza", emoji: "🍕", color: "bg-red-500" },
  { id: "boisson", name: "Boisson", emoji: "🥤", color: "bg-blue-500" },
  { id: "dessert", name: "Dessert", emoji: "🍰", color: "bg-pink-500" },
];

const AdminCategoryOptions = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [optionGroups, setOptionGroups] = useState<CategoryOptionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    if (selectedCategory) {
      fetchOptionGroups();
    }
  }, [selectedCategory]);

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

  const selectedCategoryData = MAIN_CATEGORIES.find((c) => c.id === selectedCategory);

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MAIN_CATEGORIES.map((category) => (
                    <Card
                      key={category.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className={`w-16 h-16 ${category.color} rounded-lg flex items-center justify-center text-4xl`}>
                            {category.emoji}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">Gérer les options du {category.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Cliquez pour configurer
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
                        }}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                          <span className="text-3xl">{selectedCategoryData?.emoji}</span>
                          Gestion des Options : {selectedCategoryData?.name}
                        </CardTitle>
                        <CardDescription>
                          Créez des champs de personnalisation pour cette catégorie
                        </CardDescription>
                      </div>
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
                      <ChefHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                      <p className="text-muted-foreground">
                        Aucun champ d'options. Cliquez sur "Ajouter un champ" pour commencer.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Champ Actuel</TableHead>
                          <TableHead>Type</TableHead>
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
                                {group.selection_type === "single" ? "Unique" : "Multiple"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleManageOptions(group)}
                              >
                                <List className="w-4 h-4 mr-2" />
                                Cases à cocher
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
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Liste des Options (Cases à Cocher)</CardTitle>
                        <CardDescription>
                          Champ : {selectedGroupForOptions.name}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setSelectedGroupForOptions(null)}>
                          Fermer
                        </Button>
                        <Button onClick={() => setIsOptionDialogOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter une option
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {groupOptions.length === 0 ? (
                      <div className="text-center py-12">
                        <Settings2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground">
                          Aucune option. Cliquez sur "Ajouter une option" pour commencer.
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nom de la Case à Cocher</TableHead>
                            <TableHead>Prix Supplémentaire</TableHead>
                            <TableHead>Ordre</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupOptions.map((option) => (
                            <TableRow key={option.id}>
                              <TableCell className="font-medium">{option.name}</TableCell>
                              <TableCell>
                                {option.extra_price > 0 ? `+ ${option.extra_price.toFixed(2)} €` : "Gratuit"}
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
                  {editingGroup ? "Modifier le champ" : "Ajouter un nouveau champ à cocher"}
                </DialogTitle>
                <DialogDescription>
                  Créez un groupe d'options pour cette catégorie
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
                  <Label htmlFor="group-name">Titre du Champ *</Label>
                  <Input
                    id="group-name"
                    placeholder="Ex: Type de Sandwich, Garniture Supplémentaire"
                    value={groupFormData.name}
                    onChange={(e) =>
                      setGroupFormData({ ...groupFormData, name: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Le titre affiché au client
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
                      <SelectItem value="single">● Sélection Unique (case radio)</SelectItem>
                      <SelectItem value="multiple">☑ Sélection Multiple (cases à cocher)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is-required">Obligatoire ?</Label>
                    <p className="text-sm text-muted-foreground">
                      Rendre ce choix obligatoire pour le client
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

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-description">📝 Activer la Zone de Description Client</Label>
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
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleGroupDialogClose(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingGroup ? "Mettre à jour" : "Créer"}
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
                  {editingOption ? "Modifier l'option" : "Ajouter une nouvelle option"}
                </DialogTitle>
                <DialogDescription>
                  Définissez une case à cocher pour ce champ
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="option-name">Nom de la Case à Cocher *</Label>
                  <Input
                    id="option-name"
                    placeholder="Ex: Tomate Fraîche, Oignons Frits, Bacon Croustillant"
                    value={optionFormData.name}
                    onChange={(e) =>
                      setOptionFormData({ ...optionFormData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extra-price">Prix Supplémentaire (€)</Label>
                  <Input
                    id="extra-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={optionFormData.extra_price}
                    onChange={(e) =>
                      setOptionFormData({ ...optionFormData, extra_price: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: 0.50 pour +0,50 €, 1.00 pour +1,00 €
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is-available">Disponible</Label>
                    <p className="text-sm text-muted-foreground">
                      Cette option peut être sélectionnée
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
                  {editingOption ? "Mettre à jour" : "Ajouter"}
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
