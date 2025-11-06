import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";
import Index from "./pages/Index";
import TableScan from "./pages/TableScan";
import Menu from "./pages/Menu";
import DishCustomization from "./pages/DishCustomization";
import OrderConfirmation from "./pages/OrderConfirmation";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTables from "./pages/AdminTables";
import AdminDishes from "./pages/AdminDishes";
import AdminCategories from "./pages/AdminCategories";
import AdminOptions from "./pages/AdminOptions";
import AdminCategoryOptions from "./pages/AdminCategoryOptions";
import AdminOrders from "./pages/AdminOrders";
import AdminSettings from "./pages/AdminSettings";
import NotFound from "./pages/NotFound";
import HoverReceiver from "@/visual-edits/VisualEditsMessenger";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HoverReceiver />
      <BrowserRouter>
        <AdminAuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/table-scan" element={<TableScan />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/dish-customization" element={<DishCustomization />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/tables"
              element={
                <ProtectedAdminRoute>
                  <AdminTables />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/dishes"
              element={
                <ProtectedAdminRoute>
                  <AdminDishes />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedAdminRoute>
                  <AdminCategories />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/options"
              element={
                <ProtectedAdminRoute>
                  <AdminOptions />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/category-options"
              element={
                <ProtectedAdminRoute>
                  <AdminCategoryOptions />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedAdminRoute>
                  <AdminOrders />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedAdminRoute>
                  <AdminSettings />
                </ProtectedAdminRoute>
              }
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AdminAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;