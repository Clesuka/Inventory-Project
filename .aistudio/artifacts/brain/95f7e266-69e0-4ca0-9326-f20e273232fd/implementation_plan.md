# Shop Assets & Tools Tracking Management (with Sell Option)

Add an internal equipment, diagnostic tool, and workshop gear tracking system to **Ace World Computer**, allowing staff to catalog shop inventory items (e.g. Orico SATA cloner dock, test bench, microscope, multimeters), monitor operational statuses (*Active, In Use, On Service, Broken, Standby, Sold*), pinpoint workshop locations, maintain condition notes, and **easily sell or liquidate any shop asset if the shop decides to sell it**.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed and refined during planning:
> - **Navigation Location**: Dedicated tab in the primary sidebar navigation.
> - **Section Label**: `Shop Assets & Tools` (icon: `Wrench` / hardware tool).
> - **Tracking Depth**: Asset status, workshop location, model/specs, condition notes.
> - **Sellable Shop Inventory Option (NEW)**: If the shop decides to sell an internal asset (e.g., selling used test equipment, surplus tools, or a customer wishing to purchase a workshop cloner dock), staff can execute a "Sell Asset" workflow to record the sale or dispatch it to the POS checkout.

- **Confirmed Decision 1**: Store tools and gear in a dedicated `/shop_assets` Firestore collection with full operational tracking (*Active*, *In Use*, *On Service*, *Broken*, *Standby*, *Sold*).
- **Confirmed Decision 2**: Provide a dedicated **"Sell Asset"** option on every shop inventory item:
  - **Direct Equipment Sale**: Record Sale Price (IDR), Date, Customer Name/Phone, and Payment Method directly from the Asset card/detail modal, transitioning status to `SOLD`.
  - **Dispatch to POS**: Option to push the shop asset into the POS register as a line item to print/download an official Ace World Computer receipt for the buyer.
- **Confirmed Decision 3**: Comprehensive financial & audit provenance: Keep track of initial purchase cost vs. final sale price, calculating asset depreciation or recovery value, logged under the acting technician's audit trail.

---

## 1. Overview & Core Concept

### What It Does
Provides an internal inventory and workshop management system for workshop equipment, repair tools, and diagnostic gear. While primarily utilized for internal repair operations, it provides full flexibility for the shop to sell any shop asset at any time.

### Target Audience & Persona
- **Shop Technicians & Bench Engineers**: Need to quickly find where a specific tool is located (*e.g. SATA cloner on Bench 2*), check if test equipment is working or under service, and update condition notes.
- **Store Managers & Admins**: Need an overview of store capital assets, monitor repair statuses, and manage equipment sales when surplus gear is sold to customers or liquidators.

### Key Value
- **Zero Lost Tools**: Every shop tool has a designated home/bench location and tracked status.
- **Clear Maintenance Visibility**: Equipment marked as *Broken* or *On Service* is immediately visible to avoid technicians using compromised tools.
- **Flexible Equipment Liquidation**: If a customer wants to buy shop equipment or the shop upgrades its lab gear, the item can be sold with full receipts and revenue tracking without breaking retail stock counts.

---

## 2. User Experience & Visual Design

### Key User Flows

```
[Sidebar Navigation: "Shop Assets & Tools"]
                   │
                   ▼
       ┌───────────────────────┐
       │ Shop Assets Dashboard │
       └───────────┬───────────┘
                   │
    ┌──────────────┴──────────────────────────┐
    ▼                                         ▼
[KPI Summary Strip]                   [Search & Filter Bar]
- Total Shop Assets                   - Keyword search (name, brand, model, tag)
- Active & Ready                      - Status filter (Active, In Use, On Service, Broken, Sold)
- On Service / Repair                 - Category filter (Diagnostics, Storage, Optics, etc.)
- Sold / Liquidated Assets            - View toggle (Detailed Cards / Dense Table)
    │                                         │
    └──────────────────┬──────────────────────┘
                       ▼
       ┌───────────────────────────────┐
       │   Asset Grid or Table View    │
       │ - Name & Model (e.g. Orico)   │
       │ - Category & Brand            │
       │ - Status Badge with Color     │
       │ - Workshop Location Pin       │
       │ - Condition / Notes           │
       │ - Actions: Edit, Status, SELL │
       └───────────────┬───────────────┘
                       │
       ┌───────────────┼──────────────────────────────┐
       ▼               ▼                              ▼
[Quick Status]   [Asset Details Modal]          ["Sell Asset" Modal]
- Active         - Full specs, location, notes  - Selling Price (Rp)
- In Use         - Historical provenance        - Customer Name & Phone
- On Service     - Direct "Sell Asset" button   - Choice: Direct Sell or
- Broken                                          Send to POS Register
```

### Visual Identity & Theme
- **Theme Consistency**: Matches Ace World Computer's dark/light slate palette with Tailwind CSS (`bg-slate-50 dark:bg-slate-950`, clean border lines `border-slate-200 dark:border-slate-800`).
- **Semantic Status Badges**:
  - `ACTIVE` (Emerald): Fully operational and ready for use in the shop.
  - `IN_USE` (Blue): Currently active on a test bench or repair job.
  - `ON_SERVICE` (Amber): Sent for warranty repair or internal maintenance.
  - `BROKEN` (Rose): Non-functional, needs immediate repair or replacement.
  - `STANDBY` (Slate): Stored in reserve cabinet / backup.
  - `SOLD` (Purple): Decommissioned from the workshop and sold to a customer.
- **Zero-Pill Typography Discipline**: Card headers and table rows present clean typography with unboxed specs (`Brand · Model · Location · Serial`) rather than cluttered pill sandwiches.
- **Tabular Figures**: Asset counts, model numbers, dates, sale prices, and asset tags use monospace tabular figures (`font-mono tabular-nums`).

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Why | Alternatives Considered |
|---|---|---|---|
| **Sell Shop Inventory Feature** | Dual selling option: Direct Sale modal or dispatch to POS register | Allows instant in-place recording of tool sales OR generating a full downloadable store receipt via POS with customer details. | Only allowing POS sales (too rigid if selling wholesale or without printer) or only status toggle (misses price & customer record). |
| **Data Storage Architecture** | Dedicated Firestore collection `/shop_assets` | Complete isolation from sellable retail stock until the shop explicitly chooses to sell it. Prevents asset clutter in retail catalog. | Storing inside `items` with a `isShopAsset: boolean` flag (rejected: risks POS accidents and complicates retail inventory counts). |
| **Status Vocabulary** | 6 standardized statuses: `ACTIVE`, `IN_USE`, `ON_SERVICE`, `BROKEN`, `STANDBY`, `SOLD` | Direct match for the user's explicit request with complete lifecycle from shop acquisition to sale/liquidation. | Free-text status (rejected: cannot be reliably filtered or counted). |
| **Asset Identification** | Auto-generated Tag ID (`AST-xxxx`) + optional Manufacturer S/N | Allows tagging unbranded or tray workshop tools (like SATA docks or hand tools) that lack serial numbers while still tracking serials for high-end instruments (like microscopes). | Mandatory manufacturer serial (rejected: many shop accessories have no serial number). |

---

## 4. Technical Architecture & Data Strategy

### System Layout & Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                             │
│ ┌──────────────────────┐   ┌──────────────────────────────┐ │
│ │     Sidebar.tsx      │   │          Header.tsx          │ │
│ │  + Shop Assets &     │   │  + Breadcrumb & Theme Toggle │ │
│ │    Tools Nav Item    │   └──────────────────────────────┘ │
│ └──────────────────────┘   ┌──────────────────────────────┐ │
│                            │      ShopAssetsView.tsx      │ │
│                            │ ┌──────────────────────────┐ │ │
│                            │ │   Asset Metrics Strip    │ │ │
│                            │ └──────────────────────────┘ │ │
│                            │ ┌──────────────────────────┐ │ │
│                            │ │ Search, Filter & Toggle  │ │ │
│                            │ └──────────────────────────┘ │ │
│                            │ ┌──────────────────────────┐ │ │
│                            │ │ Asset Grid & Table List  │ │ │
│                            │ │ [Sell Asset Button]      │ │ │
│                            │ └──────────────────────────┘ │ │
│                            └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               ▲
                               │ CRUD & onSnapshot
┌─────────────────────────────────────────────────────────────┐
│                    AppContext.tsx                           │
│  - shopAssets: ShopAsset[]                                  │
│  - addShopAsset(data)                                       │
│  - updateShopAsset(id, data, reason)                        │
│  - updateAssetStatus(id, newStatus, note)                   │
│  - sellShopAsset(id, saleInfo)                              │
│  - deleteShopAsset(id)                                      │
└─────────────────────────────────────────────────────────────┘
                               ▲
                               │
┌─────────────────────────────────────────────────────────────┐
│               Firestore: /shop_assets                       │
│  ai-studio-rigforgepcinvent-95f7e266-69e0-4ca0-9326-f20e... │
└─────────────────────────────────────────────────────────────┘
```

### Data Model (`ShopAsset`)

```typescript
export type ShopAssetStatus =
  | 'ACTIVE'
  | 'IN_USE'
  | 'ON_SERVICE'
  | 'BROKEN'
  | 'STANDBY'
  | 'SOLD'
  | 'DECOMMISSIONED';

export type ShopAssetCategory =
  | 'Diagnostics & Bench'
  | 'Storage & Cloning'
  | 'Soldering & Optics'
  | 'Cables & Adapters'
  | 'Hand & Power Tools'
  | 'Test Components'
  | 'Other Equipment';

export interface ShopAssetSaleInfo {
  soldPrice: number;        // Selling price in IDR (Rp)
  soldDate: string;         // ISO timestamp
  soldToCustomer?: string;  // Customer / Buyer name
  customerPhone?: string;   // Phone number
  paymentMethod?: string;   // Cash, Transfer, QRIS
  receiptNumber?: string;   // Optional POS receipt reference
  soldBy: string;           // Staff operator name
  notes?: string;           // Sale notes / reason
}

export interface ShopAsset {
  id: string;               // e.g. "asset-1741..."
  assetTag: string;         // e.g. "AST-1042" (visible barcode/label)
  name: string;             // e.g. "Orico 6629 Dual SATA HDD Cloner Dock"
  category: ShopAssetCategory;
  brand: string;            // e.g. "Orico", "Andonstar", "Quick", "Fluke"
  model?: string;           // e.g. "6629US3-C"
  serialNumber?: string;    // Optional manufacturer S/N
  status: ShopAssetStatus;
  location: string;         // e.g. "Workbench 1 - Shelf B", "Repair Station"
  assignedTo?: string;      // Technician or Station currently using it
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR' | 'DAMAGED';
  purchaseDate?: string;    // YYYY-MM-DD
  purchaseCost?: number;    // IDR (Rp)
  notes?: string;           // Condition notes, accessories included
  saleInfo?: ShopAssetSaleInfo; // Present when status === 'SOLD'
  createdAt: string;
  updatedAt: string;
  lastModifiedBy: string;
}
```

### Implementation Checklist
1. **Types**: Add `ShopAsset`, `ShopAssetStatus`, `ShopAssetCategory`, and `ShopAssetSaleInfo` to `src/types/index.ts`.
2. **Context**:
   - Add `shopAssets` state and CRUD operations:
     - `addShopAsset`
     - `updateShopAsset`
     - `updateAssetStatus`
     - `sellShopAsset(id, saleData)` (records sale details, updates status to `SOLD`, and logs audit trail)
     - `deleteShopAsset`
   - Wire real-time Firestore synchronization on the `/shop_assets` collection.
   - Update POS dispatch handler to optionally accept a shop asset for checkout.
3. **Database Schema & Security Rules**:
   - Update `firebase-blueprint.json` with the `ShopAsset` entity and `/shop_assets/{assetId}` path.
   - Update `firestore.rules` to secure `/shop_assets/{assetId}` with validation rules.
4. **UI Components**:
   - Create `src/views/ShopAssetsView.tsx` with metrics overview (including Sold assets revenue), searchable/filterable cards, and dense table view.
   - Create `src/components/ShopAssetModal.tsx` for adding and editing shop gear.
   - Create `src/components/ShopAssetDetailModal.tsx` for detailed specs, quick status updates, and history notes.
   - Create `src/components/SellAssetModal.tsx` to handle selling a shop asset with selling price, customer info, and option to checkout via POS.
   - Update `src/components/Sidebar.tsx` to include `Shop Assets & Tools` navigation item with alert counter for assets needing service or broken.
   - Update `src/App.tsx` and `src/components/Header.tsx` to mount the new view.
5. **Verification**: Co-execute `compile_applet` and `lint_applet` to ensure zero type errors, run dev server check, and test cloud sync.
