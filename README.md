# RigForge PC Depot

A modern, high-performance Point of Sale (POS) and PC Hardware Inventory Terminal built with React, TypeScript, Tailwind CSS, and Firebase Firestore.

RigForge PC Depot is engineered specifically for custom PC builders, hardware retail stores, and computer repair centers to manage inventory, serial-tracked components, warranties, point-of-sale checkouts, and RMA claims seamlessly.

---

## ⚡ Features

- **Component Inventory Management:**
  - Track PC components (CPUs, GPUs, Motherboards, RAM, Storage, PSUs, Cases, Cooling, Peripherals, Prebuilts).
  - Serial number tracking, barcode indexing, and stock level alerts (in-stock, low-stock, out-of-stock).
  - Quick stock adjustment modal with audit reason tracking (Restock, Damage, Audit Correction, Return).
  - Real-time search and filter by category, brand, supplier, or stock status.

- **Category Management:**
  - Create, view, and rename product categories.
  - Renaming a category automatically updates and cascades across all assigned inventory items and Firestore documents.

- **Point of Sale (POS) Register:**
  - Fast, responsive barcode- and click-based item adding.
  - Cart item quantity adjustment, stock limit enforcement, and discount options.
  - Customer information input and instant payment processing (Cash, Card, Transfer, QRIS).
  - Professional digital receipt preview and printing with itemized breakdown.

- **Warranty & RMA Tracking:**
  - Dedicated RMA ticket management for customer warranty claims and defective components.
  - Track claim statuses (`Pending`, `Inspecting`, `Sent to Vendor`, `Repaired`, `Replaced`, `Rejected`).
  - Serial number lookup and warranty expiration verification.

- **User & Access Management (RBAC):**
  - Role-based permissions: **Admin** (full access) and **Staff / Cashier** (POS, viewing inventory, processing tickets).
  - Create and manage store employee accounts.

- **Immutable Audit Logging:**
  - Real-time logging of all critical store actions: inventory creation, category updates, price modifications, stock adjustments, completed sales, and user activity.

- **Real-Time Cloud Sync & Offline Support:**
  - Powered by Google Cloud Firestore with real-time multi-client synchronization.
  - Offline-first fallback: seamlessly caches state in `localStorage` if disconnected and syncs when reconnected.

- **Dark & Light Mode:**
  - System-responsive with quick manual toggle switch.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide React (icons), Motion
- **Database & Persistence:** Firebase Firestore (`firebase@13.1.0`)
- **State Management:** React Context API with real-time Firestore document listeners and optimistic updates

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` (comes with Node.js)

### Installation & Local Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/rigforge-pc-depot.git
   cd rigforge-pc-depot
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000` to launch the terminal.

> **Note on Firebase:** Firebase credentials and the database ID are pre-configured in `firebase-applet-config.json`. You do **not** need to set up local environment variables (`.env`) to run the project.

---

## 🔑 Default Accounts

When launching the application for the first time, you can sign in using either of the default accounts:

| Role | User ID | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full access (Inventory, POS, RMA, Audit Logs, User Management, Category Management) |
| **Staff Member** | `staff` | `staff123` | POS Register, Inventory view & stock adjust, Sales History, Warranty lookups |

*(You can add or modify users anytime under **User Management** when logged in as an Administrator).*

---

## 📖 How to Use

### 1. Dashboard
- View total sales revenue, transactions count, low stock warnings, and open RMA tickets.
- Access quick inventory shortcuts and review recent sales receipts.

### 2. Inventory & Categories
- **Add Items:** Click **"Add Hardware Item"** to register a new product with brand, SKU, serial number, cost price, selling price, warranty period, and supplier.
- **Adjust Stock:** Click the stock adjustment icon on any item row to add or subtract quantity with an audit log reason.
- **Manage Categories:** Click the **"Categories"** button at the top right of the inventory table to create new categories or rename existing ones.

### 3. POS Cashier Terminal
- Search or click items from the catalogue to add them to the transaction cart.
- Enter customer details, select the payment method, and complete the order.
- Click **"View Receipt"** to inspect the printable invoice or download a copy.

### 4. Warranty & RMA
- Create a new ticket when a customer brings in a defective component.
- Record serial numbers, fault descriptions, customer contact, and update the resolution status as the item progresses through vendor repairs.

### 5. Audit Log
- Review an auditable trail of all modifications across the store, timestamped with the operating user's ID.

---

## 🌐 Deploying to GitHub Pages

This project is pre-configured with `base: './'` in `vite.config.ts` for simple static deployment:

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```
2. In your repository on GitHub:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, choose **GitHub Actions**.
   - Select the **Vite** or **Static HTML** starter workflow (which runs `npm run build` and serves the `dist` folder).
3. Once the workflow completes, your app will be live and will immediately connect to your cloud Firestore database.

*(You can also deploy directly to **Vercel**, **Netlify**, or **Firebase Hosting** by pointing the build command to `npm run build` and the output directory to `dist`.)*

---

## 📂 Project Structure

```text
├── firebase-applet-config.json   # Bundled Firebase connection config
├── firestore.rules               # Deployed Firestore security and schema rules
├── index.html                    # Web app entry point
├── package.json                  # Dependencies and build scripts
├── vite.config.ts                # Vite build and asset path configuration
├── src/
│   ├── App.tsx                   # Main layout and view routing
│   ├── main.tsx                  # Application bootstrap
│   ├── components/               # Modals, Navbar, Sidebar, and UI widgets
│   ├── context/
│   │   └── AppContext.tsx        # Global store state & real-time Firestore synchronization
│   ├── data/                     # Initial seed hardware catalog and store data
│   ├── lib/
│   │   └── firebase.ts           # Firebase SDK initialization and Firestore exports
│   ├── types/                    # TypeScript interfaces (Item, Sale, RMA, User, Log, etc.)
│   ├── utils/                    # Currency formatting, receipt generators, and helpers
│   └── views/                    # Dashboard, Inventory, POS, RMA, Users, Audit Views
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
