# 🎓 Institute Billing & Invoicing System

> A modern, multi-tenant SaaS-ready course management, student invoicing, dynamic discount engine, and installment billing platform built for **Nimas Fashion Academy** and fully customizable for educational institutes.

---

## 🏛️ Monorepo Structure

```text
institute-billing-system/
├── institute-billing-client/   # Next.js 16 App Router Frontend (Port 3000)
│   ├── src/
│   │   ├── app/                # Pages & Layouts (Dashboard, Students, Invoices, Payments, Portal, Reports, Settings)
│   │   ├── components/         # UI Primitives, Modals, Forms & Layouts
│   │   └── lib/                # API Client, Axios & Query setup
│   └── package.json
│
├── institute-billing-server/   # NestJS 11 Modular Monolith API (Port 4000)
│   ├── prisma/
│   │   ├── schema.prisma       # MySQL Multi-Tenant Schema
│   │   └── seed.ts             # Demo Data (Courses, Discounts, Students, Invoices)
│   ├── src/                    # Feature Modules (Students, Courses, Payments, Invoices, SMS, Reports, Settings)
│   └── package.json
│
├── package.json                # Root Monorepo Orchestrator (npm workspaces)
├── .gitignore                  # Unified Git Ignore
└── README.md
```

---

## ⚡ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19) |
| **Styling & UI** | Tailwind CSS, Radix UI Primitives, [Lucide Icons](https://lucide.dev/) |
| **Client State & Forms** | TanStack React Query v5, React Hook Form, Zod |
| **Backend Framework** | [NestJS 11](https://nestjs.com/) (TypeScript, Modular Architecture) |
| **ORM & Database** | [Prisma ORM](https://www.prisma.io/) + MySQL 8.0 |
| **API Documentation** | OpenAPI 3.0 / Swagger UI (`/api/docs` & `/api/json`) |
| **Notifications** | Mock SMS Provider with Database Auditing (`SmsLog`) |

---

## 🚀 Key Features

1. **Dynamic Institute Branding (SaaS Settings):**
   - Institute Name (e.g. *Nimas Fashion Academy*), Tagline, Logo, Contact Details, Student ID Prefix, and Currency symbol can be edited anytime from the Admin Settings page.
   - Dynamic Installment Reminder window (e.g., `7` days before due date).

2. **Courses & Flexible Installment Schemes:**
   - Define courses with thumbnail, description, duration, and prices.
   - Set up custom installment schemes (e.g. Registration fee + monthly installments).

3. **Standard Student Registration:**
   - Standard field ordering (First Name, Last Name, Mobile [Required], NIC, Email, Age, Address, Notes).
   - Auto-generated sequential Student IDs (`NFA-000001`, `NFA-000002`...).
   - Live fee and installment preview during registration.

4. **Two Payment Plan Options:**
   - **Full Payment:** Settles total fee immediately with `0` balance and no future due dates.
   - **Installment Scheme:** Tracks upcoming installment due dates and payment progression.

5. **Dedicated Student Profile:**
   - Comprehensive profile page showing enrolled courses, billing timetable, payment receipts, and SMS notification logs.
   - Quick one-click payment collection directly from the profile.

6. **Passwordless Public Student Portal (`/portal`):**
   - Students search their Student ID without requiring a password.
   - Cleanly view course timetable, invoice breakdown, and receipts.
   - **Privacy Protected:** Personal NIC, home address, and internal admin notes are strictly kept private.

7. **Dynamic Discount Engine:**
   - Create Fixed LKR (e.g. *Previous Student Discount - 5,000 LKR*) or Percentage discounts (*Early Bird 10%*).
   - Transparently tracked on invoices, payment plans, and SMS messages.

8. **Payment Terminal with Overpayment & Custom Due Dates:**
   - Fast search by **NIC**, **Student ID**, **Mobile**, or **Email**.
   - Supports custom overpayments: Excess funds automatically cascade to subsequent installments.
   - Custom next installment due dates can be set directly from the payment form.

9. **SMS Notification Provider Abstraction:**
   - Automated alerts for *Enrollment Confirmation*, *Payment Receipts*, and *Upcoming Installment Reminders*.
   - Audited in the database and displayed as real-time toast notifications on the web interface.

10. **Backend-Paginated Financial Reports:**
    - Filter by date range, invoice status (`PAID`, `PARTIALLY_PAID`, `UNPAID`), course, and payment method.
    - Aggregates total invoiced, total collected, total outstanding, and discounts.

---

## 🛠️ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v20+
- [MySQL 8.0+](https://dev.mysql.com/downloads/installer/) (or Docker MySQL)
- Git

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/chamikathereal/institute-billing-system.git
cd institute-billing-system

# Install dependencies for both client and server via npm workspaces
npm install
```

### 3. Configure Database
Inside `institute-billing-server/.env`:
```env
PORT=4000
DATABASE_URL="mysql://username:password@localhost:3306/institute_billing_db"
JWT_SECRET="your_jwt_secret_key"
FRONTEND_URL="http://localhost:3000"
```

### 4. Push Schema & Seed Database
```bash
# Push Prisma schema to MySQL
cd institute-billing-server
npx prisma db push

# Seed initial courses, discounts, and sample students
npx tsx prisma/seed.ts
cd ..
```

### 5. Run the Application
From the root directory:

```bash
# Terminal 1: Start Backend API (Port 4000)
npm run dev:server

# Terminal 2: Start Frontend Web App (Port 3000)
npm run dev:client
```

- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Public Student Portal:** [http://localhost:3000/portal](http://localhost:3000/portal)
- **Backend API:** [http://localhost:4000/api](http://localhost:4000/api)
- **Swagger Documentation:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## 📄 License
This project is licensed under the MIT License.
