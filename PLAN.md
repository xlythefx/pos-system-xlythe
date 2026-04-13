# Gods Will Cafe POS — Comprehensive Improvement Plan

## What's Already Built

| Module | Status |
|--------|--------|
| POS order grid (search, category filters) | ✅ Done |
| Cart with qty controls + clear | ✅ Done |
| Cash payment: amount received + change | ✅ Done |
| GCash reference number (hidden from UI, data retained) | ✅ Done |
| Receipt dialog: collapsible items, print | ✅ Done |
| Orders list + print receipt from history | ✅ Done |
| Inventory: CRUD, stock levels, cost price, availability | ✅ Done |
| Audit page: inventory vs sales reconciliation, pagination | ✅ Done |
| Analytics: revenue, orders, peak hour, category pie, top items, CSV export, demo mode | ✅ Done |
| Profitability: overhead calculator, break-even, product margin analysis | ✅ Done |
| Transactions log: item count, eye modal, formatted totals | ✅ Done |
| Sidebar navigation (collapsible icon mode) | ✅ Done |
| Dark / light mode toggle | ✅ Done |
| Multi-cafe config foundation (`cafe-config.ts`) | ✅ Done |

---

## Priority 1 — Core POS Gaps (high impact, cafe daily ops)

### 1.1 Item Modifiers / Add-ons
Real cafes charge extra for customizations per drink.

**What to build:**
- Each `MenuItem` gets an optional `modifiers` array: `{ id, name, price, required, options[] }`
- Examples: Size (Regular/Large +₱20), Temperature (Hot/Iced), Sugar level, Extra shot (+₱30), Whipped cream (+₱15)
- When adding item to cart, a modal appears if item has modifiers
- Selected modifiers add to item unit price
- Cart shows modifier summary per line (e.g. "Dirty Matcha · Iced · Extra Shot")
- Receipt and print include modifier lines

**Why it matters:** Upsells average +₱15–40 per drink. Also required for accurate order accuracy.

---

### 1.2 Order Notes per Item / per Order
- **Per item note:** e.g. "less sugar", "no whip", "allergy: dairy"
- **Order-level note:** e.g. "table 4", "for takeout", "birthday"
- Shown on receipt and on the kitchen / queue display

---

### 1.3 Hold / Park Orders
Cashier takes second order while first customer looks for wallet.

**What to build:**
- "Hold" button on cart saves current cart as a named pending order (slot A, B, C)
- Held orders appear as tabs or a tray icon
- Cashier switches between held orders freely
- Max 3–5 held orders at a time

---

### 1.4 Discount System

| Discount type | Example |
|---|---|
| Senior / PWD (20%) | Required by law in PH |
| Percentage off | "10% off all drinks today" |
| Fixed amount | "₱50 off over ₱500" |
| Free item | "Buy 2 get 1 free" |
| Promo code | Staff-entered code triggers preset discount |

**What to build:**
- Discount section in cart footer (before total)
- Shows: Subtotal, Discount, **Total**
- Discount stored on `Order` interface
- Receipt shows discount line
- Analytics tracks discounted orders + discount totals

---

### 1.5 Split Bill
For groups: split total equally by N people, or split by items.

**What to build:**
- "Split" button in cart footer
- Mode 1: Even split — enter number of people, shows share per person
- Mode 2: Item split — assign each line item to a person
- Each split charges separately (creates N separate receipts / orders)

---

### 1.6 Order Types (Dine-in / Takeout / Delivery)
- Tag each order: `dine-in`, `takeout`, `delivery`
- Displayed on receipt header
- Filterable in Orders and Transactions pages
- Optional: dine-in requires table number input

---

### 1.7 Table / Seat Management (Dine-in)
- Table grid UI (configurable: 5–20 tables)
- Color states: Available (green), Occupied (red), Bill requested (orange)
- Opening a table creates an order session for that table
- Cashier can add items to same table's order over time

---

## Priority 2 — Payments & Cash Management

### 2.1 GCash Payment Flow (UI)
Even though the terminal is separate, the POS should:
- Mark order as "GCash — pending confirmation"
- Staff confirms when GCash terminal shows success
- Reference number input remains (for reconciliation)
- Receipt prints with reference number

### 2.2 End-of-Day Cash Drawer Reconciliation
**What to build:**
- "Close Day" action in sidebar (admin only)
- Shows: expected cash in drawer (sum of today's cash orders)
- Staff enters actual cash counted
- System saves the variance (overage / shortage)
- Daily closeout log page

### 2.3 Opening Cash Float
- Set opening float at start of shift (e.g. ₱1,000 in drawer)
- Cash balance = float + today's cash sales
- Used in end-of-day reconciliation

### 2.4 Refund / Void
- Void: cancel an order before cash drawer is closed (removes from sales)
- Refund: post-close refund — creates negative transaction entry
- Reason required (wrong order, spoilage, customer complaint)
- Refund log in transactions with separate status badge

---

## Priority 3 — Order Queue / Kitchen Display

### 3.1 Order Queue View
A separate full-screen page (for a second screen or tablet behind the counter):

- Shows pending/preparing orders as cards
- Each card: order number, items, time elapsed
- Staff marks items "Preparing" → "Ready" → "Served"
- Completed orders auto-remove after 60 seconds

### 3.2 Order Number System
- Each order gets a sequential daily number (e.g. #001, #002)
- Resets to #001 every day
- Number printed large on receipt for pickup calls
- Optional: customer display screen shows "Now serving #012"

---

## Priority 4 — Staff & Security

### 4.1 Staff Accounts / PIN Login
- Multiple staff accounts: Owner, Manager, Cashier
- Login via 4–6 digit PIN pad
- Role-based access:
  - **Cashier:** POS only, no inventory/analytics
  - **Manager:** + inventory, orders, transactions
  - **Owner:** full access including profitability, audit, settings

### 4.2 Activity / Audit Log
- Record who did what: login, void, discount applied, price change, stock update
- Timestamp + user name per action
- Filterable in the Audit page

### 4.3 Session Timeout
- Auto-lock to PIN screen after N minutes of inactivity
- Prevents unauthorized access if terminal left unattended

---

## Priority 5 — Inventory Improvements

### 5.1 Stock Deduction on Sale
Currently stock is manually updated. Real POS auto-deducts.

**What to build:**
- When order is completed, subtract sold quantities from `stockLevels`
- If stock reaches 0 → item automatically marked unavailable in POS grid
- Low stock threshold alert (already exists, but tie to auto-deduct)

### 5.2 Stock-In / Receiving Entries
- "Receive stock" form: item, quantity received, supplier, cost, date
- History of all stock-in transactions
- Supports reconciliation: opening stock + received − sold = expected on hand

### 5.3 Ingredient / Recipe Management (advanced)
- Define recipes: "1x Dirty Matcha = 18g matcha powder + 200ml milk + 1 espresso shot"
- Track raw ingredient stock separately
- Deduct ingredients automatically on each sale

### 5.4 Expiry / Batch Tracking
- Set expiry dates on stock-in batches
- Alert when items are within N days of expiry

---

## Priority 6 — Analytics Improvements

### 6.1 Sales Comparison (Period-over-Period)
- "vs last week" and "vs last month" percentage change badges on key metrics
- Requires storing historical snapshots

### 6.2 Best / Worst Sellers Chart (Trend)
- Line chart of top 5 items over time (not just current period)

### 6.3 Hourly Revenue Heatmap
- 7-day grid: days × hours, colored by revenue density
- Quickly shows busiest times of week

### 6.4 Customer Frequency (if loyalty added)
- Average order frequency per customer
- New vs returning customers pie

### 6.5 Daily Summary Email / Export
- End-of-day summary: total sales, orders, top item, cash vs GCash
- Export as PDF or CSV (CSV already exists for analytics)

---

## Priority 7 — Customer-Facing Features

### 7.1 Customer Display
- Second screen or browser tab shows:
  - Order being built (items + running total)
  - Payment confirmation screen ("Thank you! Change: ₱50")
  - Idle: cafe logo / promotions

### 7.2 Basic Loyalty / Points
- Customer name/number linked to order
- Earn 1 point per ₱50 spent
- Redeem points for discounts
- Simple customer lookup by phone number

### 7.3 Queue Ticket / SMS Notification
- Print queue number on receipt
- Optional: SMS "Your order #012 is ready!" via Semaphore/Globe API

---

## Priority 8 — Technical / Infrastructure

### 8.1 Backend / Cloud Sync
Currently all data is `localStorage` — wiped if browser clears storage.

**Options:**
- **Firebase Firestore** — real-time, offline-first, free tier covers a small cafe
- **Supabase** — PostgreSQL-backed, open source, free tier
- **PocketBase** — self-hosted, simple, single binary

**What this unlocks:**
- Data persists across devices and browser resets
- Multiple devices (cashier + kitchen tablet) share the same order state in real-time
- Owner can view analytics from their phone

### 8.2 Offline-First with Sync
- Service worker caches the app shell
- Orders queue locally when offline
- Syncs to backend when connection restores
- Show "Offline mode" indicator in header

### 8.3 Data Backup / Export
- Manual "Export all data" as JSON (orders, inventory, settings)
- Manual "Import data" for restoring from backup
- Auto-backup to a linked Google Drive / Dropbox (optional)

### 8.4 Multi-Branch Support (foundation exists)
`cafe-config.ts` already supports multiple cafe configs.

**What to complete:**
- Branch selector on login screen
- Each branch has isolated storage keys (already done)
- Owner account can view consolidated analytics across branches

### 8.5 PWA / Install as App
The app already has PWA metadata. Complete it:
- `manifest.json` with icons, start URL, display: standalone
- Service worker for offline support
- "Install" prompt in header (clean replacement for current PWAInstallPrompt)
- Works on Android/iOS tablets (common POS hardware)

---

## Suggested Build Order

```
Phase 1 (Daily ops fundamentals)
  → 1.4 Discounts (Senior/PWD is legally required)
  → 5.1 Auto stock deduction on sale
  → 1.2 Order notes
  → 2.4 Void / Refund

Phase 2 (Cash management & staff)
  → 2.2 End-of-day cash reconciliation
  → 4.1 Staff PIN login + roles
  → 4.2 Activity log
  → 2.3 Opening float

Phase 3 (Upsell & operations)
  → 1.1 Item modifiers
  → 1.3 Hold orders
  → 3.1 Order queue view
  → 3.2 Order number system

Phase 4 (Persistence & reliability)
  → 8.1 Backend sync (Firebase or Supabase)
  → 8.2 Offline-first
  → 8.3 Data backup

Phase 5 (Growth)
  → 1.6 Order types (dine-in/takeout)
  → 1.7 Table management
  → 7.2 Loyalty / points
  → 5.2 Stock-in / receiving
```

---

## Quick Wins (can be done in 1–2 hours each)

| Item | Effort | Value |
|------|--------|-------|
| Senior/PWD 20% discount button in cart | Low | High — legally required |
| Auto-deduct stock on completed order | Low | High |
| Order type label (dine-in / takeout) with selector | Low | Medium |
| Daily order number (#001 counter) | Low | Medium |
| Item note text field in cart | Low | Medium |
| "Void" button on completed orders (same-day only) | Low | Medium |
| Data export / import JSON backup | Low | High |
| Keyboard shortcuts (Enter = charge, Esc = cancel) | Low | Medium |

---

*Last updated: April 2026*
