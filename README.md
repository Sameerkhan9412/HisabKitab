# HisabKitab — Personal & Shared Expense Management Web Application

> Production-ready, secure, and responsive full-stack financial intelligence application built with Next.js 14 App Router, TypeScript, Tailwind CSS, MongoDB, Mongoose, NextAuth.js, and Recharts.

---

## 🌟 Executive Overview

**HisabKitab** is a dual-context wealth management platform engineered to solve both personal financial tracking and shared group expense reconciliation (roommates, vacation trips, dining, and team expenses) within a single unified workspace.

It enforces strict authoritative financial accounting on the server side:
* **Integer Minor-Unit Arithmetic**: All monetary quantities are stored and manipulated as integer minor units (paise/cents, e.g. ₹1,250.50 = `125050`) to eliminate IEEE 754 binary floating-point drift.
* **Separation of Personal vs. Shared Liability**: A shared room expense payment by a user is accurately captured in their personal account as an out-of-pocket cash outflow, while simultaneously tracked as a communal credit liability in the room. This completely avoids double-counting.
* **Algorithmic Debt Simplification**: Utilizes a greedy Min-Cash-Flow graph reduction algorithm to minimize the number of transfers required to settle room debts while preserving every member's exact net balance.

---

## 🚀 Key Features

### 1. Authentication & Security
* **NextAuth.js (Auth.js)** with JWT strategy and session management.
* **Credentials & OAuth-Ready** (Google, GitHub).
* **Bcrypt Password Hashing** (12 salt rounds) with strong password criteria.
* **Soft Deletion & Data Privacy**: Protects personal privacy while maintaining communal room audit history.

### 2. Main Executive Dashboard
* **Dynamic KPI Cards**: Total Liquid Net Balance, Monthly Income, Monthly Expenses, Monthly Budget Status, Savings Rate, and Communal Dues (Owed to Me vs. You Owe).
* **Interactive Charts (Recharts)**:
  * 30-day cash flow dynamics (Area Chart with custom gradients).
  * Category spending distribution (Donut chart with percentage breakdown).
* **Upcoming Bills & Subscriptions Widget**.
* **Recent Activity Feed** with instant category badges.

### 3. Personal Expense, Income & Account Management
* **Accounts & Wallets**: Cash in Hand, Bank Accounts, Digital Wallets, and Credit Cards (with credit limit, statement date, and due date alerts).
* **Authoritative Accounting**:
  * Expenses deduct from source account balances.
  * Incomes add to source account balances.
  * Transfers move funds between accounts without altering net income or expenses.
  * Reconciled soft deletions reverse previous balance updates.
* **Categorization & Tagging**: Full system categories + custom user categories with Lucide icons.
* **Export Ledger**: Instant 1-click export to CSV or JSON format.

### 4. Monthly & Category Budgets
* Set overall monthly spending caps and category-specific allowances.
* Live tracking of budget consumption pace.
* Daily suggested spending allowance (`remaining / daysLeft`).
* Proactive multi-threshold warnings (75%, 90%, 100% exceeded).

### 5. Shared Expense Rooms & Splitting Engine
* **Create & Join Rooms**: Alphanumeric, cryptographically secure 8-character invite codes (e.g. `GOATRIP1`, `FLAT402X`).
* **Multi-Payer Contributions**: Record bills where multiple people contributed out of pocket (e.g. Hotel Villa ₹12,000 where Harbir paid ₹8,000 and Aman paid ₹4,000).
* **Multiple Split Schemes**:
  * **Equal Split**: Remainder distributed cleanly down to the single integer minor unit.
  * **Exact Split**: Explicit amounts per participant verified against total.
  * **Percentage Split**: Percentages strictly validated with rounding fraction reconciliation.
  * **Shares Split**: Weighted ratios (e.g. 1 share vs. 2 shares).
* **Zero-Sum Communal Invariant**: $\sum_{u \in \text{Members}} \text{Net}(u) \equiv 0$ strictly maintained.
* **Debt Simplification**: Reduces $A \to B \to C$ down to $A \to C$.
* **Settlements**: Record partial or full peer settlements via UPI, Cash, Bank Transfer, or Card.
* **Financial Guardrails**: Members cannot leave a room if they have outstanding balances. Room owners must transfer ownership before leaving.

### 6. Subscriptions, Goals & Calendar
* **Recurring Transactions**: Daily, Weekly, Monthly, Quarterly, and Yearly frequencies.
* **Savings Goals**: Track milestones (Emergency Fund, Laptop, Vacation) with target dates and "Contribute Funds" quick action.
* **Financial Calendar**: Interactive monthly matrix showing income, expenses, and bills day-by-day.
* **In-App Notification Center**: Instant alerts on join requests, shared expenses, settlements, and budget warnings.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14.2.15 (App Router, Server & Client Components) |
| **Language** | TypeScript (Strict mode enabled) |
| **Styling** | Tailwind CSS + Custom Dark Theme Glassmorphism Design Tokens |
| **Database** | MongoDB 6.0 + Mongoose ODM (Connection Pooling & Compound Indexes) |
| **Authentication** | NextAuth.js (Auth.js) + bcryptjs |
| **Validation** | Zod Schema Validation |
| **Data Visualizations** | Recharts (Responsive SVG Area & Donut charts) |
| **Icons & Design** | Lucide React |
| **Date Manipulation** | date-fns |

---

## 📂 Architecture & Directory Structure

```text
app/
├── (auth)/
│   ├── login/page.tsx               # Login with 1-click test credentials
│   └── register/page.tsx            # Registration with currency & timezone
├── (dashboard)/
│   ├── layout.tsx                   # Responsive sidebar + topbar shell
│   ├── page.tsx                     # Executive financial dashboard & KPIs
│   ├── onboarding/page.tsx          # 3-step interactive onboarding
│   ├── transactions/page.tsx        # Personal expense & income ledger
│   ├── budgets/page.tsx             # Monthly & category budget tracker
│   ├── accounts/page.tsx            # Cash wallets, banks & credit cards
│   ├── rooms/
│   │   ├── page.tsx                 # Shared rooms directory & invite join
│   │   └── [id]/page.tsx            # Room expenses, splits, matrix & settlements
│   ├── settlements/page.tsx         # Global settlement directory
│   ├── recurring/page.tsx           # Subscriptions & recurring bills
│   ├── goals/page.tsx               # Savings goals & contribution modals
│   ├── reports/page.tsx             # Comparative reports & analytics
│   ├── calendar/page.tsx            # Day-by-day cashflow calendar view
│   ├── notifications/page.tsx       # In-app notification center
│   └── settings/page.tsx            # User profile, currency, passwords & export
├── api/
│   ├── auth/[...nextauth]/route.ts  # NextAuth API handler
│   ├── auth/register/route.ts       # Secure registration & seeding
│   ├── accounts/route.ts            # Account CRUD
│   ├── categories/route.ts          # System & user category API
│   ├── transactions/route.ts        # Ledger transactions & balance reversal
│   ├── budgets/route.ts             # Monthly budgets API
│   ├── dashboard/route.ts           # Centralized KPI calculation pipeline
│   ├── rooms/route.ts               # Shared room creation & membership
│   ├── rooms/[id]/route.ts          # Room details & net balance calculations
│   ├── rooms/[id]/expenses/route.ts # Shared expenses & split calculations
│   ├── rooms/[id]/settle/route.ts   # P2P settlement recording
│   ├── recurring/route.ts           # Recurring rules API
│   ├── goals/route.ts               # Savings goal API
│   ├── notifications/route.ts       # In-app notifications API
│   ├── export/route.ts              # CSV / JSON export engine
│   └── seed/route.ts                # 1-Click development database seeder
components/
├── dashboard/                       # KPI cards, charts, QuickAddModal, topbar, sidebar
├── providers/                       # AuthProvider (NextAuth SessionProvider)
└── ui/                              # Toast notifications & UI helpers
lib/
├── auth/authOptions.ts              # NextAuth configuration
├── db/mongoose.ts                   # Cached connection singleton
├── services/
│   ├── splitEngine.ts               # Authoritative split & debt simplification engine
│   └── dashboardService.ts          # Aggregate cash flows & KPI service
├── validations/                     # Zod validation schemas
└── utils.ts                         # Minor-unit currency converter, dates, styling
models/                              # 14 Mongoose models (User, Room, Transaction, etc.)
types/                               # Strict TypeScript definitions & next-auth augmentations
scripts/
└── test-engine.ts                   # 27 unit tests for split math & algorithms
```

---

## 🧮 Shared Expense Accounting & Splitting Rules

### 1. Integer Minor Units
To eliminate binary floating-point roundoff issues:
$$\text{minorUnits} = \text{Math.round}(\text{majorUnits} \times 100)$$
All transactions are stored as integer paise or cents in MongoDB.

### 2. Equal Split Remainder Allocation
For total minor units $E$ divided among $N$ members:
$$Q = \lfloor E / N \rfloor, \quad R = E \pmod N$$
The first $R$ participants are allocated $Q + 1$ minor units; the remaining $N - R$ are allocated $Q$.
$$\sum_{i=1}^N \text{Allocated}_i \equiv E \quad (\text{Exact penny preservation guaranteed})$$

### 3. Net Balance Formulation
For each user $u \in \text{Room}$:
$$\text{Net}(u) = \sum \text{PaidBy}(u) - \sum \text{OwedBy}(u) + \sum \text{SettledIn}(u) - \sum \text{SettledOut}(u)$$
* If $\text{Net}(u) > 0$: User is a creditor (owed money).
* If $\text{Net}(u) < 0$: User is a debtor (owes money).
* $\sum_{u \in \text{Members}} \text{Net}(u) = 0$ is guaranteed across all states.

### 4. Transitive Debt Simplification
Reduces circular or chained debts ($A \to B \to C$) into minimal direct payments ($A \to C$) by sorting creditors descending and debtors ascending, greedily matching the maximum debt with maximum credit until all balances reach 0.

---

## ⚡ Local Setup & Installation

### Prerequisites
* **Node.js**: `v18+` (Tested on `v20.19.5`)
* **MongoDB**: Running locally at `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env.local` file (already initialized in development):
```env
MONGODB_URI=mongodb://127.0.0.1:27017/expense_management
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=delhi_expense_management_super_secret_jwt_key_2026_production_grade_random_seed_987654321
NEXT_PUBLIC_DEFAULT_CURRENCY="INR"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Instant Demo Credentials & Seeding
You can populate realistic mock data (Goa trip room, Flatmate room, personal income, expenses, and budgets) with 1 click:
* Click **"Load Demo Data (1-Click)"** on the top banner of the dashboard, OR
* Run: `curl -X POST http://localhost:3000/api/seed`

**Pre-seeded Demo Accounts (Password: `Password123!`):**
* **Harbir Singh** (Admin / Room Owner): `harbir@example.com`
* **Aman Sharma** (Room Admin): `aman@example.com`
* **Rahul Verma** (Room Member): `rahul@example.com`

---

## 🧪 Testing & Verification

Run the comprehensive unit test suite covering integer split calculations, equal remainders, exact splits, percentage rounding, zero-sum invariants, and debt simplification:

```bash
npx tsx scripts/test-engine.ts
```

Output:
```text
=========================================
🧪 RUNNING FINANCIAL & SPLIT ENGINE TESTS
=========================================

--- 1. Currency Minor-Unit Tests ---
✅ PASS: 100.00 converts to 10000 minor units
✅ PASS: '125.50' converts to 12550 minor units
✅ PASS: 0.01 converts to 1 minor unit
✅ PASS: 12550 minor units converts back to 125.5

--- 2. Equal Split & Remainder Precision Tests ---
✅ PASS: Split produces 3 participants
✅ PASS: Sum of equal split strictly equals 10000 minor units (got 10000)
✅ PASS: First participant gets remainder (3334, got 3334)
✅ PASS: Second participant gets base (3333, got 3333)
✅ PASS: Third participant gets base (3333, got 3333)
✅ PASS: ₹1 (100 paise) split among 3 equals strictly 100 (got 100)
✅ PASS: Remainder allocated cleanly: 34 + 33 + 33 == 100

--- 3. Exact Split Tests ---
✅ PASS: Exact split validation matches total
✅ PASS: Exact split throws error when sum does not match total expense

--- 4. Percentage Split Tests ---
✅ PASS: Percentage split strictly equals 10000 (got 10000)

--- 5. Shares / Weight Split Tests ---
✅ PASS: User A gets 1/4 (3,000)
✅ PASS: User B gets 1/4 (3,000)
✅ PASS: User C gets 2/4 (6,000)

--- 6. Net Balances Calculation Tests ---
✅ PASS: Harbir is owed ₹2,000 (got 200000)
✅ PASS: Aman owes ₹1,000 (got -100000)
✅ PASS: Rahul owes ₹1,000 (got -100000)
✅ PASS: Zero-sum invariant preserved: sum(balances) === 0 (got 0)

--- 7. Settlement Rebalancing Tests ---
✅ PASS: Aman is now fully settled (got 0)
✅ PASS: Harbir is now owed ₹1,000 (got 100000)
✅ PASS: Rahul still owes ₹1,000 (got -100000)

--- 8. Debt Simplification Algorithm Tests ---
✅ PASS: Simplified from 2 transactions to 1 (got 1)
✅ PASS: A pays C directly
✅ PASS: Amount is ₹1,000 (got 100000)

=========================================
🏁 TEST SUMMARY: 27 PASSED, 0 FAILED
=========================================
```

Run TypeScript strict verification:
```bash
npx tsc --noEmit
```

Run Production Build verification:
```bash
npm run build
```

---

## 🔒 Security Best Practices
* **Zero Trust Server-Side Verification**: Balances and settlements are never computed client-side; all splits and balance assertions are executed authoritatively on the server.
* **Strict IDOR Protection**: Personal endpoints verify `userId === session.user.id`; room endpoints verify valid `RoomMember` records.
* **Input Sanitization**: All incoming payloads are validated via Zod schemas before touching business logic or the database.
* **Rate Limiting & Safe Errors**: Internal database exceptions and password hashes are never leaked to API responses.

---

## 📄 License
MIT License. Built for production grade personal and communal wealth tracking.
#   H i s a b K i t a b  
 