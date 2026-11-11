# Horizontal Category Tabs for Shop Assets & Tools

Replace the `<select>` dropdown menu in **Shop Assets & Tools** with horizontal scrolling category tab buttons and count badges, matching the layout and interaction pattern used in the main **Inventory** screen.

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Category UI Pattern**: Replacing the compact `<select>` dropdown with horizontal scrolling tab buttons (`All Categories`, `Diagnostics & Bench`, `Storage & Cloning`, `Soldering & Optics`, `Cables & Adapters`, `Hand & Power Tools`, `Test Components`, `Other Equipment`).
> - **Item Counters**: Each category tab button will display the active count of matching workshop assets (e.g. `Diagnostics & Bench (2)`), automatically updating with real-time Firestore sync.
> - **Layout Alignment**: The top search bar will contain the search input and grid/table toggle, with the category tabs positioned directly beneath with subtle hairline borders, matching `InventoryView`.

---

## 1. Overview & Core Concept

### What It Does
Transforms category filtering in the **Shop Assets & Tools** view from a dropdown selector into horizontal tab buttons with instant click filtering, active state styling, and numerical count badges.

### Target Audience & Persona
- **Technicians & Shop Staff**: Can quickly scan all available tool categories with a single glance, see how many tools exist in each category, and switch categories with 1-click instead of opening a dropdown menu.

### Key Value
- **Visual Consistency**: Provides the exact same UX and design language across both Retail Inventory and Shop Tools.
- **Fast 1-Click Access**: No dropdown clicks required; immediate visibility into equipment category breakdown.

---

## 2. User Experience & Visual Design

### Key User Flows

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Search by name, brand, model, tag...]           [Grid] [Table Toggle] │
├────────────────────────────────────────────────────────────────────────┤
│ [All Categories 8] [Diagnostics & Bench 2] [Storage & Cloning 2] ...   │
└────────────────────────────────────────────────────────────────────────┘
```

### Visual Specifications
- **Container**: Contained inside the search & filter panel (`p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800`).
- **Tab Buttons**:
  - Inactive: `bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700`
  - Active: `bg-blue-600 text-white font-semibold shadow-xs`
  - Count Badge: `text-[10px] font-mono px-1 rounded-sm` (`bg-blue-700 text-white` when active, `text-slate-400 dark:text-slate-500` when inactive).
- **Smooth Horizontal Scroll**: `overflow-x-auto no-scrollbar` for fluid horizontal scrolling on mobile and desktop viewports.

---

## 3. Technical Architecture & Changes

### Targeted Changes
- File: `src/views/ShopAssetsView.tsx`
  1. Remove the `<select value={selectedCategory}>` dropdown menu from the top controls row.
  2. Add the horizontal category tabs row (`flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 no-scrollbar border-t border-slate-100 dark:border-slate-800/80`) directly beneath the search input.
  3. Map over `CATEGORIES` calculating live counts (`cat === 'All' ? shopAssets.length : shopAssets.filter(...).length`).
  4. Ensure category click immediately updates `selectedCategory` and filters both Grid Card and Table views.

---

## 4. Verification & Status
- **Status**: Completed & Verified.
- **Lint Check**: `tsc --noEmit` passed with 0 errors.
- **Build Check**: `npm run build` compiled cleanly.
- **Server Health**: Dev server responding with HTTP 200 on port 3000.
- **UI Interaction**: Horizontal scrolling category tab buttons with live count badges match the `InventoryView` design pattern. Filter updates both Grid and Table modes on click.
