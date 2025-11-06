import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CategoryStats {
  category: string;
  count: number;
  totalDishes: number;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

      // Count dishes by category
      const categoryCount: { [key: string]: number } = {};
      data.forEach((dish) => {
        const cat = dish.category;
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      const categoryStats: CategoryStats[] = Object.entries(categoryCount).map(
        ([category, count]) => ({
          category,
          count,
          totalDishes: count,
        })
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

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Catégories de Menu</CardTitle>
                  <CardDescription>
                    Vue d'ensemble des catégories de votre menu
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <LayoutDashboard className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground">
                    Aucune catégorie trouvée. Ajoutez des plats pour voir les catégories.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                      <Card key={cat.category} className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold capitalize">
                              {cat.category}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {cat.count} plat{cat.count > 1 ? "s" : ""}
                            </p>
                          </div>
                          <Badge variant="secondary">{cat.count}</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="mt-8 p-6 bg-muted/50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Information</h3>
                    <p className="text-sm text-muted-foreground">
                      Les catégories sont automatiquement créées lorsque vous ajoutez des
                      plats. Pour organiser votre menu, attribuez une catégorie à chaque plat
                      dans la section "Gestion des Plats".
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;