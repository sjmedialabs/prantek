# Responsive UI – Mobile-first architecture

This document describes the responsive strategy and reusable components used across the app.

## Breakpoints (Tailwind)

- **sm**: 640px  
- **md**: 768px  
- **lg**: 1024px  
- **xl**: 1280px  
- **2xl**: 1536px  

Use a **mobile-first** approach: base styles for small screens, then `sm:`, `md:`, `lg:` for larger ones.

## Reusable layout components

- **`SidebarProvider` / `useSidebar()`** – Context for mobile sidebar open/close. Use `toggleMobile`, `openMobile`, `closeMobile` in the header.
- **`ResponsiveContainer`** – `px-4 sm:px-6 lg:px-8` and optional `maxWidth` (sm, md, lg, xl, 2xl, prose, full).
- **`ResponsiveGrid`** – Grid that adapts columns (e.g. `cols={3}` → 1 col mobile, 2 sm, 3 lg).
- **`ResponsiveTable`** – Table on `md+`, stacked cards on small screens. Pass `data`, `columns`, `keyExtractor`, optional `mobileCardTitle` and `getRowHref`.
- **`ResponsiveLayout`** – Wrapper with optional responsive padding for page content.

## Dashboard & Super-admin layout

- **Desktop (lg+)**  
  - Sidebar is fixed on the left.  
  - Main content has left margin/padding so it doesn’t sit under the sidebar.

- **Tablet / Mobile (< lg)**  
  - Sidebar is hidden from the flow.  
  - Header shows a **hamburger** (min 48px tap target) that opens the sidebar in a **drawer** (Sheet from the left).  
  - Overlay closes the drawer when tapped.  
  - Drawer closes when the route changes (navigation).

## Touch and accessibility

- **Minimum tap target**: 48×48px for primary actions (hamburger, close, nav items in drawer).  
- **`touch-manipulation`** used on key controls to reduce delay.  
- **`.touch-target`** in `globals.css` for ad-hoc 48px targets.

## Tables

- **`Table`** (ui): Wrapper has `min-w-0` and `overflow-x-auto` so wide tables scroll horizontally on small screens.  
- **`ResponsiveTable`**: Use for list pages where you want a table on desktop and card list on mobile.

## Files touched

- `app/dashboard/layout.tsx` – SidebarProvider, Sheet drawer, responsive main padding.  
- `app/super-admin/layout.tsx` – Same pattern for super-admin.  
- `components/dashboard/dashboard-sidebar.tsx` – `isMobile` / `onClose`, close on route change, 48px targets.  
- `components/dashboard/dashboard-header.tsx` – Hamburger, logo, responsive padding, 48px targets.  
- `components/super-admin/super-admin-sidebar.tsx` – Same mobile/drawer behavior.  
- `components/super-admin/super-admin-header.tsx` – Hamburger, responsive padding.  
- `components/layout/*` – sidebar-context, responsive-container, responsive-grid, responsive-table, responsive-layout.  
- `components/ui/sheet.tsx` – `hideCloseButton`, left drawer width for mobile.  
- `components/ui/table.tsx` – `min-w-0` for flex-friendly horizontal scroll.  
- `app/globals.css` – `.touch-target`, `.touch-manipulation`.

## Testing viewports

- 320px, 375px (small phones)  
- 768px (tablet)  
- 1024px (laptop)  
- 1440px (desktop)
