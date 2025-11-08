import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const DiagnosticCategories = () => {
  const navigate = useNavigate();
  const [dishCategories, setDishCategories] = useState<string[]>([]);
  const [optionCategories, setOptionCategories] = useState<string[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [optionGroups, setOptionGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDiagnosticData();
  }, []);

  const fetchDiagnosticData = async () => {
    try {
      // Fetch all dishes
      const { data: dishesData, error: dishesError } = await supabase
        .from("dishes")
        .select("id, name, category")
        .order("category");

      if (dishesError) throw dishesError;
      setDishes(dishesData || []);

      // Extract unique categories from dishes
      const uniqueDishCategories = [
        ...new Set((dishesData || []).map((d) => d.category)),
      ];
      setDishCategories(uniqueDishCategories);

      // Fetch all option groups
      const { data: optionGroupsData, error: optionGroupsError } =
        await supabase
          .from("category_option_groups")
          .select("id, name, category")
          .order("category");

      if (optionGroupsError) throw optionGroupsError;
      setOptionGroups(optionGroupsData || []);

      // Extract unique categories from option groups
      const uniqueOptionCategories = [
        ...new Set((optionGroupsData || []).map((g) => g.category)),
      ];
      setOptionCategories(uniqueOptionCategories);
    } catch (error) {
      console.error("Error fetching diagnostic data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryMatches = () => {
    const matches: { [key: string]: boolean } = {};
    dishCategories.forEach((dishCat) => {
      matches[dishCat] = optionCategories.some(
        (optCat) => optCat.toLowerCase() === dishCat.toLowerCase()
      );
    });
    return matches;
  };

  const categoryMatches = getCategoryMatches();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <h1 className="text-3xl font-bold mb-6">🔍 Diagnostic des Catégories</h1>

        {isLoading ? (
          <p>Chargement...</p>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Résumé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <strong>Plats dans la base :</strong> {dishes.length}
                  </p>
                  <p>
                    <strong>Catégories de plats :</strong>{" "}
                    {dishCategories.length}
                  </p>
                  <p>
                    <strong>Groupes d'options :</strong> {optionGroups.length}
                  </p>
                  <p>
                    <strong>Catégories d'options :</strong>{" "}
                    {optionCategories.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Dish Categories */}
            <Card>
              <CardHeader>
                <CardTitle>🍽️ Catégories dans la table "dishes"</CardTitle>
              </CardHeader>
              <CardContent>
                {dishCategories.length === 0 ? (
                  <p className="text-muted-foreground">
                    Aucune catégorie trouvée
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dishCategories.map((cat) => (
                      <div
                        key={cat}
                        className={`p-3 rounded-lg border-2 ${
                          categoryMatches[cat]
                            ? "bg-green-50 border-green-300"
                            : "bg-red-50 border-red-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold">"{cat}"</span>
                          {categoryMatches[cat] ? (
                            <span className="text-green-600 font-bold">
                              ✅ Correspondance trouvée
                            </span>
                          ) : (
                            <span className="text-red-600 font-bold">
                              ❌ Aucune option configurée
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {dishes.filter((d) => d.category === cat).length}{" "}
                          plat(s) dans cette catégorie
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Option Categories */}
            <Card>
              <CardHeader>
                <CardTitle>
                  ⚙️ Catégories dans la table "category_option_groups"
                </CardTitle>
              </CardHeader>
              <CardContent>
                {optionCategories.length === 0 ? (
                  <p className="text-red-600 font-bold">
                    ⚠️ AUCUN GROUPE D'OPTIONS CONFIGURÉ ! Vous devez créer des
                    options dans l'interface administrateur.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {optionCategories.map((cat) => (
                      <div key={cat} className="p-3 rounded-lg border-2 bg-blue-50 border-blue-300">
                        <span className="font-mono font-bold">"{cat}"</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {
                            optionGroups.filter((g) => g.category === cat)
                              .length
                          }{" "}
                          groupe(s) d'options configuré(s)
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Dishes */}
            <Card>
              <CardHeader>
                <CardTitle>📋 Liste complète des plats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dishes.map((dish) => (
                    <div
                      key={dish.id}
                      className="p-2 border rounded text-sm flex justify-between"
                    >
                      <span>{dish.name}</span>
                      <span className="font-mono text-muted-foreground">
                        catégorie: "{dish.category}"
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* All Option Groups */}
            <Card>
              <CardHeader>
                <CardTitle>📋 Liste complète des groupes d'options</CardTitle>
              </CardHeader>
              <CardContent>
                {optionGroups.length === 0 ? (
                  <p className="text-red-600 font-bold">
                    ⚠️ Aucun groupe d'options trouvé !
                  </p>
                ) : (
                  <div className="space-y-2">
                    {optionGroups.map((group) => (
                      <div
                        key={group.id}
                        className="p-2 border rounded text-sm flex justify-between"
                      >
                        <span>{group.name}</span>
                        <span className="font-mono text-muted-foreground">
                          catégorie: "{group.category}"
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="border-2 border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle>💡 Recommandations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dishCategories.length === 0 && (
                    <p className="text-orange-800">
                      ⚠️ Aucun plat trouvé. Ajoutez des plats dans l'interface
                      administrateur.
                    </p>
                  )}

                  {optionCategories.length === 0 && (
                    <p className="text-red-800 font-bold">
                      ⚠️ AUCUNE OPTION CONFIGURÉE ! Allez dans l'interface
                      administrateur pour configurer les options personnalisables
                      pour chaque catégorie.
                    </p>
                  )}

                  {dishCategories.length > 0 &&
                    optionCategories.length > 0 &&
                    Object.values(categoryMatches).some((match) => !match) && (
                      <div>
                        <p className="text-orange-800 font-bold mb-2">
                          ⚠️ Incohérences détectées :
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                          {dishCategories.map((cat) =>
                            !categoryMatches[cat] ? (
                              <li key={cat}>
                                La catégorie <strong>"{cat}"</strong> existe dans
                                vos plats mais n'a AUCUNE option configurée. Allez
                                dans l'admin et créez des options pour cette
                                catégorie.
                              </li>
                            ) : null
                          )}
                        </ul>
                      </div>
                    )}

                  {dishCategories.length > 0 &&
                    optionCategories.length > 0 &&
                    Object.values(categoryMatches).every((match) => match) && (
                      <p className="text-green-800 font-bold">
                        ✅ Toutes vos catégories de plats ont des options
                        configurées ! Le système devrait fonctionner correctement.
                      </p>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosticCategories;
