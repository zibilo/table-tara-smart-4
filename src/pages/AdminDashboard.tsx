import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { 
  LogOut, 
  Table2, 
  UtensilsCrossed, 
  LayoutDashboard,
  Settings,
  ChefHat,
  ListOrdered
} from "lucide-react";

const AdminDashboard = () => {
  const { isAuthenticated, adminName, logout } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  if (!isAuthenticated) {
    return null;
  }

  const menuItems = [
    {
      title: "Gestion des Tables",
      description: "Gérer les numéros de table et codes QR",
      icon: Table2,
      path: "/admin/tables",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Gestion des Plats",
      description: "Ajouter, modifier et supprimer des plats",
      icon: UtensilsCrossed,
      path: "/admin/dishes",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Catégories de Menu",
      description: "Organiser les catégories du menu",
      icon: LayoutDashboard,
      path: "/admin/categories",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Options & Personnalisation",
      description: "Gérer les options de personnalisation",
      icon: ChefHat,
      path: "/admin/options",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Commandes",
      description: "Voir et gérer les commandes",
      icon: ListOrdered,
      path: "/admin/orders",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Paramètres",
      description: "Configuration du restaurant",
      icon: Settings,
      path: "/admin/settings",
      color: "text-gray-500",
      bgColor: "bg-gray-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Panneau d'Administration</h1>
              <p className="text-sm text-muted-foreground">
                Bienvenue, <span className="font-semibold">{adminName}</span>
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Tableau de bord</h2>
          <p className="text-muted-foreground">
            Gérez tous les aspects de votre restaurant depuis cette interface
          </p>
        </div>

        {/* Grid of Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer hover:border-primary">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${item.bgColor} flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="w-full">
                      Accéder →
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
