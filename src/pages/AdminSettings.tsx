import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const AdminSettings = () => {
  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Paramètres du Restaurant</CardTitle>
              <CardDescription>
                Configurez les informations de votre restaurant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="restaurant-name">Nom du restaurant</Label>
                <Input
                  id="restaurant-name"
                  placeholder="Mon Restaurant"
                  defaultValue="Restaurant Saveurs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="restaurant-phone">Téléphone</Label>
                <Input
                  id="restaurant-phone"
                  placeholder="+237 XXX XXX XXX"
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="restaurant-address">Adresse</Label>
                <Input
                  id="restaurant-address"
                  placeholder="123 Rue Example"
                />
              </div>
              <Button>Enregistrer les modifications</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations de Connexion</CardTitle>
              <CardDescription>
                Gérez vos identifiants d'administration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">
                  Fonctionnalité à venir
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
