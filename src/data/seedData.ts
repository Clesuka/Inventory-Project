import { Item, UserAccount, AuditLog, RmaRecord, SaleRecord } from '../types';

export const SEED_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-1',
    userId: 'admin',
    name: 'Alex Tan',
    role: 'Admin',
    password: 'admin123',
    email: 'alex.tan@aceworld.io',
    avatarColor: 'from-blue-600 to-indigo-600',
    createdAt: '2026-10-15T08:00:00.000Z',
  },
  {
    id: 'usr-2',
    userId: 'admin.maya',
    name: 'Maya Lin',
    role: 'Admin',
    password: 'maya123',
    email: 'maya.lin@aceworld.io',
    avatarColor: 'from-emerald-600 to-teal-600',
    createdAt: '2026-10-15T08:30:00.000Z',
  },
  {
    id: 'usr-3',
    userId: 'staff',
    name: 'Chris Wong',
    role: 'Staff',
    password: 'staff123',
    email: 'chris.wong@aceworld.io',
    avatarColor: 'from-amber-600 to-orange-600',
    createdAt: '2026-10-16T09:00:00.000Z',
  },
  {
    id: 'usr-4',
    userId: 'staff.jordan',
    name: 'Jordan Lee',
    role: 'Staff',
    password: 'jordan123',
    email: 'jordan.lee@aceworld.io',
    avatarColor: 'from-violet-600 to-purple-600',
    createdAt: '2026-10-16T10:15:00.000Z',
  },
];

// Empty seed datasets: user populates real catalog, sales, RMA, and audit records manually
export const SEED_ITEMS: Item[] = [];
export const SEED_RMAS: RmaRecord[] = [];
export const SEED_SALES: SaleRecord[] = [];
export const SEED_LOGS: AuditLog[] = [];
