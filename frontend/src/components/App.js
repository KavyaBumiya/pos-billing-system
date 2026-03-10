import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { ShoppingCart, Package, Tag, Settings, BarChart2, FileText } from 'lucide-react';
import '../styles/index.css';
import BillingPage from './billing/BillingPage';
import ProductsPage from './products/ProductsPage';
import CategoriesPage from './categories/CategoriesPage';
import SettingsPage from './settings/SettingsPage';
import DashboardPage from './common/DashboardPage';
import BillsHistoryPage from './billing/BillsHistoryPage';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'billing', label: 'New Bill', icon: ShoppingCart },
  { id: 'bills', label: 'Bill History', icon: FileText },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function App() {
  const [page, setPage] = useState('billing');
  const [shopName, setShopName] = useState('Bumiya Milk Suppliers');

  useEffect(() => {
    fetch('http://localhost:5000/api/settings')
      .then(r => r.json())
      .then(s => { if (s.shop_name) setShopName(s.shop_name); })
      .catch(() => {});
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage />;
      case 'billing': return <BillingPage />;
      case 'bills': return <BillsHistoryPage />;
      case 'products': return <ProductsPage />;
      case 'categories': return <CategoriesPage />;
      case 'settings': return <SettingsPage onSave={(name) => name && setShopName(name)} />;
      default: return <BillingPage />;
    }
  };

  return (
    <div className="app-layout">
      <Toaster position="top-right" toastOptions={{ className: 'toast', duration: 3000 }} />
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>🥛 {shopName}</h2>
          <p>POS Billing System</p>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? 'active' : ''}`}
              onClick={() => setPage(id)}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          v1.0.0 • Bumiya POS
        </div>
      </aside>
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
