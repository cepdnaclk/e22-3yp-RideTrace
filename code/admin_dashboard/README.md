# RideTrace — Hardware Provisioning & Admin Portal

The **RideTrace Admin Portal** is a full-stack web application used to register ESP32 hardware units into inventory, print physical unit identification labels, assign modules to customer email accounts, dispatch verification links, and synchronize device records with **Firebase Realtime Database**.

---

## Key Features

- **Hardware Inventory Registration:** Register assembled ESP32 modules using only the `Device Serial ID` (e.g., `RT-001`) and `Firmware Version`. Motorcycle details are optional and can be added later at the point of sale.
- **Box Unit Identification Labels:** Generate and print QR unit stickers (`Serial ID` + `Firmware Version`) for physical hardware packaging and inventory lookup.
- **Customer Email Assignment & Verification Link Flow:**
  1. Assign a customer's email address to a hardware unit in the portal.
  2. The backend generates a time-limited verification link (`/api/modules/verify?token=...`) and dispatches a verification email (with a built-in interactive preview for local testing).
  3. When the customer clicks **Verify Email & Activate Device**, the module status automatically transitions to `ACTIVE`, allowing the customer to sign into the **RideTrace Mobile App** with that email and immediately access their linked module.
- **Role-Based Access Control (RBAC):**
  - **Primary Administrator (`SUPER_ADMIN`):** Full portal access, including permanent module deletion (`DELETE /api/modules/:serial`).
  - **Provisioning Operator (`OPERATOR`):** Can register modules, assign customer emails, resend verification links, and print box labels, but cannot delete modules.
- **Real-Time Database Synchronization:** Automatically syncs module creation, updates, and deletions with **Firebase Realtime Database** (`/bikes/:serial` and `/telemetry/:serial`) alongside the local JSON store (`server/data/vault.json`).
- **Activity & Audit Trail:** Records all administrative logins, module registrations, customer assignments, email verifications, ownership revocations, and deletions.

---

## Folder Structure

```text
admin_dashboard/
├── client/                     # React + TypeScript + Vite + Tailwind CSS Frontend (Port 5173)
│   └── src/
│       ├── api/client.ts       # Typed REST API client with JWT bearer auth
│       ├── components/         # Modals, Navbar, KPI Ribbon, Audit Trail View
│       ├── types/module.ts     # Shared TypeScript interfaces
│       └── App.tsx             # Main dashboard view & role-based actions
├── server/                     # Node.js + Express + TypeScript Backend API (Port 5000)
│   ├── data/vault.json         # Local JSON persistence store
│   ├── src/
│   │   ├── config/env.ts       # Environment & database configuration
│   │   ├── middleware/         # JWT authentication & SUPER_ADMIN role guards
│   │   ├── routes/             # Auth & module provisioning REST endpoints
│   │   └── services/           # Database sync (Firebase/Local) & SMTP mailer
│   └── .env.example            # Template for server environment variables
└── start_admin_portal.bat      # One-click Windows launcher for backend & frontend
```

---

## Getting Started

### 1. Install Dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Configure Environment Variables

Copy `server/.env.example` to `server/.env` and update values as needed:

```bash
cp server/.env.example server/.env
```

### 3. Start the Application

On Windows, double-click `start_admin_portal.bat`, or run two terminals:

**Terminal 1 — Backend API (`http://localhost:5000`):**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend UI (`http://localhost:5173`):**
```bash
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Default Role Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Primary Admin (`SUPER_ADMIN`)** | `admin@ridetrace.lk` | `RideTrace@2026` | Full access (Register, Assign, Revoke, **Delete Modules**) |
| **Operator (`OPERATOR`)** | `operator@ridetrace.lk` | `Operator@2026` | Standard access (Register, Assign, Revoke — **No Delete**) |

---

## REST API Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate admin/operator and issue JWT |
| `GET` | `/api/auth/me` | Admin JWT | Get current session profile and role |
| `GET` | `/api/modules` | Admin JWT | List all modules and summary KPIs |
| `POST` | `/api/modules` | Admin JWT | Register a new hardware module into stock |
| `POST` | `/api/modules/:serial/assign` | Admin JWT | Assign customer email & send verification link |
| `POST` | `/api/modules/:serial/resend` | Admin JWT | Re-issue verification link and resend email |
| `GET` | `/api/modules/:serial/email-preview` | Admin JWT | Preview the generated verification email HTML |
| `GET` | `/api/modules/verify?token=...` | Public Link | Customer email verification callback (sets status to `ACTIVE`) |
| `POST` | `/api/modules/:serial/revoke` | Admin JWT | Revoke customer ownership and reset module to `UNASSIGNED` |
| `DELETE` | `/api/modules/:serial` | `SUPER_ADMIN` | Permanently delete module from inventory and Firebase RTDB |
| `GET` | `/api/modules/audit-logs` | Admin JWT | Retrieve activity and audit trail |
