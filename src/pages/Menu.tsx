import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, ArrowLeft, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DishCard from "@/components/DishCard";
import CartSheet from "@/components/CartSheet";

interface Dish {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  has_customization?: boolean;
}

export interface CartItem extends Dish {
  quantity: number;
  comment?: string;
  customizations?: any[];
  customizationText?: string;
  finalPrice?: number;
}

const Menu = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  const tableNumber = sessionStorage.getItem("tableNumber");
  const restaurantId = sessionStorage.getItem("restaurantId");

  useEffect(() => {
    // Check if table is set
    if (!tableNumber || !restaurantId) {
      toast({
        title: "Erreur",
        description: "Veuillez scanner le QR code de votre table",
        variant: "destructive",
      });
      navigate("/table-scan");
      return;
    }

    fetchDishes();
    loadCartFromSession();
  }, [restaurantId]);

  useEffect(() => {
    // Save cart to sessionStorage whenever it changes
    sessionStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const loadCartFromSession = () => {
    const cartJson = sessionStorage.getItem("cart");
    if (cartJson) {
      try {
        const savedCart = JSON.parse(cartJson);
        setCart(savedCart);
      } catch (error) {
        console.error("Error loading cart:", error);
      }
    }
  };

  const fetchDishes = async () => {
    try {
      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("is_available", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;

      // Check which dishes have customization options
      const dishesWithCustomization = await Promise.all(
        (data || []).map(async (dish) => {
          const { data: optionGroups } = await supabase
            .from("dish_option_groups")
            .select("id")
            .eq("dish_id", dish.id)
            .limit(1);

          return {
            ...dish,
            has_customization: (optionGroups?.length || 0) > 0,
          };
        })
      );

      setDishes(dishesWithCustomization);
    } catch (error) {
      console.error("Error fetching dishes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le menu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (dish: Dish) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === dish.id && !item.customizations
      );
      if (existing) {
        return prev.map((item) =>
          item.id === dish.id && !item.customizations
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...dish, quantity: 1, finalPrice: dish.price }];
    });

    toast({
      title: "Ajouté au panier",
      description: `${dish.name} a été ajouté`,
    });
  };

  const updateCartItem = (
    index: number,
    quantity: number,
    comment?: string
  ) => {
    if (quantity === 0) {
      setCart((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCart((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, quantity, comment } : item
        )
      );
    }
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const categories = ["all", ...new Set(dishes.map((dish) => dish.category))];

  const filteredDishes =
    activeCategory === "all"
      ? dishes
      : dishes.filter((dish) => dish.category === activeCategory);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/table-scan")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>

            <div className="text-center">
              <h1 className="text-xl font-bold">Notre Menu</h1>
              <Badge variant="outline" className="mt-1">
                Table {tableNumber}
              </Badge>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => setIsCartOpen(true)}
              className="relative"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Panier
              {getTotalItems() > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement du menu...</p>
          </div>
        ) : (
          <>
            {/* Category Tabs */}
            <Tabs
              value={activeCategory}
              onValueChange={setActiveCategory}
              className="mb-6"
            >
              <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
                {categories.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="capitalize whitespace-nowrap"
                  >
                    {category === "all" ? "Tout" : category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Dishes Grid */}
            {filteredDishes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Aucun plat disponible dans cette catégorie
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDishes.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Cart Sheet */}
      <CartSheet
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateItem={updateCartItem}
        onRemoveItem={removeFromCart}
      />
    </div>
  );
};

export default Menu;