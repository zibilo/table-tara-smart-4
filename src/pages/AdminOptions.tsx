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
import { Plus, ChefHat, Pencil, Trash2, Settings2, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Dish {
  id: string;
  name: string;
  category: string;
}

interface OptionGroup {
  id: string;
  dish_id: string;
  name: string;
  selection_type: "single" | "multiple";
  is_required: boolean;
  display_order: number;
  is_active: boolean;
}

interface Option {
  id: string;
  option_group_id: string;
  name: string;
  extra_price: number;
  is_available: boolean;
  display_order: number;
}

const AdminOptions = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedDishId, setSelectedDishId] = useState<string>("");
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "group" | "option"; id: string; name: string } | null>(null);
  const [editingGroup, setEditingGroup] = useState<OptionGroup | null>(null);
  const [selectedGroupForOptions, setSelectedGroupForOptions] = useState<OptionGroup | null>(null);
  const [groupOptions, setGroupOptions] = useState<Option[]>([]);
  const [editingOption, setEditingOption] = useState<Option | null>(null);

  const [groupFormData, setGroupFormData] = useState({
    name: "",
    selection_type: "single" as "single" | "multiple",
    is_required: false,
    display_order: 0,
  });

  const [optionFormData, setOptionFormData] = useState({
    name: "",
    extra_price: "0",
    is_available: true,
    display_order: 0,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchDishes();
  }, []);

  useEffect(() => {
    if (selectedDishId) {
      fetchOptionGroups();
    }
  }, [selectedDishId]);

  const fetchDishes = async () => {
    try {
      const { data, error } = await supabase
        .from("dishes")
        .select("id, name, category")
        .order("name");

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

  const fetchOptionGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("dish_option_groups")
        .select("*")
        .eq("dish_id", selectedDishId)
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
    }
  };

  const fetchGroupOptions = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from("dish_options")
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

    if (!groupFormData.name || !selectedDishId) {
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
          .from("dish_option_groups")
          .update({
            name: groupFormData.name,
            selection_type: groupFormData.selection_type,
            is_required: groupFormData.is_required,
            display_order: groupFormData.display_order,
          })
          .eq("id", editingGroup.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Groupe d'options mis à jour",
        });
      } else {
        const { error } = await supabase
          .from("dish_option_groups")
          .insert({
            dish_id: selectedDishId,
            name: groupFormData.name,
            selection_type: groupFormData.selection_type,
            is_required: groupFormData.is_required,
            display_order: groupFormData.display_order,
          });

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Groupe d'options créé",
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
          .from("dish_options")
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
          .from("dish_options")
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

  const handleEditGroup = (group: OptionGroup) => {
    setEditingGroup(group);
    setGroupFormData({
      name: group.name,
      selection_type: group.selection_type,
      is_required: group.is_required,
      display_order: group.display_order,
    });
    setIsGroupDialogOpen(true);
  };

  const handleEditOption = (option: Option) => {
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
          .from("dish_option_groups")
          .delete()
          .eq("id", deleteTarget.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Groupe d'options supprimé",
        });
        fetchOptionGroups();
      } else {
        const { error } = await supabase
          .from("dish_options")
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

  const handleManageOptions = async (group: OptionGroup) => {
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

  const selectedDish = dishes.find((d) => d.id === selectedDishId);

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Dish Selection Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Options de Personnalisation</CardTitle>
              <CardDescription>
                Créez des groupes d'options à cocher pour permettre aux clients de personnaliser leurs plats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="dish-select">Sélectionnez un plat</Label>
                <Select value={selectedDishId} onValueChange={setSelectedDishId}>
                  <SelectTrigger id="dish-select">
                    <SelectValue placeholder="Choisir un plat..." />
                  </SelectTrigger>
                  <SelectContent>
                    {dishes.map((dish) => (
                      <SelectItem key={dish.id} value={dish.id}>
                        {dish.name} <span className="text-muted-foreground">({dish.category})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Option Groups Card */}
          {selectedDishId && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Groupes d'Options pour: {selectedDish?.name}</CardTitle>
                    <CardDescription>
                      Exemple: "Type d'Hamburger", "Choisissez vos Sauces", etc.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsGroupDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un groupe
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {optionGroups.length === 0 ? (
                  <div className="text-center py-12">
                    <ChefHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground">
                      Aucun groupe d'options. Cliquez sur "Ajouter un groupe" pour commencer.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom du groupe</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Obligatoire</TableHead>
                        <TableHead>Ordre</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {optionGroups.map((group) => (
                        <TableRow key={group.id}>
                          <TableCell className="font-medium">{group.name}</TableCell>
                          <TableCell>
                            <Badge variant={group.selection_type === "single" ? "default" : "secondary"}>
                              {group.selection_type === "single" ? "Choix unique" : "Choix multiples"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {group.is_required ? (
                              <Badge variant="destructive">Obligatoire</Badge>
                            ) : (
                              <Badge variant="outline">Optionnel</Badge>
                            )}
                          </TableCell>
                          <TableCell>{group.display_order}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleManageOptions(group)}
                              >
                                <List className="w-4 h-4" />
                              </Button>
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
          )}

          {/* Options Management Card */}
          {selectedGroupForOptions && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Options pour: {selectedGroupForOptions.name}</CardTitle>
                    <CardDescription>
                      Exemple: "Royale", "Cheeseburger", "Végétarien", etc.
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
                        <TableHead>Nom</TableHead>
                        <TableHead>Prix supplémentaire</TableHead>
                        <TableHead>Disponible</TableHead>
                        <TableHead>Ordre</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupOptions.map((option) => (
                        <TableRow key={option.id}>
                          <TableCell className="font-medium">{option.name}</TableCell>
                          <TableCell>
                            {option.extra_price > 0 ? `+${option.extra_price} XAF` : "Gratuit"}
                          </TableCell>
                          <TableCell>
                            <Switch checked={option.is_available} disabled />
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
        </div>

        {/* Group Dialog */}
        <Dialog open={isGroupDialogOpen} onOpenChange={handleGroupDialogClose}>
          <DialogContent>
            <form onSubmit={handleSaveGroup}>
              <DialogHeader>
                <DialogTitle>
                  {editingGroup ? "Modifier le groupe" : "Nouveau groupe d'options"}
                </DialogTitle>
                <DialogDescription>
                  Définissez un groupe d'options pour ce plat
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="group-name">Nom du groupe *</Label>
                  <Input
                    id="group-name"
                    placeholder="Ex: Type d'Hamburger"
                    value={groupFormData.name}
                    onChange={(e) =>
                      setGroupFormData({ ...groupFormData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selection-type">Type de sélection</Label>
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
                      <SelectItem value="single">Choix unique (boutons radio)</SelectItem>
                      <SelectItem value="multiple">Choix multiples (cases à cocher)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is-required">Obligatoire</Label>
                    <p className="text-sm text-muted-foreground">
                      Le client doit faire un choix
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
                  {editingOption ? "Modifier l'option" : "Nouvelle option"}
                </DialogTitle>
                <DialogDescription>
                  Ajoutez une option à cocher pour ce groupe
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="option-name">Nom de l'option *</Label>
                  <Input
                    id="option-name"
                    placeholder="Ex: Royale"
                    value={optionFormData.name}
                    onChange={(e) =>
                      setOptionFormData({ ...optionFormData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extra-price">Prix supplémentaire (XAF)</Label>
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
          title={`Supprimer ${deleteTarget?.type === "group" ? "le groupe" : "l'option"}`}
          description={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.name}" ? Cette action est irréversible.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminOptions;