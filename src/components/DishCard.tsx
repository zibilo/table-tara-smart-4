import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

interface DishCardProps {
  dish: Dish;
  onAddToCart: (dish: Dish) => void;
}

const DishCard = ({ dish, onAddToCart }: DishCardProps) => {
  const navigate = useNavigate();

  const handleCustomize = () => {
    navigate("/dish-customization", { state: { dish } });
  };

  return (
    <Card className="overflow-hidden hover:shadow-medium transition-shadow">
      {dish.image_url && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img
            src={dish.image_url}
            alt={dish.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg leading-tight">{dish.name}</h3>
          <Badge variant="secondary" className="ml-2 shrink-0">
            {dish.price.toFixed(0)} XAF
          </Badge>
        </div>
        {dish.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {dish.description}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        {dish.has_customization ? (
          <>
            <Button
              onClick={handleCustomize}
              className="flex-1"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Personnaliser
            </Button>
            <Button
              onClick={() => onAddToCart(dish)}
              variant="outline"
              size="sm"
              className="px-3"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            onClick={() => onAddToCart(dish)}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default DishCard;