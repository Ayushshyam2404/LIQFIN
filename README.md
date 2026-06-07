# LIQIFIN — World-Class Personal Finance & Credit Card Management OS

LIQIFIN is an enterprise-grade, full-stack personal finance management application featuring a custom glassmorphic layout inspired by Apple Wallet, Apple Card, and Apple Vision Pro (visionOS).

---

## Key Features

1. **LIQIFIN Glass UI System**: Frosting, translucencies, and lighting glare effects.
2. **Interactive 3D Credit Cards**: Cards respond to mouse movements by rotating in 3D space and shifting light glares.
3. **Automated Budget Warnings**: Category budgets automatically calculate totals and trigger warning flags when limits are breached.
4. **Savings Goal Tracker**: Interactive savings accounts with deposit facilities and automatic completion notifications.
5. **Private AI Advisory Assistant**: Private offline financial analysis.
6. **Robust Offline Support**: A service worker caches frontend assets, while Dexie.js (IndexedDB) holds the transactions ledger offline. Mutating actions queue locally and replay to the API server when connection is restored.
7. **Biometric WebAuthn Support**: Future-ready passkey authentication mocks Face ID/Touch ID triggers.
8. **OCR Receipt Scanner**: Mock OCR scans uploaded bills to auto-populate fields.
9. **Bulk Exports**: Export data as formatted CSV files.

---

## Technology Stack

* **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Framer Motion, Zustand, React Hook Form, Zod, Recharts, Lucide Icons, Dexie.js.
* **Backend**: Node.js, Express.js, TypeScript, Mongoose ODM, MongoDB, JWT Access/Refresh tokens, Helmet, express-rate-limit, Multer.

---

## Directory Structure

```
liqifin/
├── frontend/
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   └── src/
│       ├── components/
│       │   ├── cards/
│       │   │   └── AppleCard3D.tsx
│       │   ├── forms/
│       │   │   └── AddExpenseModal.tsx
│       │   ├── layout/
│       │   │   └── AppLayout.tsx
│       │   └── ui/
│       │       ├── CommandPalette.tsx
│       │       ├── LiquidBlob.tsx
│       │       └── NotificationPanel.tsx
│       ├── pages/
│       │   ├── AIAssistantPage.tsx
│       │   ├── AnalyticsPage.tsx
│       │   ├── AuthPage.tsx
│       │   ├── CardsPage.tsx
│       │   ├── Dashboard.tsx
│       │   ├── ExpensesPage.tsx
│       │   └── GoalsPage.tsx
│       ├── services/
│       │   ├── api.ts
│       │   └── db.ts
│       ├── store/
│       │   ├── useAuthStore.ts
│       │   └── useFinanceStore.ts
│       ├── main.tsx
│       └── App.tsx
├── backend/
│   └── src/
│       ├── config/
│       │   ├── db.ts
│       │   └── seed.ts
│       ├── controllers/
│       │   ├── aiController.ts
│       │   ├── authController.ts
│       │   ├── budgetController.ts
│       │   ├── cardController.ts
│       │   ├── dashboardController.ts
│       │   ├── expenseController.ts
│       │   ├── goalController.ts
│       │   └── notificationController.ts
│       ├── middleware/
│       │   ├── authMiddleware.ts
│       │   └── errorMiddleware.ts
│       ├── models/
│       │   ├── Budget.ts
│       │   ├── CreditCard.ts
│       │   ├── Expense.ts
│       │   ├── Goal.ts
│       │   ├── Notification.ts
│       │   ├── RecurringTransaction.ts
│       │   └── User.ts
│       ├── routes/
│       │   ├── aiRoutes.ts
│       │   ├── authRoutes.ts
│       │   ├── budgetRoutes.ts
│       │   ├── cardRoutes.ts
│       │   ├── dashboardRoutes.ts
│       │   ├── expenseRoutes.ts
│       │   ├── goalRoutes.ts
│       │   └── notificationRoutes.ts
│       └── validators/
│           └── index.ts
├── docker-compose.yml
├── start.sh
└── README.md
```

---

## Installation & Running

### Automatic Setup (Recommended)

1. Open your terminal at the project root directory.
2. Run the automation script:
   ```bash
   ./start.sh
   ```
3. The script will verify Node and npm installations, verify `.env` files, build directories, install packages, offer to seed mock transactions, and launch both processes concurrently.

### Docker Orchestration

To run the entire multi-container architecture (Frontend + Backend + MongoDB) in a single setup:
```bash
docker-compose up --build
```
* **Frontend Access**: http://localhost
* **Backend API Access**: http://localhost:5001

---

## API Documentation

### Authentication Routes (`/api/auth`)

* **POST `/register`**: Create a user profile.
* **POST `/login`**: Log in using email and password.
* **POST `/logout`**: Clear tokens.
* **POST `/refresh`**: Rotate access tokens.
* **GET `/me`**: Query profile details.
* **GET `/biometrics/register-options`**: Retrieve WebAuthn passkey enrollment challenge.
* **POST `/biometrics/register-verify`**: Enroll user credential.
* **GET `/biometrics/login-options`**: Get passkey verification challenge.
* **POST `/biometrics/login-verify`**: Perform passkey verification and issue JWT.

### Expenses (`/api/expenses`)

* **POST `/`**: Add transaction (automatically calculates budget and card limits).
* **GET `/`**: Retrieve expenses list (supports `search`, `category`, `paymentMethod` filtering).
* **PUT `/:id`**: Update transaction details.
* **DELETE `/:id`**: Delete transaction.
* **POST `/bulk-delete`**: Delete multiple items by passing an array of `ids`.
* **POST `/:id/duplicate`**: Clone an expense.
* **POST `/upload-receipt`**: Process receipt upload (extracts merchant name, amount, category via mock OCR scanner).

### Cards (`/api/cards`)

* **POST `/`**: Register a card.
* **GET `/`**: Fetch card profiles.
* **PUT `/:id`**: Edit card properties.
* **DELETE `/:id`**: Delete a card.

### Budgets & Goals (`/api/budgets`, `/api/goals`)

* **GET `/budgets`**: Retrieve monthly categories budgets.
* **POST `/budgets`**: Lock category budget cap.
* **GET `/goals`**: Retrieve savings targets.
* **POST `/goals`**: Create savings target.
* **POST `/goals/:id/add-funds`**: Deposit funds into goal.
* **DELETE `/goals/:id`**: Delete goal.

### AI insights (`/api/ai`)

* **GET `/insights`**: Fetch customized credit, utilization, and budget suggestions.

---

## Seeding Credentials

If you seed the database during script setup, use these credentials to log in:
* **Email**: `demo@liquid.finance`
* **Password**: `password123`
* Once logged in, click **Set Up Passkey** to register biometrics mock Face ID authentication.
