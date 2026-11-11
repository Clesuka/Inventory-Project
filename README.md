# Inventory Project

Inventory Project is a point-of-sale and computer hardware inventory management system tailored for PC repair shops, custom system builders, and hardware retailers. It handles retail component inventory, internal workshop tools and equipment, sales checkout, warranty claims (RMA), and operational audit logging, backed by Firebase Firestore for real-time synchronization.

## Core Modules

### Retail Inventory Management
- Component cataloging across PC hardware categories (CPUs, GPUs, Motherboards, RAM, Storage, Power Supplies, Cases, Cooling, Peripherals, Prebuilt Systems).
- Category filtering via horizontal scrolling tab buttons with real-time stock counters.
- Zero-cost and zero-retail price support (Rp 0), accommodating promotional items, warranty replacements, or bundled goods.
- Component-specific attributes, such as omitting color specifications for CPUs.
- Serial number tracking with toggles for serialized products (e.g., Boxed CPUs, GPUs) versus non-serialized bulk supplies (e.g., Tray CPUs, thermal paste, cables).
- Stock level adjustments with logged reasons (Restock, Damage, Audit Correction, Return).

### Shop Assets & Workshop Tools
- Tracking for internal store equipment and workshop apparatus that are not for sale (e.g., SATA cloning docks, test benches, digital microscopes, soldering stations, multimeters).
- Asset metadata including asset tags, brand, model, specifications, purchase date, cost, serial numbers, and physical location within the shop (e.g., Bench A, Storage Shelf 2).
- Operational status lifecycle: Active, In Use, On Service, Broken, and Sold/Liquidated.
- Liquidation workflow allowing retired or decommissioned tools to be sold with recorded sale prices and notes.
- Quick-filter tabs matching the inventory interface with live category counts.

### Point of Sale (POS) Register
- Barcode and product search for rapid cart entry.
- Cart management with stock limit checks, quantity controls, and custom discounts.
- Payment method support: Cash (with automatic change calculation), Debit/Credit Card, Bank Transfer, and QRIS.
- Receipt generation with itemized lists, warranty terms, and direct print functionality.

### Warranty & RMA Tracking
- Intake ticket system for customer warranty claims and defective components.
- Status progression: Pending, Inspecting, Sent to Vendor, Repaired, Replaced, and Rejected.
- Serial number lookup to verify purchase dates and warranty validity against past sales records.
- Service resolution notes and customer notification tracking.

### User Management & Access Control
- Role-based permissions separating Administrator and Staff accounts.
- Administrator accounts retain full administrative privileges, including asset deletion, category management, user creation, and audit reviews.
- Staff accounts handle daily sales transactions, stock adjustments, and ticket updates.

### Activity & Audit Logs
- Timestamped audit entries for inventory additions, stock adjustments, price changes, asset liquidations, sales completions, and user updates.
- Actor identification recording which staff member executed each action.

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide React
- **Database:** Firebase Firestore (multi-client real-time synchronization with local offline caching fallback)
- **State Management:** React Context with Firestore document snapshots

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or compatible package manager

### Local Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser.

Firebase configuration is loaded directly from `firebase-applet-config.json`. No extra `.env` setup is needed for standard local operation.

## Default Credentials

The system initializes with default accounts for initial setup:

| Role | Username | Password | Access Scope |
| --- | --- | --- | --- |
| Administrator | `admin` | `admin123` | Full access to all modules, settings, and logs |
| Staff Member | `staff` | `staff123` | POS checkout, inventory adjustments, RMA tickets |

Password updates and new staff accounts can be managed under User Management by an Administrator.

## Build and Production

To build the static application bundle:

```bash
npm run build
```

The compiled assets will be placed in the `dist` directory, ready to be served by any static web server, GitHub Pages, Vercel, or Firebase Hosting.

## Repository Structure

```text
├── firebase-applet-config.json   # Firestore connection credentials
├── firestore.rules               # Firestore security and validation rules
├── index.html                    # Application HTML entry point
├── package.json                  # Scripts and dependencies
├── vite.config.ts                # Vite bundler configuration
└── src/
    ├── App.tsx                   # Main layout and view routing
    ├── main.tsx                  # React bootstrap file
    ├── components/               # Modals, navigation, and shared UI elements
    ├── context/
    │   └── AppContext.tsx        # Central state, actions, and Firestore listeners
    ├── data/                     # Seed inventory and shop asset catalog
    ├── lib/
    │   └── firebase.ts           # Firebase SDK initialization
    ├── types/                    # TypeScript interfaces (Inventory, Assets, Sales, RMA)
    ├── utils/                    # Currency formatting, receipt generators, helpers
    └── views/                    # Dashboard, Inventory, Shop Assets, POS, RMA, Users, Audit
```

## License

This software is released under the [MIT License](LICENSE).
