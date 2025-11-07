import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ShoppingCart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DishOption {
  id: string;
  option_group_id: string;
  name: string;
  extra_price: number;
  is_available: boolean;
  display_order: number;
}

interface OptionGroup {
  id: string;
  category: string;
  name: string;
  selection_type: "single" | "multiple";
  is_required: boolean;
  display_order: number;
  enable_description: boolean;
  options: DishOption[];
}

interface SelectedOption {
  optionGroupId: string;
  optionGroupName: string;
  optionId: string;
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
  const [specialNotes, setSpecialNotes] = useState<{ [groupId: string]: string }>({});
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
      // DEBUG: Log the dish category to see what we're searching for
      console.log("🔍 DEBUG - Dish category:", dish.category);
      console.log("🔍 DEBUG - Full dish object:", dish);

      // Fetch option groups for this dish's CATEGORY (not dish_id)
      const { data: groups, error: groupsError } = await supabase
        .from("category_option_groups")
        .select("*")
        .eq("category", dish.category)
        .order("display_order", { ascending: true });

      // DEBUG: Log the query result
      console.log("🔍 DEBUG - Query result groups:", groups);
      console.log("🔍 DEBUG - Query error:", groupsError);

      if (groupsError) throw groupsError;

      if (!groups || groups.length === 0) {
        console.log("⚠️ DEBUG - No option groups found for category:", dish.category);
        setOptionGroups([]);
        setIsLoading(false);
        return;
      }

      console.log(`✅ DEBUG - Found ${groups.length} option groups`);

      // Fetch options for each group from category_options table
      const groupsWithOptions = await Promise.all(
        groups.map(async (group) => {
          const { data: options, error: optionsError } = await supabase
            .from("category_options")
            .select("*")
            .eq("option_group_id", group.id)
            .eq("is_available", true)
            .order("display_order", { ascending: true });

          console.log(`🔍 DEBUG - Options for group "${group.name}":`, options);

          if (optionsError) throw optionsError;

          return {
            id: group.id,
            category: group.category,
            name: group.name,
            selection_type: group.selection_type as "single" | "multiple",
            is_required: group.is_required,
            display_order: group.display_order,
            enable_description: group.enable_description || false,
            options: options || [],
          };
        })
      );

      console.log("✅ DEBUG - Final option groups with options:", groupsWithOptions);
      setOptionGroups(groupsWithOptions);
    } catch (error) {
      console.error("❌ ERROR - Error fetching dish options:", error);
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

  const isOptionSelected = (groupId: string, optionId: string) => {
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

    // Combine all special notes
    const allSpecialNotes = Object.entries(specialNotes)
      .filter(([_, note]) => note.trim())
      .map(([groupId, note]) => {
        const group = optionGroups.find((g) => g.id === groupId);
        return `${group?.name}: ${note}`;
      })
      .join("\n");

    // Add item to cart with customizations
    const cartItem = {
      ...dish,
      quantity: 1,
      customizations: selectedOptions,
      specialNotes: allSpecialNotes || undefined,
      finalPrice: totalPrice,
    };

    cart.push(cartItem);
    sessionStorage.setItem("cart", JSON.stringify(cart));

    toast({
      title: "✨ Ajouté au panier",
      description: `${dish.name} a été ajouté avec vos personnalisations`,
    });

    navigate("/menu");
  };

  if (!dish) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-green-50 to-yellow-50 pb-24">
      {/* Decorative elements */}
      <div className="fixed top-10 left-10 text-4xl animate-bounce">☁️</div>
      <div className="fixed top-20 right-20 text-3xl animate-bounce" style={{ animationDelay: '0.5s' }}>⭐</div>
      <div className="fixed bottom-40 left-20 text-3xl animate-bounce" style={{ animationDelay: '1s' }}>🍓</div>
      <div className="fixed bottom-60 right-10 text-4xl animate-bounce" style={{ animationDelay: '1.5s' }}>☁️</div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b-4 border-orange-200 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/menu")}
            className="mb-2 hover:bg-orange-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au menu
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Dish Header with playful design */}
        <div className="text-center mb-8 relative">
          <div className="inline-block relative">
            <h1 className="text-4xl md:text-5xl font-black mb-4 text-orange-600 drop-shadow-lg">
              {dish.name} {dish.category === 'plats' ? '🍔' : dish.category === 'desserts' ? '🍰' : dish.category === 'boissons' ? '🥤' : '🍕'}
            </h1>
            <div className="absolute -top-6 -right-8 text-4xl animate-spin" style={{ animationDuration: '3s' }}>✨</div>
          </div>
          <div className="inline-block bg-gradient-to-r from-purple-400 to-pink-400 text-white px-8 py-3 rounded-full text-xl font-bold shadow-xl transform rotate-2">
            {dish.price.toFixed(0)} XAF
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin text-6xl mb-4">👨‍🍳</div>
            <p className="text-lg text-gray-600 font-semibold">Préparation des options...</p>
          </div>
        )}

        {/* No Options Available */}
        {!isLoading && optionGroups.length === 0 && (
          <Card className="mb-6 border-4 border-dashed border-gray-300 bg-white shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-lg text-gray-600 mb-6 font-semibold">
                Ce plat est prêt tel quel !
              </p>
              <Button 
                onClick={() => {
                  const cartJson = sessionStorage.getItem("cart");
                  const cart = cartJson ? JSON.parse(cartJson) : [];
                  cart.push({ ...dish, quantity: 1, finalPrice: dish.price });
                  sessionStorage.setItem("cart", JSON.stringify(cart));
                  navigate("/menu");
                }}
                className="bg-gradient-to-r from-green-400 to-blue-400 hover:from-green-500 hover:to-blue-500 text-white text-lg py-6 px-8 rounded-full shadow-xl transform hover:scale-105 transition-transform"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Ajouter au Panier 🛒
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Option Groups with colorful design */}
        {!isLoading && optionGroups.length > 0 && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {optionGroups.map((group, groupIndex) => {
              const bgColors = ['bg-gradient-to-br from-orange-100 to-yellow-100', 'bg-gradient-to-br from-pink-100 to-purple-100', 'bg-gradient-to-br from-blue-100 to-cyan-100', 'bg-gradient-to-br from-green-100 to-teal-100'];
              const borderColors = ['border-orange-300', 'border-pink-300', 'border-blue-300', 'border-green-300'];
              
              return (
                <Card key={group.id} className={`border-4 ${borderColors[groupIndex % 4]} ${bgColors[groupIndex % 4]} shadow-2xl transform hover:scale-[1.02] transition-transform`}>
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-2">
                        {group.name.toUpperCase()}
                      </h2>
                      {group.is_required && (
                        <Badge className="bg-red-500 text-white text-sm px-4 py-1 font-bold">
                          ⚠️ OBLIGATOIRE
                        </Badge>
                      )}
                    </div>

                    {/* Single Selection (Radio) */}
                    {group.selection_type === "single" && (
                      <RadioGroup
                        value={
                          selectedOptions.find((opt) => opt.optionGroupId === group.id)
                            ?.optionId || ""
                        }
                        onValueChange={(value) => {
                          const option = group.options.find((opt) => opt.id === value);
                          if (option) handleSingleSelection(group, option);
                        }}
                      >
                        <div className="space-y-3">
                          {group.options.map((option) => (
                            <div
                              key={option.id}
                              className={`flex items-center space-x-4 p-4 rounded-2xl border-3 bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                                isOptionSelected(group.id, option.id) ? 'border-4 border-green-500 bg-green-50' : 'border-2 border-gray-200'
                              }`}
                            >
                              <RadioGroupItem
                                value={option.id}
                                id={`option-${option.id}`}
                                className="w-6 h-6"
                              />
                              <Label
                                htmlFor={`option-${option.id}`}
                                className="flex-1 flex items-center justify-between cursor-pointer"
                              >
                                <span className="text-lg font-bold text-gray-800">{option.name}</span>
                                {option.extra_price > 0 && (
                                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold text-sm px-3 py-1">
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
                            className={`flex items-center space-x-4 p-4 rounded-2xl border-3 bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                              isOptionSelected(group.id, option.id) ? 'border-4 border-green-500 bg-green-50' : 'border-2 border-gray-200'
                            }`}
                          >
                            <Checkbox
                              id={`option-${option.id}`}
                              checked={isOptionSelected(group.id, option.id)}
                              onCheckedChange={(checked) =>
                                handleMultipleSelection(group, option, checked as boolean)
                              }
                              className="w-6 h-6"
                            />
                            <Label
                              htmlFor={`option-${option.id}`}
                              className="flex-1 flex items-center justify-between cursor-pointer"
                            >
                              <span className="text-lg font-bold text-gray-800">{option.name}</span>
                              {option.extra_price > 0 && (
                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold text-sm px-3 py-1">
                                  +{option.extra_price.toFixed(0)} XAF
                                </Badge>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Special Notes for this group if enabled */}
                    {group.enable_description && (
                      <>
                        <Separator className="my-4" />
                        <div className="space-y-2 bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                          <Label
                            htmlFor={`notes-${group.id}`}
                            className="text-sm font-bold text-purple-700 flex items-center gap-2"
                          >
                            📝 Notes spéciales pour {group.name}
                          </Label>
                          <Textarea
                            id={`notes-${group.id}`}
                            placeholder="Ex: Sans oignons, bien cuit, etc."
                            value={specialNotes[group.id] || ""}
                            onChange={(e) =>
                              setSpecialNotes((prev) => ({
                                ...prev,
                                [group.id]: e.target.value,
                              }))
                            }
                            className="min-h-[80px] border-2 border-purple-300 text-base"
                            maxLength={200}
                          />
                          <p className="text-xs text-gray-500 text-right">
                            {(specialNotes[group.id] || "").length}/200
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add to Cart Button - Sticky at bottom */}
        {!isLoading && optionGroups.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t-4 border-orange-300 shadow-2xl p-4 z-50">
            <div className="container mx-auto max-w-3xl">
              <div className="flex items-center justify-between mb-3">
                <div className="text-left">
                  <p className="text-sm text-gray-600 font-semibold">Prix Total</p>
                  <p className="text-3xl font-black text-green-600">
                    {totalPrice.toFixed(0)} XAF
                  </p>
                </div>
                <Button
                  onClick={handleAddToCart}
                  className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 hover:from-green-500 hover:via-blue-500 hover:to-purple-500 text-white text-lg md:text-xl font-black py-6 md:py-8 px-8 md:px-12 rounded-full shadow-2xl transform hover:scale-105 transition-transform"
                  size="lg"
                >
                  <ShoppingCart className="h-6 w-6 mr-2" />
                  AJOUTER AU PANIER <Sparkles className="h-5 w-5 ml-2" />
                </Button>
              </div>
              
              {selectedOptions.length > 0 && (
                <div className="text-xs text-gray-600 text-center">
                  {selectedOptions.length} option(s) sélectionnée(s)
                  {Object.values(specialNotes).some(note => note.trim()) && " • Notes ajoutées"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DishCustomization;