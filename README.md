# E-Quran Academy LMS

A production-grade multi-role Learning Management System for online Quran education, featuring student, teacher, parent, and admin portals.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, Redux Toolkit + Persist |
| **Backend** | Node.js, Express 4, Socket.IO (real-time messaging) |
| **Database** | MySQL (mysql2 with connection pooling) |
| **Auth** | JWT (access/refresh tokens), Google OAuth 2.0, Email OTP verification |
| **Payments** | Stripe integration (JazzCash/EasyPaisa planned) |
| **Docs** | Swagger UI at `/api-docs` |

---

## Project Structure

```
equran-academy/
  Frontend/           # React SPA (Vite dev on port 3000)
    src/
      api/            # Centralized API client with token refresh
      components/     # Reusable UI components
      contexts/       # Toast notifications context
      hooks/          # Custom hooks (Socket.IO)
      pages/          # Route-level page components
      store/          # Redux store + auth slice
  Backend/            # Express REST API (port 5000)
    config/           # DB, Passport, Swagger configuration
    controllers/      # Route handlers
    middleware/       # Auth, error handling, file upload
    routes/           # Express route definitions
    services/         # Email, OTP, notification services
    utils/            # Logger, pagination, response handler
    migrations/       # SQL migration scripts
    db_setup.sql      # Unified database schema
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.0+ (or XAMPP)
- npm or yarn

### 1. Clone and Install

```bash
git clone <repository-url>
cd equran-academy
npm run install:all
```

### 2. Database Setup

1. Create the database by running the unified schema:
```bash
mysql -u root -p < Backend/db_setup.sql
```

2. If upgrading from an older version, also run the migration:
```bash
mysql -u root -p < Backend/migrations/001_strict_role_approval_system.sql
```

### 3. Environment Configuration

**Backend** - Copy and configure:
```bash
cp Backend/.env.example Backend/.env
```

Required environment variables:
- `JWT_SECRET` - Strong random string (32+ characters)
- `JWT_REFRESH_SECRET` - Strong random string (32+ characters)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - MySQL credentials
- `SMTP_USER`, `SMTP_PASS` - Email service credentials
- `ADMIN_EMAILS` - Comma-separated list of auto-approved admin emails

Optional:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `STRIPE_SECRET_KEY` - For payment processing

**Frontend** - Copy and configure:
```bash
cp Frontend/.env.example Frontend/.env.local
```

### 4. Run Development Servers

```bash
# Terminal 1: Backend
npm run backend:dev

# Terminal 2: Frontend
npm run frontend:dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api-docs

### Default Login (from seed data)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@equran.com | admin123 |
| Teacher | ahmed.teacher@equran.com | admin123 |
| Student | student@equran.com | admin123 |
| Parent | parent@equran.com | admin123 |

---

## Features

### Authentication System
- JWT access tokens (15 min) with refresh tokens (7 days)
- Global approval enforcement - unapproved users cannot access any protected route
- Google OAuth with role selection for new users
- Email OTP verification on registration
- Password reset via OTP
- Rate limiting on auth endpoints
- Login audit logging

### Role-Based Access
- **Students**: Browse/enroll in classes, messaging, progress tracking, payment
- **Teachers**: Manage classes, course content, messaging, receive payments, document upload for verification
- **Parents**: Monitor child's progress, messaging, payment management, invitation-based activation
- **Admins**: User management, teacher approval workflow, analytics, reports, contact messages

### Security
- Helmet.js security headers with CSP in production
- bcrypt password hashing (12 rounds)
- Rate limiting (auth, OTP endpoints)
- Input validation on all endpoints
- Soft-delete across all entities
- Session-based OAuth state management

### Real-Time
- Socket.IO for live notifications
- Real-time typing indicators in messaging

---

## API Endpoints

All API routes are prefixed with `/api`. Key route groups:

| Route | Purpose |
|-------|---------|
| `/api/auth/*` | Registration, login, OTP, password reset, Google OAuth |
| `/api/strict-auth/*` | Role-specific portal logins with approval checks |
| `/api/users/*` | User profile management |
| `/api/classes/*` | Class CRUD operations |
| `/api/enrollments/*` | Student enrollment management |
| `/api/messages/*` | Messaging system |
| `/api/payments/*` | Payment processing (Stripe) |
| `/api/admin/*` | Admin user management, stats |
| `/api/admin/approval/*` | Teacher approval workflow |
| `/api/dashboard/*` | Role-specific dashboard data |
| `/api/notifications/*` | Notification management |
| `/api/reviews/*` | Teacher reviews |
| `/api/courses/*` | Course content (modules/lessons) |
| `/api/contact/*` | Contact form + admin management |
| `/api/teacher/documents/*` | Teacher verification documents |
| `/api/parent/invitations/*` | Parent invitation system |

Full documentation available at `/api-docs` when the backend is running.

---

## License

Private - All rights reserved.
