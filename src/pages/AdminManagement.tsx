import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tags, Utensils, UtensilsCrossed, LogOut } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import CategoryManager from '@/components/admin/CategoryManager';
import TableManager from '@/components/admin/TableManager';
import DishTypeManager from '@/components/admin/DishTypeManager';

type AdminTab = 'categories' | 'tables' | 'dishes';

export default function AdminManagement() {
  const { adminName, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('categories');

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };
  
  const tabs = [
    { id: 'categories', label: 'Catégories', icon: Tags },
    { id: 'tables', label: 'Tables', icon: Utensils },
    { id: 'dishes', label: 'Types de Plat', icon: UtensilsCrossed },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Tableau de Bord</h1>
          <p className="text-gray-500">Connecté en tant que: {adminName}</p>
        </div>
        <button 
          onClick={handleLogout} 
          className="flex items-center space-x-2 px-4 py-2 rounded-lg text-secondary bg-secondary/10 hover:bg-secondary/20 transition-colors"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </header>

      <div className="p-4 md:p-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="-ml-0.5 mr-2 h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div>
          {activeTab === 'categories' && <CategoryManager />}
          {activeTab === 'tables' && <TableManager />}
          {activeTab === 'dishes' && <DishTypeManager />}
        </div>
      </div>
    </div>
  );
}
