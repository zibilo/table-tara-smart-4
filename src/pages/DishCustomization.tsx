import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DishOption {
  id: number;
  name: string;
  extra_price: number;
  is_available: boolean;
}

interface OptionGroup {
  id: number;
  name: string;
  selection_type: "single" | "multiple";
  is_required: boolean;
  options: DishOption[];
}

interface SelectedOption {
  optionGroupId: number;
  optionGroupName: string;
  optionId: number;
  optionName: string;
  extraPrice: number;
}

const DishCustomization = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const dish = location.state?.dish;
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(dish?.price || 0);

  useEffect(() => {
    if (!dish) {
      toast({
        title: "Erreur",
        description: "Plat non trouvé",
        variant: "destructive",
      });
      navigate("/menu");
      return;
    }

    fetchDishOptions();
  }, [dish]);

  useEffect(() => {
    // Calculate total price based on selected options
    const extraPrice = selectedOptions.reduce((sum, opt) => sum + opt.extraPrice, 0);
    setTotalPrice((dish?.price || 0) + extraPrice);
  }, [selectedOptions, dish]);

  const fetchDishOptions = async () => {
    try {
      // Fetch option groups for this dish
      const { data: groups, error: groupsError } = await supabase
        .from("dish_option_groups")
        .select("*")
        .eq("dish_id", dish.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (groupsError) throw groupsError;

      if (!groups || groups.length === 0) {
        setOptionGroups([]);
        setIsLoading(false);
        return;
      }

      // Fetch options for each group
      const groupsWithOptions = await Promise.all(
        groups.map(async (group) => {
          const { data: options, error: optionsError } = await supabase
            .from("dish_options")
            .select("*")
            .eq("option_group_id", group.id)
            .eq("is_available", true)
            .order("display_order", { ascending: true });

          if (optionsError) throw optionsError;

          return {
            id: group.id,
            name: group.name,
            selection_type: group.selection_type as "single" | "multiple",
            is_required: group.is_required,
            options: options || [],
          };
        })
      );

      setOptionGroups(groupsWithOptions);
    } catch (error) {
      console.error("Error fetching dish options:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les options",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingleSelection = (group: OptionGroup, option: DishOption) => {
    setSelectedOptions((prev) => {
      // Remove any existing selection from this group
      const filtered = prev.filter((opt) => opt.optionGroupId !== group.id);
      // Add new selection
      return [
        ...filtered,
        {
          optionGroupId: group.id,
          optionGroupName: group.name,
          optionId: option.id,
          optionName: option.name,
          extraPrice: option.extra_price,
        },
      ];
    });
  };

  const handleMultipleSelection = (group: OptionGroup, option: DishOption, checked: boolean) => {
    setSelectedOptions((prev) => {
      if (checked) {
        // Add selection
        return [
          ...prev,
          {
            optionGroupId: group.id,
            optionGroupName: group.name,
            optionId: option.id,
            optionName: option.name,
            extraPrice: option.extra_price,
          },
        ];
      } else {
        // Remove selection
        return prev.filter(
          (opt) => !(opt.optionGroupId === group.id && opt.optionId === option.id)
        );
      }
    });
  };

  const isOptionSelected = (groupId: number, optionId: number) => {
    return selectedOptions.some(
      (opt) => opt.optionGroupId === groupId && opt.optionId === optionId
    );
  };

  const validateRequiredOptions = () => {
    const requiredGroups = optionGroups.filter((group) => group.is_required);
    for (const group of requiredGroups) {
      const hasSelection = selectedOptions.some((opt) => opt.optionGroupId === group.id);
      if (!hasSelection) {
        toast({
          title: "Options requises",
          description: `Veuillez sélectionner une option pour "${group.name}"`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!validateRequiredOptions()) {
      return;
    }

    // Get cart from sessionStorage
    const cartJson = sessionStorage.getItem("cart");
    const cart = cartJson ? JSON.parse(cartJson) : [];

    // Create customization summary
    const customizationText = selectedOptions
      .map((opt) => `${opt.optionGroupName}: ${opt.optionName}`)
      .join(", ");

    // Add item to cart with customizations
    const cartItem = {
      ...dish,
      quantity: 1,
      customizations: selectedOptions,
      customizationText: customizationText || "Aucune personnalisation",
      finalPrice: totalPrice,
    };

    cart.push(cartItem);
    sessionStorage.setItem("cart", JSON.stringify(cart));

    toast({
      title: "Ajouté au panier",
      description: `${dish.name} a été ajouté avec vos personnalisations`,
    });

    navigate("/menu");
  };

  if (!dish) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/menu")}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au menu
          </Button>
        </div>
      </header>

      {/* Dish Header */}
      <div className="container mx-auto px-4 py-6">
        {dish.image_url && (
          <div className="aspect-video w-full max-w-2xl mx-auto overflow-hidden rounded-lg mb-6">
            <img
              src={dish.image_url}
              alt={dish.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{dish.name}</h1>
          {dish.description && (
            <p className="text-muted-foreground mb-4">{dish.description}</p>
          )}
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Prix de base: {dish.price.toFixed(0)} XAF
          </Badge>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement des options...</p>
          </div>
        )}

        {/* No Options Available */}
        {!isLoading && optionGroups.length === 0 && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Ce plat n'a pas d'options de personnalisation
              </p>
              <Button onClick={() => {
                const cartJson = sessionStorage.getItem("cart");
                const cart = cartJson ? JSON.parse(cartJson) : [];
                cart.push({ ...dish, quantity: 1, finalPrice: dish.price });
                sessionStorage.setItem("cart", JSON.stringify(cart));
                navigate("/menu");
              }}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Ajouter au panier
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Option Groups */}
        {!isLoading && optionGroups.length > 0 && (
          <div className="space-y-6 max-w-2xl mx-auto">
            {optionGroups.map((group) => (
              <Card key={group.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">{group.name}</h2>
                    {group.is_required && (
                      <Badge variant="destructive">Obligatoire</Badge>
                    )}
                  </div>

                  {/* Single Selection (Radio) */}
                  {group.selection_type === "single" && (
                    <RadioGroup
                      value={
                        selectedOptions.find((opt) => opt.optionGroupId === group.id)
                          ?.optionId.toString() || ""
                      }
                      onValueChange={(value) => {
                        const option = group.options.find(
                          (opt) => opt.id.toString() === value
                        );
                        if (option) handleSingleSelection(group, option);
                      }}
                    >
                      <div className="space-y-3">
                        {group.options.map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <RadioGroupItem
                              value={option.id.toString()}
                              id={`option-${option.id}`}
                            />
                            <Label
                              htmlFor={`option-${option.id}`}
                              className="flex-1 flex items-center justify-between cursor-pointer"
                            >
                              <span>{option.name}</span>
                              {option.extra_price > 0 && (
                                <Badge variant="secondary">
                                  +{option.extra_price.toFixed(0)} XAF
                                </Badge>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  )}

                  {/* Multiple Selection (Checkbox) */}
                  {group.selection_type === "multiple" && (
                    <div className="space-y-3">
                      {group.options.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            id={`option-${option.id}`}
                            checked={isOptionSelected(group.id, option.id)}
                            onCheckedChange={(checked) =>
                              handleMultipleSelection(group, option, checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={`option-${option.id}`}
                            className="flex-1 flex items-center justify-between cursor-pointer"
                          >
                            <span>{option.name}</span>
                            {option.extra_price > 0 && (
                              <Badge variant="secondary">
                                +{option.extra_price.toFixed(0)} XAF
                              </Badge>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Price Summary and Add to Cart */}
        {!isLoading && optionGroups.length > 0 && (
          <Card className="max-w-2xl mx-auto mt-8 border-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Prix Total</span>
                <span className="text-2xl font-bold text-primary">
                  {totalPrice.toFixed(0)} XAF
                </span>
              </div>

              {selectedOptions.length > 0 && (
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Personnalisations:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {selectedOptions.map((opt, index) => (
                      <li key={index}>
                        • {opt.optionGroupName}: {opt.optionName}
                        {opt.extraPrice > 0 && ` (+${opt.extraPrice.toFixed(0)} XAF)`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                onClick={handleAddToCart}
                className="w-full h-12 text-lg"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Ajouter au Panier - {totalPrice.toFixed(0)} XAF
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DishCustomization;
