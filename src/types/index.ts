export type ItemCategory = string;

export type SerialStatus =
  | 'IN_STOCK'
  | 'SOLD'
  | 'RMA_PENDING'
  | 'DEFECTIVE'
  | 'RETURNED';

export interface ItemSerialNumber {
  id: string;
  itemId: string;
  serialNumber: string;
  status: SerialStatus;
  warrantyMonths: number;
  purchaseDate: string;
  soldDate?: string;
  warrantyExpiryDate?: string;
  saleReceiptNumber?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

export type RmaStatus =
  | 'PENDING_REVIEW'
  | 'SENT_TO_VENDOR'
  | 'REPLACED_FROM_STOCK'
  | 'REPAIRED'
  | 'REFUNDED'
  | 'REJECTED';

export interface RmaRecord {
  id: string;
  rmaNumber: string; // e.g. RMA-2026-001
  serialId: string;
  serialNumber: string;
  itemId: string;
  itemName: string;
  brand: string;
  category: ItemCategory;
  saleReceiptNumber?: string;
  customerName: string;
  customerPhone?: string;
  issueDescription: string;
  status: RmaStatus;
  actionTaken?: 'REPLACEMENT' | 'REFUND' | 'REPAIR' | 'REJECT';
  replacementSerialId?: string;
  replacementSerialNumber?: string;
  refundAmount?: number;
  reportedAt: string;
  resolvedAt?: string;
  handledBy: string;
  notes?: string;
}

export interface Item {
  id: string;
  name: string;
  brand: string;
  category: ItemCategory;
  size: string; // Form factor / dimensions / capacity
  color: string;
  sku: string;
  buyPrice: number; // Cost price
  sellPrice: number; // Selling retail price
  stock: number;
  minStockAlert: number;
  location: string;
  notes?: string;
  hasSerials?: boolean; // Whether individual serials are tracked (GPUs, CPUs, etc.)
  defaultWarrantyMonths?: number; // e.g., 12, 24, 36 months
  serialNumbers?: ItemSerialNumber[];
  createdAt: string;
  updatedAt: string;
  lastModifiedBy: string;
}

// Exactly two access levels: Admin and Staff
export type UserRole = 'Admin' | 'Staff';

export interface UserAccount {
  id: string;
  userId: string; // Unique username for login created by admin (e.g. "admin", "staff.chris")
  name: string;
  role: UserRole;
  password: string; // Password created/managed by admin
  email: string;
  avatarColor: string;
  createdAt: string;
}

export interface CartItem {
  item: Item;
  quantity: number;
  unitPrice: number; // Unit price can be edited for single-item sale
  selectedSerials?: string[]; // Serial numbers selected for this purchase
}

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'QRIS';

export interface SoldSerialInfo {
  serialNumber: string;
  warrantyExpiryDate: string;
  warrantyMonths: number;
}

export interface SaleItemSummary {
  itemId: string;
  name: string;
  brand: string;
  category: ItemCategory;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  serialNumbers?: SoldSerialInfo[];
}

export interface SaleRecord {
  id: string;
  receiptNumber: string;
  items: SaleItemSummary[];
  originalSubtotal: number;
  finalTotal: number;
  isPriceOverridden: boolean;
  overrideDifference: number; // negative means discount, positive means surcharge
  overrideReason?: string;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  cashierId: string;
  cashierName: string;
  cashierRole: string;
  timestamp: string;
}

export type AuditAction =
  | 'CREATE_ITEM'
  | 'UPDATE_ITEM'
  | 'DELETE_ITEM'
  | 'STOCK_ADJUSTMENT'
  | 'SALE_COMPLETED'
  | 'PRICE_OVERRIDE'
  | 'NOTE_ADDED'
  | 'ADD_SERIAL'
  | 'UPDATE_SERIAL'
  | 'DELETE_SERIAL'
  | 'RMA_INITIATED'
  | 'RMA_RESOLVED'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'CREATE_CATEGORY'
  | 'UPDATE_CATEGORY'
  | 'DELETE_CATEGORY';

export interface AuditFieldDiff {
  field: string;
  from: string | number | boolean;
  to: string | number | boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: AuditAction;
  entityType: 'ITEM' | 'SALE' | 'USER' | 'CATEGORY' | 'SERIAL' | 'RMA';
  entityId: string;
  entityName: string;
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  details: string;
  diff?: AuditFieldDiff[];
}

