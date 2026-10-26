import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginView } from './views/LoginView';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { PosView } from './views/PosView';
import { AuditLogView } from './views/AuditLogView';
import { SalesHistoryView } from './views/SalesHistoryView';
import { UserManagementView } from './views/UserManagementView';
import { WarrantyRmaView } from './views/WarrantyRmaView';
import { ItemModal } from './components/ItemModal';
import { StockAdjustModal } from './components/StockAdjustModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ReceiptModal } from './components/ReceiptModal';
import { Item, SaleRecord } from './types';
import { Header } from './components/Header';

function MainApp() {
  const { currentUser } = useApp();

  // Navigation tab state (starts at Store Overview Dashboard)
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'inventory' | 'pos' | 'warranty' | 'logs' | 'sales' | 'users'
  >('dashboard');

  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockItem, setStockItem] = useState<Item | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);

  const [activeReceipt, setActiveReceipt] = useState<SaleRecord | null>(null);
  const [posInitialItem, setPosInitialItem] = useState<Item | null>(null);

  // If no active session, render dedicated login screen
  if (!currentUser) {
    return <LoginView />;
  }

  const isAdmin = currentUser.role === 'Admin';

  // Handlers
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleAdjustStock = (item: Item) => {
    setStockItem(item);
    setIsStockModalOpen(true);
  };

  const handleDeleteItem = (item: Item) => {
    if (!isAdmin) return;
    setDeletingItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleSendToPos = (item: Item) => {
    setPosInitialItem(item);
    setCurrentTab('pos');
  };

  const handleSaleCompleted = (sale: SaleRecord) => {
    setActiveReceipt(sale);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row selection:bg-blue-500/20 selection:text-blue-600 dark:selection:text-blue-300">
      
      {/* 1. Left Side Menu (Desktop Sidebar + Mobile Drawer) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar with Sliding Theme Switcher (Desktop + Mobile) */}
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNavigateHome={() => setCurrentTab('dashboard')}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentTab}
              onOpenAddItem={handleOpenAddItem}
              onViewReceipt={(sale) => setActiveReceipt(sale)}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryView
              onOpenAddItem={handleOpenAddItem}
              onEditItem={handleEditItem}
              onAdjustStock={handleAdjustStock}
              onDeleteItem={handleDeleteItem}
              onSendToPos={handleSendToPos}
            />
          )}

          {currentTab === 'pos' && (
            <PosView
              onSaleCompleted={handleSaleCompleted}
              initialCartItem={posInitialItem}
              onClearInitialCartItem={() => setPosInitialItem(null)}
            />
          )}

          {currentTab === 'sales' && (
            <SalesHistoryView onViewReceipt={(sale) => setActiveReceipt(sale)} />
          )}

          {currentTab === 'warranty' && (
            <WarrantyRmaView onOpenReceipt={(sale) => setActiveReceipt(sale)} />
          )}

          {currentTab === 'logs' && (
            isAdmin ? (
              <AuditLogView />
            ) : (
              <DashboardView
                onNavigate={setCurrentTab}
                onOpenAddItem={handleOpenAddItem}
                onViewReceipt={(sale) => setActiveReceipt(sale)}
              />
            )
          )}

          {currentTab === 'users' && (
            isAdmin ? (
              <UserManagementView />
            ) : (
              <DashboardView
                onNavigate={setCurrentTab}
                onOpenAddItem={handleOpenAddItem}
                onViewReceipt={(sale) => setActiveReceipt(sale)}
              />
            )
          )}
        </main>

      </div>

      {/* Global Modals */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        editItem={editingItem}
      />

      <StockAdjustModal
        item={stockItem}
        onClose={() => {
          setIsStockModalOpen(false);
          setStockItem(null);
        }}
      />

      <DeleteConfirmModal
        item={deletingItem}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingItem(null);
        }}
      />

      <ReceiptModal
        sale={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
