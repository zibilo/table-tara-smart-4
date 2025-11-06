import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { 
  LogOut, 
  LayoutDashboard,
  Settings,
  ListOrdered,
  Home,
  ChefHat,
  Utensils,
  Tags
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { adminName, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const navItems = [
    { title: "🏠 Tableau de Bord", path: "/admin/dashboard", icon: Home },
    { title: "🍽️ Tables", path: "/admin/tables", icon: Utensils },
    { title: "🏷️ Catégories", path: "/admin/categories", icon: Tags },
    { title: "✅ Gestion des Options", path: "/admin/category-options", icon: ChefHat },
    { title: "🧾 Commandes", path: "/admin/orders", icon: ListOrdered },
    { title: "⚙️ Paramètres", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold">Administration</h1>
          <p className="text-sm text-muted-foreground mt-1">{adminName}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};