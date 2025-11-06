import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

// Mock credentials
const MOCK_ADMIN = {
  username: "Anthony",
  password: "Ngami242",
  name: "Anthony",
  role: "admin",
};

interface AdminAuthContextType {
  isAuthenticated: boolean;
  adminName: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminName, setAdminName] = useState<string | null>(null);

  useEffect(() => {
    // Check if admin is already logged in
    const storedAdmin = localStorage.getItem("admin_auth");
    if (storedAdmin) {
      try {
        const admin = JSON.parse(storedAdmin);
        setIsAuthenticated(true);
        setAdminName(admin.name);
      } catch (error) {
        localStorage.removeItem("admin_auth");
      }
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    if (username === MOCK_ADMIN.username && password === MOCK_ADMIN.password) {
      setIsAuthenticated(true);
      setAdminName(MOCK_ADMIN.name);
      localStorage.setItem(
        "admin_auth",
        JSON.stringify({
          name: MOCK_ADMIN.name,
          role: MOCK_ADMIN.role,
          loginTime: new Date().toISOString(),
        })
      );
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdminName(null);
    localStorage.removeItem("admin_auth");
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, adminName, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
