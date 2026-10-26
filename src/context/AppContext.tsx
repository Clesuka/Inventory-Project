import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Item,
  UserAccount,
  UserRole,
  SaleRecord,
  AuditLog,
  AuditFieldDiff,
  PaymentMethod,
  ItemSerialNumber,
  SerialStatus,
  RmaRecord,
  RmaStatus,
  SoldSerialInfo,
} from '../types';
import {
  SEED_ACCOUNTS,
  SEED_ITEMS,
  SEED_LOGS,
  SEED_RMAS,
  SEED_SALES,
} from '../data/seedData';
import { formatIDR } from '../utils/formatters';

export const DEFAULT_CATEGORIES: string[] = [
  'GPU',
  'CPU',
  'Motherboard',
  'RAM',
  'Storage',
  'Power Supply',
  'Case',
  'Cooling',
  'Peripherals',
  'Accessories',
];

interface AppContextType {
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Authentication & Active Session
  currentUser: UserAccount | null;
  login: (userId: string, password: string) => { success: boolean; error?: string };
  logout: () => void;

  // User Accounts Management (Admin Only)
  accounts: UserAccount[];
  createUser: (userData: {
    userId: string;
    name: string;
    role: UserRole;
    password: string;
    email?: string;
  }) => { success: boolean; error?: string };
  updateUser: (
    id: string,
    updates: Partial<{
      userId: string;
      name: string;
      role: UserRole;
      password: string;
      email: string;
    }>
  ) => { success: boolean; error?: string };
  deleteUser: (id: string) => { success: boolean; error?: string };

  // Categories (Admin & Staff)
  categories: string[];
  addCategory: (name: string) => { success: boolean; error?: string };
  updateCategory: (oldName: string, newName: string) => { success: boolean; error?: string; affectedItemsCount?: number };
  deleteCategory: (name: string) => { success: boolean; error?: string };

  // Inventory Items CRUD
  items: Item[];
  addItem: (
    itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'lastModifiedBy'>
  ) => Item;
  updateItem: (
    id: string,
    updates: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'lastModifiedBy'>>,
    note?: string
  ) => void;
  deleteItem: (id: string, reason?: string) => { success: boolean; error?: string };
  adjustStock: (id: string, newStock: number, reason: string) => void;
  addItemNote: (itemId: string, note: string) => { success: boolean; error?: string };

  // Serial Numbers & Unit Tracking
  addSerialNumbers: (
    itemId: string,
    serials: string[],
    warrantyMonths?: number
  ) => { success: boolean; added: number; error?: string };
  updateSerialStatus: (
    itemId: string,
    serialId: string,
    status: SerialStatus,
    notes?: string
  ) => { success: boolean; error?: string };
  deleteSerialNumber: (
    itemId: string,
    serialId: string
  ) => { success: boolean; error?: string };
  lookupSerial: (
    serialNumber: string
  ) => {
    serial?: ItemSerialNumber;
    item?: Item;
    sale?: SaleRecord;
    rma?: RmaRecord;
  };

  // Warranty & RMA Management
  rmas: RmaRecord[];
  createRma: (data: {
    serialNumber: string;
    issueDescription: string;
    customerName: string;
    customerPhone?: string;
    initialStatus?: RmaStatus;
    notes?: string;
  }) => { success: boolean; rma?: RmaRecord; error?: string };
  resolveRma: (
    rmaId: string,
    resolution: {
      status: RmaStatus;
      actionTaken: 'REPLACEMENT' | 'REFUND' | 'REPAIR' | 'REJECT';
      replacementSerialId?: string;
      replacementSerialNumber?: string;
      refundAmount?: number;
      notes?: string;
    }
  ) => { success: boolean; error?: string };

  // Sales System (Admin and Staff)
  sales: SaleRecord[];
  completeSale: (saleData: {
    cartItems: {
      item: Item;
      quantity: number;
      unitPrice: number;
      selectedSerials?: string[];
    }[];
    overrideTotal?: number;
    overrideReason?: string;
    paymentMethod: PaymentMethod;
    customerName?: string;
    customerPhone?: string;
  }) => SaleRecord;

  // Audit Logs (Admin viewing)
  auditLogs: AuditLog[];
  clearLogs: () => void;

  // Cloud sync
  isCloudConnected: boolean;

  // Global utilities
  resetDataToSeed: () => void;
  exportDataJson: () => void;
  exportInventoryCsv: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: 'rf_theme_v2',
  CURRENT_USER: 'rf_current_user_v2',
  ACCOUNTS: 'rf_accounts_v2',
  CATEGORIES: 'rf_categories_v2',
  ITEMS: 'rf_items_v2',
  SALES: 'rf_sales_v2',
  LOGS: 'rf_logs_v2',
  RMAS: 'rf_rmas_v2',
};

const AVATAR_COLORS = [
  'from-blue-600 to-indigo-600',
  'from-emerald-600 to-teal-600',
  'from-amber-600 to-orange-600',
  'from-violet-600 to-purple-600',
  'from-rose-600 to-pink-600',
  'from-cyan-600 to-blue-600',
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Accounts state (Admin created & managed)
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return saved ? JSON.parse(saved) : SEED_ACCOUNTS;
    } catch {
      return SEED_ACCOUNTS;
    }
  });

  // Current logged in user (session)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verify user still exists in accounts
        const matched = accounts.find((a) => a.id === parsed.id && a.userId === parsed.userId);
        return matched || null;
      }
      return null; // Start at login screen
    } catch {
      return null;
    }
  });

  // Inventory items
  const [items, setItems] = useState<Item[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ITEMS);
      return saved ? JSON.parse(saved) : SEED_ITEMS;
    } catch {
      return SEED_ITEMS;
    }
  });

  // Categories (Dynamic, manageable by Admin and Staff)
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  // Sales records
  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      return saved ? JSON.parse(saved) : SEED_SALES;
    } catch {
      return SEED_SALES;
    }
  });

  // Warranty & RMA Claims
  const [rmas, setRmas] = useState<RmaRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RMAS);
      return saved ? JSON.parse(saved) : SEED_RMAS;
    } catch {
      return SEED_RMAS;
    }
  });

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : SEED_LOGS;
    } catch {
      return SEED_LOGS;
    }
  });

  // Storage sync
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.error(e);
    }
  }, [accounts]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error(e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    } catch (e) {
      console.error(e);
    }
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RMAS, JSON.stringify(rmas));
    } catch (e) {
      console.error(e);
    }
  }, [rmas]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
    } catch (e) {
      console.error(e);
    }
  }, [auditLogs]);

  // Cloud sync state & helpers
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  const syncDoc = (collectionName: string, id: string, data: any) => {
    try {
      const sanitized = JSON.parse(JSON.stringify(data));
      setDoc(doc(db, collectionName, id), sanitized).catch((err) => {
        console.warn(`Firestore sync error on ${collectionName}/${id}:`, err);
        handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${id}`);
      });
    } catch (e) {
      console.warn('Sanitization error on Firestore write:', e);
    }
  };

  const deleteDocById = (collectionName: string, id: string) => {
    try {
      deleteDoc(doc(db, collectionName, id)).catch((err) => {
        console.warn(`Firestore delete error on ${collectionName}/${id}:`, err);
        handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
      });
    } catch (e) {
      console.warn('Error on Firestore delete:', e);
    }
  };

  // Real-time Firestore synchronization
  useEffect(() => {
    const unsubItems = onSnapshot(
      collection(db, 'items'),
      (snapshot) => {
        if (snapshot.empty) {
          SEED_ITEMS.forEach((item) => {
            syncDoc('items', item.id, item);
          });
        } else {
          const loaded = snapshot.docs.map((d) => d.data() as Item);
          setItems(loaded);
        }
        setIsCloudConnected(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'items');
      }
    );

    const unsubSales = onSnapshot(
      collection(db, 'sales'),
      (snapshot) => {
        if (snapshot.empty) {
          SEED_SALES.forEach((sale) => {
            syncDoc('sales', sale.id, sale);
          });
        } else {
          const loaded = snapshot.docs.map((d) => d.data() as SaleRecord);
          loaded.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setSales(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'sales');
      }
    );

    const unsubRmas = onSnapshot(
      collection(db, 'rmas'),
      (snapshot) => {
        if (snapshot.empty) {
          SEED_RMAS.forEach((rma) => {
            syncDoc('rmas', rma.id, rma);
          });
        } else {
          const loaded = snapshot.docs.map((d) => d.data() as RmaRecord);
          loaded.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
          setRmas(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'rmas');
      }
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (snapshot.empty) {
          SEED_ACCOUNTS.forEach((acc) => {
            syncDoc('users', acc.id, acc);
          });
        } else {
          const loaded = snapshot.docs.map((d) => d.data() as UserAccount);
          setAccounts(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'users');
      }
    );

    const unsubLogs = onSnapshot(
      collection(db, 'logs'),
      (snapshot) => {
        if (snapshot.empty) {
          SEED_LOGS.forEach((log) => {
            syncDoc('logs', log.id, log);
          });
        } else {
          const loaded = snapshot.docs.map((d) => d.data() as AuditLog);
          loaded.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setAuditLogs(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'logs');
      }
    );

    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        if (snapshot.empty) {
          DEFAULT_CATEGORIES.forEach((cat) => {
            syncDoc('categories', cat, { id: cat, name: cat });
          });
        } else {
          const loaded = snapshot.docs.map((d) => (d.data() as { name: string }).name || d.id);
          setCategories(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'categories');
      }
    );

    return () => {
      unsubItems();
      unsubSales();
      unsubRmas();
      unsubUsers();
      unsubLogs();
      unsubCategories();
    };
  }, []);

  // LOGIN via User ID & Password
  const login = (userId: string, password: string): { success: boolean; error?: string } => {
    const cleanId = userId.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'Please enter both User ID and Password.' };
    }

    const matched = accounts.find(
      (acc) => acc.userId.toLowerCase() === cleanId && acc.password === cleanPass
    );

    if (!matched) {
      return { success: false, error: 'Invalid User ID or Password. Check your credentials.' };
    }

    setCurrentUser(matched);
    return { success: true };
  };

  // LOGOUT: Clears active session and returns to login gate
  const logout = () => {
    setCurrentUser(null);
  };

  // USER MANAGEMENT: Create User (Admin Only)
  const createUser = (userData: {
    userId: string;
    name: string;
    role: UserRole;
    password: string;
    email?: string;
  }): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'Admin') {
      return { success: false, error: 'Only Administrators can create accounts.' };
    }

    const cleanUserId = userData.userId.trim().toLowerCase();
    if (!cleanUserId) {
      return { success: false, error: 'User ID is required.' };
    }

    if (accounts.some((a) => a.userId.toLowerCase() === cleanUserId)) {
      return { success: false, error: `User ID "${cleanUserId}" is already taken.` };
    }

    if (!userData.password.trim()) {
      return { success: false, error: 'A secure password is required.' };
    }

    if (!userData.name.trim()) {
      return { success: false, error: 'Full name is required.' };
    }

    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      userId: cleanUserId,
      name: userData.name.trim(),
      role: userData.role,
      password: userData.password.trim(),
      email: userData.email?.trim() || `${cleanUserId}@rigforge.io`,
      avatarColor: randomColor,
      createdAt: new Date().toISOString(),
    };

    setAccounts((prev) => [...prev, newUser]);

    // Audit log
    const now = new Date().toISOString();
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'CREATE_USER',
      entityType: 'USER',
      entityId: newUser.id,
      entityName: `${newUser.name} (${newUser.userId})`,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      details: `Created new ${newUser.role} account "${newUser.name}" with User ID "${newUser.userId}"`,
      diff: [
        { field: 'userId', from: '', to: newUser.userId },
        { field: 'role', from: '', to: newUser.role },
      ],
    };
    setAuditLogs((prev) => [log, ...prev]);
    syncDoc('users', newUser.id, newUser);
    syncDoc('logs', log.id, log);

    return { success: true };
  };

  // USER MANAGEMENT: Update User (Admin Only)
  const updateUser = (
    id: string,
    updates: Partial<{
      userId: string;
      name: string;
      role: UserRole;
      password: string;
      email: string;
    }>
  ): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'Admin') {
      return { success: false, error: 'Only Administrators can edit accounts.' };
    }

    const target = accounts.find((a) => a.id === id);
    if (!target) {
      return { success: false, error: 'Account not found.' };
    }

    // Check unique userId if changed
    if (updates.userId && updates.userId.toLowerCase() !== target.userId.toLowerCase()) {
      const cleanNewId = updates.userId.trim().toLowerCase();
      if (accounts.some((a) => a.id !== id && a.userId.toLowerCase() === cleanNewId)) {
        return { success: false, error: `User ID "${cleanNewId}" is already taken.` };
      }
      updates.userId = cleanNewId;
    }

    // Safeguard: Do not demote the last remaining Admin to Staff!
    if (target.role === 'Admin' && updates.role === 'Staff') {
      const otherAdmins = accounts.filter((a) => a.role === 'Admin' && a.id !== id);
      if (otherAdmins.length === 0) {
        return {
          success: false,
          error: 'Cannot demote the only remaining Administrator. System must have at least one Admin.',
        };
      }
    }

    const diffs: AuditFieldDiff[] = [];
    if (updates.name && updates.name !== target.name) {
      diffs.push({ field: 'name', from: target.name, to: updates.name });
    }
    if (updates.role && updates.role !== target.role) {
      diffs.push({ field: 'role', from: target.role, to: updates.role });
    }
    if (updates.userId && updates.userId !== target.userId) {
      diffs.push({ field: 'userId', from: target.userId, to: updates.userId });
    }
    if (updates.password && updates.password !== target.password) {
      diffs.push({ field: 'password', from: '********', to: '******** (updated)' });
    }

    const updatedAcc: UserAccount = {
      ...target,
      ...updates,
      name: updates.name ? updates.name.trim() : target.name,
      userId: updates.userId ? updates.userId.trim().toLowerCase() : target.userId,
      password: updates.password ? updates.password.trim() : target.password,
    };

    setAccounts((prev) => prev.map((a) => (a.id === id ? updatedAcc : a)));

    // If updating current user, refresh active session
    if (currentUser.id === id) {
      setCurrentUser(updatedAcc);
    }

    // Audit log
    const now = new Date().toISOString();
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'UPDATE_USER',
      entityType: 'USER',
      entityId: target.id,
      entityName: `${target.name} (${target.userId})`,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      details: `Updated account settings for ${target.name} (${target.userId})`,
      diff: diffs,
    };
    setAuditLogs((prev) => [log, ...prev]);
    syncDoc('users', updatedAcc.id, updatedAcc);
    syncDoc('logs', log.id, log);

    return { success: true };
  };

  // USER MANAGEMENT: Delete User (Admin Only, including other admins)
  const deleteUser = (id: string): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'Admin') {
      return { success: false, error: 'Only Administrators can delete accounts.' };
    }

    const target = accounts.find((a) => a.id === id);
    if (!target) {
      return { success: false, error: 'Account not found.' };
    }

    // Safeguard: cannot delete the only remaining admin!
    if (target.role === 'Admin') {
      const adminCount = accounts.filter((a) => a.role === 'Admin').length;
      if (adminCount <= 1) {
        return {
          success: false,
          error: 'Cannot delete the only remaining Administrator. System must have at least one active Admin.',
        };
      }
    }

    // If deleting currently logged-in account, confirm and logout
    const isSelf = currentUser.id === id;

    setAccounts((prev) => prev.filter((a) => a.id !== id));

    const now = new Date().toISOString();
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'DELETE_USER',
      entityType: 'USER',
      entityId: target.id,
      entityName: `${target.name} (${target.userId})`,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      details: `Deleted account for "${target.name}" (${target.userId}, Role: ${target.role})`,
      diff: [{ field: 'status', from: 'Active Account', to: 'Deleted' }],
    };
    setAuditLogs((prev) => [log, ...prev]);
    deleteDocById('users', id);
    syncDoc('logs', log.id, log);

    if (isSelf) {
      setCurrentUser(null);
    }

    return { success: true };
  };

  // CATEGORIES MANAGEMENT: Add Category (Both Admin and Staff permitted)
  const addCategory = (name: string): { success: boolean; error?: string } => {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: 'Category name cannot be empty.' };
    }
    if (trimmed.length > 40) {
      return { success: false, error: 'Category name is too long (maximum 40 characters).' };
    }
    const exists = categories.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      return { success: false, error: `Category "${trimmed}" already exists.` };
    }

    setCategories((prev) => [...prev, trimmed]);
    syncDoc('categories', trimmed, { id: trimmed, name: trimmed });

    if (currentUser) {
      const now = new Date().toISOString();
      const log: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: now,
        action: 'CREATE_CATEGORY',
        entityType: 'CATEGORY',
        entityId: `cat-${Date.now()}`,
        entityName: trimmed,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        details: `Added new hardware category "${trimmed}"`,
      };
      setAuditLogs((prev) => [log, ...prev]);
      syncDoc('logs', log.id, log);
    }

    return { success: true };
  };

  // CATEGORIES MANAGEMENT: Update / Rename Category (Both Admin and Staff permitted)
  const updateCategory = (
    oldName: string,
    newName: string
  ): { success: boolean; error?: string; affectedItemsCount?: number } => {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();

    if (!trimmedNew) {
      return { success: false, error: 'Category name cannot be empty.' };
    }
    if (trimmedNew.length > 40) {
      return { success: false, error: 'Category name is too long (maximum 40 characters).' };
    }

    const existingOld = categories.find((c) => c.toLowerCase() === trimmedOld.toLowerCase());
    if (!existingOld) {
      return { success: false, error: `Category "${oldName}" does not exist.` };
    }

    if (existingOld === trimmedNew) {
      return { success: true, affectedItemsCount: 0 };
    }

    // Check if new name is already taken by another category
    const isDuplicate = categories.some(
      (c) => c.toLowerCase() === trimmedNew.toLowerCase() && c.toLowerCase() !== trimmedOld.toLowerCase()
    );
    if (isDuplicate) {
      return { success: false, error: `Category "${trimmedNew}" already exists.` };
    }

    const now = new Date().toISOString();
    const operatorName = currentUser ? currentUser.name : 'System';

    // 1. Update categories list
    setCategories((prev) =>
      prev.map((c) => (c.toLowerCase() === trimmedOld.toLowerCase() ? trimmedNew : c))
    );

    // 2. Cascade rename across all inventory items assigned to this category
    const itemsToUpdate: Item[] = [];
    setItems((prev) =>
      prev.map((item) => {
        if (item.category.trim().toLowerCase() === trimmedOld.toLowerCase()) {
          const updatedItem: Item = {
            ...item,
            category: trimmedNew,
            updatedAt: now,
            lastModifiedBy: operatorName,
          };
          itemsToUpdate.push(updatedItem);
          return updatedItem;
        }
        return item;
      })
    );

    // 3. Firestore persistence: Remove old category doc, create new doc, and sync updated items
    deleteDocById('categories', existingOld);
    syncDoc('categories', trimmedNew, { id: trimmedNew, name: trimmedNew });
    itemsToUpdate.forEach((item) => {
      syncDoc('items', item.id, item);
    });

    // 4. Audit Log
    if (currentUser) {
      const log: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: now,
        action: 'UPDATE_CATEGORY',
        entityType: 'CATEGORY',
        entityId: `cat-${Date.now()}`,
        entityName: trimmedNew,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        details: `Renamed category from "${existingOld}" to "${trimmedNew}" (${itemsToUpdate.length} item(s) automatically reclassified)`,
        diff: [
          { field: 'name', from: existingOld, to: trimmedNew },
          { field: 'affectedItems', from: 0, to: itemsToUpdate.length },
        ],
      };
      setAuditLogs((prev) => [log, ...prev]);
      syncDoc('logs', log.id, log);
    }

    return { success: true, affectedItemsCount: itemsToUpdate.length };
  };

  // CATEGORIES MANAGEMENT: Delete Category (Both Admin and Staff permitted, protected by item safeguard)
  const deleteCategory = (categoryName: string): { success: boolean; error?: string } => {
    const trimmed = categoryName.trim();
    const existing = categories.find((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (!existing) {
      return { success: false, error: `Category "${categoryName}" does not exist.` };
    }

    // Safeguard: Check if any active items belong to this category
    const assignedItems = items.filter(
      (item) => item.category.trim().toLowerCase() === existing.toLowerCase()
    );
    if (assignedItems.length > 0) {
      return {
        success: false,
        error: `Cannot delete "${existing}": ${assignedItems.length} item(s) are currently assigned to this category. Please reassign or delete those items first.`,
      };
    }

    setCategories((prev) => prev.filter((c) => c.toLowerCase() !== existing.toLowerCase()));
    deleteDocById('categories', existing);

    if (currentUser) {
      const now = new Date().toISOString();
      const log: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: now,
        action: 'DELETE_CATEGORY',
        entityType: 'CATEGORY',
        entityId: `cat-${Date.now()}`,
        entityName: existing,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        details: `Deleted category "${existing}" (had 0 items assigned)`,
      };
      setAuditLogs((prev) => [log, ...prev]);
      syncDoc('logs', log.id, log);
    }

    return { success: true };
  };

  // INVENTORY: Add Item (Both Admin and Staff permitted)
  const addItem = (
    itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'lastModifiedBy'>
  ): Item => {
    const operatorName = currentUser ? currentUser.name : 'System';
    const operatorId = currentUser ? currentUser.id : 'usr-system';
    const operatorRole = currentUser ? currentUser.role : 'Staff';

    const now = new Date().toISOString();
    const newItem: Item = {
      ...itemData,
      id: `item-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      lastModifiedBy: operatorName,
    };

    setItems((prev) => [newItem, ...prev]);

    const diffs: AuditFieldDiff[] = [
      { field: 'brand', from: '', to: newItem.brand },
      { field: 'category', from: '', to: newItem.category },
      { field: 'sku', from: '', to: newItem.sku },
      { field: 'sellPrice', from: 0, to: newItem.sellPrice },
      { field: 'stock', from: 0, to: newItem.stock },
      { field: 'size', from: '', to: newItem.size },
      { field: 'color', from: '', to: newItem.color },
    ];

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'CREATE_ITEM',
      entityType: 'ITEM',
      entityId: newItem.id,
      entityName: newItem.name,
      operatorId,
      operatorName,
      operatorRole,
      details: `Added new item "${newItem.name}" (${newItem.category}) with initial stock of ${newItem.stock}`,
      diff: diffs,
    };
    setAuditLogs((prev) => [log, ...prev]);
    syncDoc('items', newItem.id, newItem);
    syncDoc('logs', log.id, log);

    return newItem;
  };

  // INVENTORY: Update Item
  const updateItem = (
    id: string,
    updates: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'lastModifiedBy'>>,
    note?: string
  ) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;

    const operatorName = currentUser ? currentUser.name : 'System';
    const operatorId = currentUser ? currentUser.id : 'usr-system';
    const operatorRole = currentUser ? currentUser.role : 'Staff';

    const diffs: AuditFieldDiff[] = [];
    (Object.keys(updates) as (keyof typeof updates)[]).forEach((key) => {
      if (updates[key] !== undefined && updates[key] !== target[key]) {
        const valFrom = target[key];
        const valTo = updates[key];
        if (typeof valFrom === 'object' || typeof valTo === 'object') {
          diffs.push({
            field: String(key),
            from: Array.isArray(valFrom) ? `${valFrom.length} entries` : JSON.stringify(valFrom ?? ''),
            to: Array.isArray(valTo) ? `${valTo.length} entries` : JSON.stringify(valTo ?? ''),
          });
        } else {
          diffs.push({
            field: String(key),
            from: valFrom !== undefined ? (valFrom as string | number | boolean) : '',
            to: valTo as string | number | boolean,
          });
        }
      }
    });

    if (diffs.length === 0) return;

    const now = new Date().toISOString();
    const updatedItem: Item = {
      ...target,
      ...updates,
      updatedAt: now,
      lastModifiedBy: operatorName,
    };

    setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'UPDATE_ITEM',
      entityType: 'ITEM',
      entityId: target.id,
      entityName: target.name,
      operatorId,
      operatorName,
      operatorRole,
      details: note || `Updated ${diffs.length} attribute(s) for "${target.name}"`,
      diff: diffs,
    };
    setAuditLogs((prev) => [log, ...prev]);
    syncDoc('items', updatedItem.id, updatedItem);
    syncDoc('logs', log.id, log);
  };

  // INVENTORY: Delete Item (ADMIN ONLY!)
  const deleteItem = (id: string, reason?: string): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'Admin') {
      return { success: false, error: 'Permission denied: Only Administrators can delete catalog items.' };
    }

    const target = items.find((i) => i.id === id);
    if (!target) {
      return { success: false, error: 'Item not found.' };
    }

    setItems((prev) => prev.filter((i) => i.id !== id));

    const now = new Date().toISOString();
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'DELETE_ITEM',
      entityType: 'ITEM',
      entityId: target.id,
      entityName: target.name,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      details: reason
        ? `Deleted item "${target.name}" (${target.sku}). Reason: ${reason}`
        : `Deleted item "${target.name}" (${target.sku}) from catalog`,
      diff: [
        { field: 'stock', from: target.stock, to: 0 },
        { field: 'status', from: 'Active in Catalog', to: 'Deleted' },
      ],
    };
    setAuditLogs((prev) => [log, ...prev]);
    deleteDocById('items', id);
    syncDoc('logs', log.id, log);

    return { success: true };
  };

  // INVENTORY: Adjust Stock (Both Admin and Staff permitted)
  const adjustStock = (id: string, newStock: number, reason: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;

    const operatorName = currentUser ? currentUser.name : 'System';
    const operatorId = currentUser ? currentUser.id : 'usr-system';
    const operatorRole = currentUser ? currentUser.role : 'Staff';

    const delta = newStock - target.stock;
    if (delta === 0) return;

    const now = new Date().toISOString();
    const updatedStockItem = {
      ...target,
      stock: newStock,
      updatedAt: now,
      lastModifiedBy: operatorName,
    };
    setItems((prev) => prev.map((i) => (i.id === id ? updatedStockItem : i)));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'STOCK_ADJUSTMENT',
      entityType: 'ITEM',
      entityId: target.id,
      entityName: target.name,
      operatorId,
      operatorName,
      operatorRole,
      details: `Stock ${delta > 0 ? 'increased' : 'decreased'} by ${Math.abs(delta)} (${target.stock} -> ${newStock}). Note: ${reason || 'Physical count adjustment'}`,
      diff: [{ field: 'stock', from: target.stock, to: newStock }],
    };
    setAuditLogs((prev) => [log, ...prev]);
    syncDoc('items', id, updatedStockItem);
    syncDoc('logs', log.id, log);
  };

  // INVENTORY: Add Note to Item Log
  const addItemNote = (itemId: string, note: string): { success: boolean; error?: string } => {
    const trimmed = note.trim();
    if (!trimmed) {
      return { success: false, error: 'Note cannot be empty.' };
    }

    const target = items.find((i) => i.id === itemId);
    if (!target) {
      return { success: false, error: 'Item not found.' };
    }

    const operatorName = currentUser ? currentUser.name : 'System';
    const operatorId = currentUser ? currentUser.id : 'usr-system';
    const operatorRole = currentUser ? currentUser.role : 'Staff';
    const now = new Date().toISOString();

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'NOTE_ADDED',
      entityType: 'ITEM',
      entityId: target.id,
      entityName: target.name,
      operatorId,
      operatorName,
      operatorRole,
      details: trimmed,
    };

    setAuditLogs((prev) => [log, ...prev]);
    syncDoc('logs', log.id, log);
    return { success: true };
  };

  // SERIAL NUMBERS: Batch Add Serials
  const addSerialNumbers = (
    itemId: string,
    serials: string[],
    warrantyMonths?: number
  ): { success: boolean; added: number; error?: string } => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) {
      return { success: false, added: 0, error: 'Item not found in catalog.' };
    }

    const cleanSerials = Array.from(
      new Set(
        serials
          .map((s) => s.trim().toUpperCase())
          .filter((s) => s.length > 0)
      )
    );

    if (cleanSerials.length === 0) {
      return { success: false, added: 0, error: 'No valid serial numbers provided.' };
    }

    // Check for existing duplicates across all items
    const existingSerialMap = new Set<string>();
    items.forEach((item) => {
      item.serialNumbers?.forEach((sn) => existingSerialMap.add(sn.serialNumber.toUpperCase()));
    });

    const duplicates = cleanSerials.filter((s) => existingSerialMap.has(s));
    if (duplicates.length > 0) {
      return {
        success: false,
        added: 0,
        error: `Serial number(s) already exist in database: ${duplicates.slice(0, 3).join(', ')}${
          duplicates.length > 3 ? '...' : ''
        }`,
      };
    }

    const now = new Date().toISOString();
    const operatorName = currentUser ? currentUser.name : 'System';
    const operatorId = currentUser ? currentUser.id : 'usr-system';
    const operatorRole = currentUser ? currentUser.role : 'Staff';
    const wMonths = warrantyMonths || targetItem.defaultWarrantyMonths || 12;

    const newSerialObjects: ItemSerialNumber[] = cleanSerials.map((sn, idx) => ({
      id: `sn-${itemId}-${Date.now()}-${idx}`,
      itemId,
      serialNumber: sn,
      status: 'IN_STOCK',
      warrantyMonths: wMonths,
      purchaseDate: now,
    }));

    const currentSerials = targetItem.serialNumbers || [];
    const combinedSerials = [...currentSerials, ...newSerialObjects];
    const inStockCount = combinedSerials.filter((s) => s.status === 'IN_STOCK').length;

    const updatedItem: Item = {
      ...targetItem,
      hasSerials: true,
      defaultWarrantyMonths: wMonths,
      serialNumbers: combinedSerials,
      stock: inStockCount,
      updatedAt: now,
      lastModifiedBy: operatorName,
    };

    setItems((prev) => prev.map((item) => (item.id === itemId ? updatedItem : item)));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'ADD_SERIAL',
      entityType: 'SERIAL',
      entityId: itemId,
      entityName: `${targetItem.name} (${cleanSerials.length} S/N)`,
      operatorId,
      operatorName,
      operatorRole,
      details: `Registered ${cleanSerials.length} new serial number(s) [${cleanSerials.slice(0, 3).join(', ')}${
        cleanSerials.length > 3 ? ` +${cleanSerials.length - 3} more` : ''
      }] with ${wMonths}-month warranty.`,
      diff: [{ field: 'serialCount', from: targetItem.serialNumbers?.length || 0, to: (targetItem.serialNumbers?.length || 0) + cleanSerials.length }],
    };
    setAuditLogs((prev) => [log, ...prev]);
    syncDoc('items', itemId, updatedItem);
    syncDoc('logs', log.id, log);

    return { success: true, added: cleanSerials.length };
  };

  // SERIAL NUMBERS: Update Individual Serial Status
  const updateSerialStatus = (
    itemId: string,
    serialId: string,
    status: SerialStatus,
    notes?: string
  ): { success: boolean; error?: string } => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return { success: false, error: 'Item not found.' };

    const serial = targetItem.serialNumbers?.find((s) => s.id === serialId);
    if (!serial) return { success: false, error: 'Serial number not found.' };

    const now = new Date().toISOString();
    const operatorName = currentUser ? currentUser.name : 'System';
    const operatorId = currentUser ? currentUser.id : 'usr-system';
    const operatorRole = currentUser ? currentUser.role : 'Staff';
    const prevStatus = serial.status;

    const updatedSerials = (targetItem.serialNumbers || []).map((s) =>
      s.id === serialId ? { ...s, status, notes: notes || s.notes } : s
    );
    const inStockCount = updatedSerials.filter((s) => s.status === 'IN_STOCK').length;
    const updatedItem: Item = {
      ...targetItem,
      serialNumbers: updatedSerials,
      stock: inStockCount,
      updatedAt: now,
      lastModifiedBy: operatorName,
    };

    setItems((prev) => prev.map((item) => (item.id === itemId ? updatedItem : item)));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'UPDATE_SERIAL',
      entityType: 'SERIAL',
      entityId: serial.id,
      entityName: `${targetItem.name} (${serial.serialNumber})`,
      operatorId,
      operatorName,
      operatorRole,
      details: `Status of S/N ${serial.serialNumber} transitioned from ${prevStatus} to ${status}.${
        notes ? ` Note: "${notes}"` : ''
      }`,
      diff: [{ field: 'status', from: prevStatus, to: status }],
    };
    setAuditLogs((prev) => [log, ...prev]);
    syncDoc('items', itemId, updatedItem);
    syncDoc('logs', log.id, log);

    return { success: true };
  };

  // SERIAL NUMBERS: Delete Serial Number
  const deleteSerialNumber = (
    itemId: string,
    serialId: string
  ): { success: boolean; error?: string } => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return { success: false, error: 'Item not found.' };

    const serial = targetItem.serialNumbers?.find((s) => s.id === serialId);
    if (!serial) return { success: false, error: 'Serial number not found.' };

    if (serial.status === 'SOLD') {
      return {
        success: false,
        error: 'Cannot delete a sold serial number. Use RMA / Return workflow instead.',
      };
    }

    const now = new Date().toISOString();
    const operatorName = currentUser ? currentUser.name : 'System';
    const operatorId = currentUser ? currentUser.id : 'usr-system';
    const operatorRole = currentUser ? currentUser.role : 'Staff';

    const filtered = (targetItem.serialNumbers || []).filter((s) => s.id !== serialId);
    const inStockCount = filtered.filter((s) => s.status === 'IN_STOCK').length;
    const updatedItem: Item = {
      ...targetItem,
      serialNumbers: filtered,
      stock: inStockCount,
      updatedAt: now,
      lastModifiedBy: operatorName,
    };

    setItems((prev) => prev.map((item) => (item.id === itemId ? updatedItem : item)));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'DELETE_SERIAL',
      entityType: 'SERIAL',
      entityId: serial.id,
      entityName: `${targetItem.name} (${serial.serialNumber})`,
      operatorId,
      operatorName,
      operatorRole,
      details: `Deleted serial number record ${serial.serialNumber} from catalog.`,
    };
    setAuditLogs((prev) => [log, ...prev]);
    syncDoc('items', itemId, updatedItem);
    syncDoc('logs', log.id, log);

    return { success: true };
  };

  // SERIAL NUMBERS: Universal Lookup
  const lookupSerial = (
    serialNumber: string
  ): {
    serial?: ItemSerialNumber;
    item?: Item;
    sale?: SaleRecord;
    rma?: RmaRecord;
  } => {
    const cleanSn = serialNumber.trim().toUpperCase();
    if (!cleanSn) return {};

    let foundSerial: ItemSerialNumber | undefined;
    let foundItem: Item | undefined;

    for (const item of items) {
      if (item.serialNumbers) {
        const match = item.serialNumbers.find(
          (s) => s.serialNumber.toUpperCase() === cleanSn
        );
        if (match) {
          foundSerial = match;
          foundItem = item;
          break;
        }
      }
    }

    if (!foundSerial) return {};

    // Check linked sale
    let foundSale: SaleRecord | undefined;
    if (foundSerial.saleReceiptNumber) {
      foundSale = sales.find((s) => s.receiptNumber === foundSerial?.saleReceiptNumber);
    }
    if (!foundSale) {
      foundSale = sales.find((s) =>
        s.items.some((it) =>
          it.serialNumbers?.some((sn) => sn.serialNumber.toUpperCase() === cleanSn)
        )
      );
    }

    // Check linked RMA
    const foundRma = rmas.find(
      (r) =>
        r.serialNumber.toUpperCase() === cleanSn ||
        r.replacementSerialNumber?.toUpperCase() === cleanSn
    );

    return {
      serial: foundSerial,
      item: foundItem,
      sale: foundSale,
      rma: foundRma,
    };
  };

  // WARRANTY & RMA: Create RMA Claim
  const createRma = (data: {
    serialNumber: string;
    issueDescription: string;
    customerName: string;
    customerPhone?: string;
    initialStatus?: RmaStatus;
    notes?: string;
  }): { success: boolean; rma?: RmaRecord; error?: string } => {
    const { serialNumber, issueDescription, customerName, customerPhone, initialStatus, notes } =
      data;

    const lookup = lookupSerial(serialNumber);
    if (!lookup.serial || !lookup.item) {
      return {
        success: false,
        error: `Serial number "${serialNumber}" was not found in RigForge inventory.`,
      };
    }

    const { serial, item, sale } = lookup;
    const now = new Date().toISOString();
    const operatorName = currentUser ? currentUser.name : 'System';
    const operatorId = currentUser ? currentUser.id : 'usr-system';
    const operatorRole = currentUser ? currentUser.role : 'Staff';

    const rmaNumber = `RMA-${new Date().getFullYear()}-${String(rmas.length + 1).padStart(4, '0')}`;

    const newRma: RmaRecord = {
      id: `rma-${Date.now()}`,
      rmaNumber,
      serialId: serial.id,
      serialNumber: serial.serialNumber,
      itemId: item.id,
      itemName: item.name,
      brand: item.brand,
      category: item.category,
      saleReceiptNumber: serial.saleReceiptNumber || sale?.receiptNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() || serial.customerPhone,
      issueDescription: issueDescription.trim(),
      status: initialStatus || 'PENDING_REVIEW',
      reportedAt: now,
      handledBy: operatorName,
      notes: notes?.trim() || undefined,
    };

    // Transition serial status to RMA_PENDING
    const updatedSerials = (item.serialNumbers || []).map((s) =>
      s.id === serial.id
        ? { ...s, status: 'RMA_PENDING' as SerialStatus, notes: `Under active ${rmaNumber}: ${issueDescription.trim()}` }
        : s
    );
    const inStockCount = updatedSerials.filter((s) => s.status === 'IN_STOCK').length;
    const updatedItem: Item = {
      ...item,
      serialNumbers: updatedSerials,
      stock: inStockCount,
      updatedAt: now,
      lastModifiedBy: operatorName,
    };

    setItems((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));
    setRmas((prev) => [newRma, ...prev]);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'RMA_INITIATED',
      entityType: 'RMA',
      entityId: newRma.id,
      entityName: `${newRma.rmaNumber} (${serial.serialNumber})`,
      operatorId,
      operatorName,
      operatorRole,
      details: `Filed warranty RMA claim for ${item.name} S/N ${serial.serialNumber}. Customer: ${customerName}. Issue: "${issueDescription}"`,
    };
    setAuditLogs((prev) => [log, ...prev]);
    syncDoc('items', item.id, updatedItem);
    syncDoc('rmas', newRma.id, newRma);
    syncDoc('logs', log.id, log);

    return { success: true, rma: newRma };
  };

  // WARRANTY & RMA: Resolve RMA Claim
  const resolveRma = (
    rmaId: string,
    resolution: {
      status: RmaStatus;
      actionTaken: 'REPLACEMENT' | 'REFUND' | 'REPAIR' | 'REJECT';
      replacementSerialId?: string;
      replacementSerialNumber?: string;
      refundAmount?: number;
      notes?: string;
    }
  ): { success: boolean; error?: string } => {
    const targetRma = rmas.find((r) => r.id === rmaId);
    if (!targetRma) return { success: false, error: 'RMA record not found.' };

    const now = new Date().toISOString();
    const operatorName = currentUser ? currentUser.name : 'System';
    const operatorId = currentUser ? currentUser.id : 'usr-system';
    const operatorRole = currentUser ? currentUser.role : 'Staff';

    const { status, actionTaken, replacementSerialId, replacementSerialNumber, refundAmount, notes } =
      resolution;

    // Update RMA record
    const updatedRma: RmaRecord = {
      ...targetRma,
      status,
      actionTaken,
      replacementSerialId,
      replacementSerialNumber,
      refundAmount,
      resolvedAt: now,
      notes: notes ? `${targetRma.notes ? targetRma.notes + ' | ' : ''}${notes}` : targetRma.notes,
    };
    setRmas((prev) => prev.map((r) => (r.id === rmaId ? updatedRma : r)));
    syncDoc('rmas', rmaId, updatedRma);

    // Update item serial numbers accordingly
    const updatedItemsList: Item[] = [];
    setItems((prev) =>
      prev.map((item) => {
        let changed = false;
        let serials = item.serialNumbers ? [...item.serialNumbers] : [];

        // 1. If defective unit is in this item, mark status
        serials = serials.map((s) => {
          if (s.id === targetRma.serialId || s.serialNumber === targetRma.serialNumber) {
            changed = true;
            let nextStatus: SerialStatus = 'DEFECTIVE';
            if (actionTaken === 'REPAIR') nextStatus = 'RETURNED';
            if (actionTaken === 'REJECT') nextStatus = 'RETURNED';
            return {
              ...s,
              status: nextStatus,
              notes: `RMA ${targetRma.rmaNumber} resolved (${actionTaken}). ${notes || ''}`,
            };
          }
          return s;
        });

        // 2. If replacement serial was provided from in-stock inventory
        if (actionTaken === 'REPLACEMENT' && (replacementSerialId || replacementSerialNumber)) {
          serials = serials.map((s) => {
            if (
              (replacementSerialId && s.id === replacementSerialId) ||
              (replacementSerialNumber && s.serialNumber.toUpperCase() === replacementSerialNumber.toUpperCase())
            ) {
              changed = true;
              return {
                ...s,
                status: 'SOLD' as SerialStatus,
                soldDate: now,
                warrantyExpiryDate: new Date(Date.now() + (s.warrantyMonths || 12) * 30 * 24 * 3600 * 1000).toISOString(),
                saleReceiptNumber: targetRma.saleReceiptNumber || targetRma.rmaNumber,
                customerName: targetRma.customerName,
                customerPhone: targetRma.customerPhone,
                notes: `Issued as warranty replacement for RMA ${targetRma.rmaNumber} (Orig: ${targetRma.serialNumber})`,
              };
            }
            return s;
          });
        }

        if (!changed) return item;

        const inStockCount = serials.filter((s) => s.status === 'IN_STOCK').length;
        const modifiedItem: Item = {
          ...item,
          serialNumbers: serials,
          stock: inStockCount,
          updatedAt: now,
          lastModifiedBy: operatorName,
        };
        updatedItemsList.push(modifiedItem);
        return modifiedItem;
      })
    );
    updatedItemsList.forEach((it) => syncDoc('items', it.id, it));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'RMA_RESOLVED',
      entityType: 'RMA',
      entityId: targetRma.id,
      entityName: `${targetRma.rmaNumber} (${targetRma.serialNumber})`,
      operatorId,
      operatorName,
      operatorRole,
      details: `Resolved RMA ${targetRma.rmaNumber} with action: ${actionTaken} (Status: ${status}).${
        replacementSerialNumber ? ` Replacement unit S/N: ${replacementSerialNumber}.` : ''
      }${refundAmount ? ` Refund: ${formatIDR(refundAmount)}.` : ''}${notes ? ` Note: "${notes}"` : ''}`,
    };
    setAuditLogs((prev) => [log, ...prev]);
    syncDoc('logs', log.id, log);

    return { success: true };
  };

  // SALES: Complete Sale with Single/Multi Price Override & Serial Tracking
  const completeSale = (saleData: {
    cartItems: {
      item: Item;
      quantity: number;
      unitPrice: number;
      selectedSerials?: string[];
    }[];
    overrideTotal?: number;
    overrideReason?: string;
    paymentMethod: PaymentMethod;
    customerName?: string;
    customerPhone?: string;
  }): SaleRecord => {
    const {
      cartItems,
      overrideTotal,
      overrideReason,
      paymentMethod,
      customerName,
      customerPhone,
    } = saleData;

    const operatorName = currentUser ? currentUser.name : 'System';
    const operatorId = currentUser ? currentUser.id : 'usr-system';
    const operatorRole = currentUser ? currentUser.role : 'Staff';

    const originalSubtotal = cartItems.reduce(
      (sum, ci) => sum + ci.item.sellPrice * ci.quantity,
      0
    );

    const enteredSubtotal = cartItems.reduce(
      (sum, ci) => sum + ci.unitPrice * ci.quantity,
      0
    );

    const isMultiItem = cartItems.length > 1;
    const finalTotal =
      overrideTotal !== undefined && overrideTotal >= 0
        ? overrideTotal
        : enteredSubtotal;

    const isPriceOverridden = Math.abs(finalTotal - originalSubtotal) > 0.009;
    const overrideDifference = finalTotal - originalSubtotal;

    const receiptNum = `RF-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    const now = new Date().toISOString();

    // Prepare sold serial items mapping
    const saleItemSummaries = cartItems.map((ci) => {
      let soldSerials: SoldSerialInfo[] | undefined;

      if (ci.item.hasSerials && ci.selectedSerials && ci.selectedSerials.length > 0) {
        soldSerials = ci.selectedSerials.map((sNum) => {
          const itemSerial = ci.item.serialNumbers?.find(
            (sn) => sn.serialNumber.toUpperCase() === sNum.toUpperCase()
          );
          const wMonths = itemSerial?.warrantyMonths || ci.item.defaultWarrantyMonths || 12;
          const expDate = new Date(Date.now() + wMonths * 30 * 24 * 3600 * 1000).toISOString();
          return {
            serialNumber: sNum.toUpperCase(),
            warrantyMonths: wMonths,
            warrantyExpiryDate: expDate,
          };
        });
      }

      return {
        itemId: ci.item.id,
        name: ci.item.name,
        brand: ci.item.brand,
        category: ci.item.category,
        quantity: ci.quantity,
        unitPrice: ci.unitPrice,
        lineTotal: ci.unitPrice * ci.quantity,
        serialNumbers: soldSerials,
      };
    });

    const saleRecord: SaleRecord = {
      id: `sale-${Date.now()}`,
      receiptNumber: receiptNum,
      items: saleItemSummaries,
      originalSubtotal: Math.round(originalSubtotal),
      finalTotal: Math.round(finalTotal),
      isPriceOverridden,
      overrideDifference: Math.round(overrideDifference),
      overrideReason: overrideReason || (isPriceOverridden ? 'Price customized at checkout' : undefined),
      paymentMethod,
      customerName: customerName?.trim() || undefined,
      customerPhone: customerPhone?.trim() || undefined,
      cashierId: operatorId,
      cashierName: operatorName,
      cashierRole: operatorRole,
      timestamp: now,
    };

    // Deduct stock and update serial statuses
    const updatedCatalogItems: Item[] = [];
    setItems((prevItems) => {
      return prevItems.map((catalogItem) => {
        const cartMatch = cartItems.find((ci) => ci.item.id === catalogItem.id);
        if (!cartMatch) return catalogItem;

        // If serialized item, mark the chosen serials as SOLD
        if (catalogItem.hasSerials && cartMatch.selectedSerials && cartMatch.selectedSerials.length > 0) {
          const selectedSet = new Set(cartMatch.selectedSerials.map((s) => s.toUpperCase()));
          const updatedSerials = (catalogItem.serialNumbers || []).map((sn) => {
            if (selectedSet.has(sn.serialNumber.toUpperCase())) {
              const wMonths = sn.warrantyMonths || catalogItem.defaultWarrantyMonths || 12;
              const expDate = new Date(Date.now() + wMonths * 30 * 24 * 3600 * 1000).toISOString();
              return {
                ...sn,
                status: 'SOLD' as SerialStatus,
                soldDate: now,
                warrantyExpiryDate: expDate,
                saleReceiptNumber: receiptNum,
                customerName: customerName?.trim(),
                customerPhone: customerPhone?.trim(),
              };
            }
            return sn;
          });

          const inStockCount = updatedSerials.filter((s) => s.status === 'IN_STOCK').length;
          const updatedItem: Item = {
            ...catalogItem,
            serialNumbers: updatedSerials,
            stock: inStockCount,
            updatedAt: now,
            lastModifiedBy: operatorName,
          };
          updatedCatalogItems.push(updatedItem);
          return updatedItem;
        }

        // Standard non-serialized quantity deduction
        const nextStock = Math.max(0, catalogItem.stock - cartMatch.quantity);
        const updatedItem: Item = {
          ...catalogItem,
          stock: nextStock,
          updatedAt: now,
          lastModifiedBy: operatorName,
        };
        updatedCatalogItems.push(updatedItem);
        return updatedItem;
      });
    });
    updatedCatalogItems.forEach((it) => syncDoc('items', it.id, it));

    setSales((prev) => [saleRecord, ...prev]);
    syncDoc('sales', saleRecord.id, saleRecord);

    // Audit Log for Sale
    const itemsDescription = cartItems
      .map((c) => {
        const serialsText = c.selectedSerials && c.selectedSerials.length > 0 ? ` [S/N: ${c.selectedSerials.join(', ')}]` : '';
        return `${c.quantity}x ${c.item.name}${serialsText}`;
      })
      .join(', ');

    const saleLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: 'SALE_COMPLETED',
      entityType: 'SALE',
      entityId: saleRecord.id,
      entityName: `Receipt #${receiptNum}`,
      operatorId,
      operatorName,
      operatorRole,
      details: `Processed sale of [${itemsDescription}] for ${formatIDR(finalTotal)} via ${paymentMethod}${
        customerName ? ` (Customer: ${customerName})` : ''
      }`,
      diff: [
        { field: 'finalTotal', from: formatIDR(originalSubtotal), to: formatIDR(finalTotal) },
        { field: 'itemsCount', from: 0, to: cartItems.reduce((acc, c) => acc + c.quantity, 0) },
      ],
    };

    const logsToAdd: AuditLog[] = [saleLog];

    if (isPriceOverridden) {
      const priceLog: AuditLog = {
        id: `log-${Date.now() + 1}`,
        timestamp: now,
        action: 'PRICE_OVERRIDE',
        entityType: 'SALE',
        entityId: saleRecord.id,
        entityName: `Receipt #${receiptNum}`,
        operatorId,
        operatorName,
        operatorRole,
        details: isMultiItem
          ? `Overrode multi-item bundle total from ${formatIDR(originalSubtotal)} to ${formatIDR(finalTotal)} (${
              overrideDifference < 0
                ? `-${formatIDR(Math.abs(overrideDifference))} discount`
                : `+${formatIDR(overrideDifference)} adjustment`
            })${overrideReason ? `. Reason: "${overrideReason}"` : ''}`
          : `Adjusted single item "${cartItems[0].item.name}" unit price from ${formatIDR(originalSubtotal)} to ${formatIDR(finalTotal)}${
              overrideReason ? `. Reason: "${overrideReason}"` : ''
            }`,
        diff: [
          {
            field: isMultiItem ? 'totalSalePrice' : 'itemPrice',
            from: formatIDR(originalSubtotal),
            to: formatIDR(finalTotal),
          },
        ],
      };
      logsToAdd.push(priceLog);
    }

    setAuditLogs((prev) => [...logsToAdd, ...prev]);
    logsToAdd.forEach((l) => syncDoc('logs', l.id, l));
    return saleRecord;
  };

  const clearLogs = () => {
    if (!currentUser || currentUser.role !== 'Admin') return;
    const clearLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'UPDATE_ITEM',
      entityType: 'USER',
      entityId: currentUser.id,
      entityName: 'Audit System',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      details: 'Audit log ledger was cleared by administrator.',
    };
    setAuditLogs([clearLog]);
    syncDoc('logs', clearLog.id, clearLog);
  };

  const resetDataToSeed = () => {
    setAccounts(SEED_ACCOUNTS);
    setCurrentUser(null);
    setCategories(DEFAULT_CATEGORIES);
    setItems(SEED_ITEMS);
    setSales(SEED_SALES);
    setRmas(SEED_RMAS);
    setAuditLogs(SEED_LOGS);
    try {
      localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
      localStorage.removeItem(STORAGE_KEYS.ITEMS);
      localStorage.removeItem(STORAGE_KEYS.SALES);
      localStorage.removeItem(STORAGE_KEYS.RMAS);
      localStorage.removeItem(STORAGE_KEYS.LOGS);
    } catch (e) {
      console.error(e);
    }

    SEED_ACCOUNTS.forEach((a) => syncDoc('users', a.id, a));
    DEFAULT_CATEGORIES.forEach((c) => syncDoc('categories', c, { id: c, name: c }));
    SEED_ITEMS.forEach((i) => syncDoc('items', i.id, i));
    SEED_SALES.forEach((s) => syncDoc('sales', s.id, s));
    SEED_RMAS.forEach((r) => syncDoc('rmas', r.id, r));
    SEED_LOGS.forEach((l) => syncDoc('logs', l.id, l));
  };

  const exportDataJson = () => {
    const exportObject = {
      appName: 'RigForge PC Inventory & POS',
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser?.name || 'System',
      accounts,
      categories,
      items,
      sales,
      rmas,
      auditLogs,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `rigforge-pc-depot-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportInventoryCsv = () => {
    const headers = [
      'SKU',
      'Name',
      'Brand',
      'Category',
      'Size/Form Factor',
      'Color',
      'Cost Price',
      'Sell Price',
      'Stock',
      'Min Stock Alert',
      'Location',
      'Has Serials',
      'Default Warranty Months',
      'Last Modified By',
      'Updated At',
    ];

    const rows = items.map((item) => [
      `"${item.sku.replace(/"/g, '""')}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.brand.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.size.replace(/"/g, '""')}"`,
      `"${item.color.replace(/"/g, '""')}"`,
      item.buyPrice.toFixed(2),
      item.sellPrice.toFixed(2),
      item.stock,
      item.minStockAlert,
      `"${item.location.replace(/"/g, '""')}"`,
      item.hasSerials ? 'YES' : 'NO',
      item.defaultWarrantyMonths || 12,
      `"${item.lastModifiedBy.replace(/"/g, '""')}"`,
      `"${new Date(item.updatedAt).toLocaleString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rigforge-inventory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        currentUser,
        login,
        logout,
        accounts,
        createUser,
        updateUser,
        deleteUser,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        items,
        addItem,
        updateItem,
        deleteItem,
        adjustStock,
        addItemNote,
        addSerialNumbers,
        updateSerialStatus,
        deleteSerialNumber,
        lookupSerial,
        rmas,
        createRma,
        resolveRma,
        sales,
        completeSale,
        auditLogs,
        clearLogs,
        isCloudConnected,
        resetDataToSeed,
        exportDataJson,
        exportInventoryCsv,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
