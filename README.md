# E-Quran Academy — Learning Management System

A multi-role online Quranic education platform: students, teachers, parents, and admins each get their own portal, dashboard, and workflows. Built with React + TypeScript on the frontend and Node.js + Express + MySQL on the backend.

---

## Tech stack

| Layer        | Stack                                                                 |
| ------------ | --------------------------------------------------------------------- |
| Frontend     | React 19, TypeScript, Vite, Redux Toolkit + redux-persist, Tailwind CSS, Recharts, Lucide Icons |
| Backend      | Node.js, Express 4, MySQL 8 (mysql2/promise pool), Socket.IO          |
| Auth         | JWT (15m access / 7d refresh, with rotation), bcrypt, Google OAuth 2.0, email OTP |
| Tooling      | Nodemailer / SendGrid, Stripe, Helmet, express-rate-limit, Winston, Morgan, Swagger UI |

---

## Repository layout

```
.
├── Backend/              # Express API, MySQL data layer, auth, sockets
│   ├── config/           # db pool, passport, swagger
│   ├── controllers/      # request handlers, organised by domain
│   ├── middleware/       # auth, error handler, file upload, strict-auth
│   ├── migrations/       # versioned SQL files (000_..., 001_..., …)
│   ├── routes/           # Express route registrations
│   ├── services/         # email, otp, notifications
│   ├── scripts/migrate.js  # SQL migration runner
│   ├── utils/            # logger, response helpers, pagination
│   └── server.js
├── Frontend/             # React + Vite app
│   ├── src/api/          # typed API client (single source of truth)
│   ├── src/components/   # shared components (Layout, Toast, Charts, …)
│   ├── src/contexts/     # Toast provider
│   ├── src/hooks/        # useSocket, etc.
│   ├── src/pages/        # route components (one file per page)
│   └── src/store/        # Redux Toolkit slices + persist config
├── package.json          # monorepo root scripts (dev/install:all/build)
└── .env.example          # canonical env template
```

---

## Quick start

### Prerequisites
- Node.js 20+ and npm 10+
- MySQL 8 (or XAMPP / MariaDB 10.6+)

### 1 — Configure environment

```bash
cp .env.example .env
cp Backend/.env.example Backend/.env
cp Frontend/.env.example Frontend/.env
```

Then edit each `.env` to match your local setup. At minimum the backend needs:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=equran_academy
JWT_SECRET=...           # `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
JWT_REFRESH_SECRET=...
```

Google OAuth, Stripe and email transports are optional — leave their values blank to disable those features cleanly.

### 2 — Install dependencies

```bash
npm run install:all
```

This installs root, Backend, and Frontend packages in one shot.

### 3 — Initialise the database

```bash
cd Backend
npm run db:migrate     # apply schema (idempotent, safe to re-run)
npm run db:seed        # optional: load sample teachers, classes, etc.
# npm run db:reset     # DANGER: drops the database and re-applies everything with seeds
```

The migration runner reads every `*.sql` in `Backend/migrations/` in lexical order and tracks applied files in a `_migrations` table.

### 4 — Run the apps

From the repo root, with both servers running concurrently:

```bash
npm run dev
```

Or run them in separate shells:

```bash
npm run backend:dev    # http://localhost:5000   (API + Swagger at /api-docs)
npm run frontend:dev   # http://localhost:3000   (proxies /api -> backend)
```

---

## Authentication architecture

### Roles & approval

- **Student / Parent**: register → email-OTP verification → can log in.
- **Teacher**: register + upload required documents → admin reviews → approval grants login.
- **Admin**: only the addresses listed in `PREDEFINED_ADMIN_EMAILS` are auto-approved. Others get queued in `admin_approval_requests` and require an existing admin's approval.

### Tokens

- Access token: short-lived JWT (`JWT_ACCESS_EXPIRES_IN`, default `15m`), sent as `Authorization: Bearer …`.
- Refresh token: longer-lived JWT (`JWT_REFRESH_EXPIRES_IN`, default `7d`), stored in the `refresh_tokens` table and **rotated** on every `/api/auth/refresh` call.
- Reuse detection: if a revoked refresh token is presented again, every active session for that user is revoked.
- Logout marks the token `revoked_at = NOW()` rather than hard-deleting (audit trail).
- `npm run db:migrate` adds the `revoked_at` column on existing installs.

### Frontend session handling

- The API client (`Frontend/src/api/index.ts`) silently refreshes the access token on `TOKEN_EXPIRED` and queues concurrent requests during the refresh.
- On unrecoverable session loss, it dispatches the Redux `logout` action and calls `persistor.purge()` so no stale user state survives.

---

## API documentation

With the backend running, browse Swagger UI at:

```
http://localhost:5000/api-docs
```

The `/api/health` endpoint returns `{ status: 'ok', version }` and is safe for liveness probes.

---

## Useful commands

| From          | Command                  | What it does                                     |
| ------------- | ------------------------ | ------------------------------------------------ |
| repo root     | `npm run dev`            | Run backend + frontend concurrently              |
| repo root     | `npm run install:all`    | Install everything                               |
| repo root     | `npm run build`          | Production build of the frontend                 |
| Backend       | `npm run dev`            | nodemon-watched API server                       |
| Backend       | `npm run start`          | Production-mode API server                       |
| Backend       | `npm run db:migrate`     | Apply pending SQL migrations                     |
| Backend       | `npm run db:seed`        | Apply migrations + seed data                     |
| Backend       | `npm run db:reset`       | Drop database and reapply everything (DANGER)    |
| Frontend      | `npm run dev`            | Vite dev server on port 3000                     |
| Frontend      | `npm run build`          | Production build (`dist/`)                       |
| Frontend      | `npm run lint`           | TypeScript-only check (`tsc --noEmit`)           |

---

## Production checklist

- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` set to long random strings (the server refuses to boot otherwise in `NODE_ENV=production`).
- [ ] `FRONTEND_URL` set to the deployed origin (used for CORS + OAuth redirects). Add extras to `CORS_ORIGINS` (comma-separated) if you have staging hosts.
- [ ] MySQL user has only the privileges it needs on `equran_academy`.
- [ ] HTTPS terminator in front of the API; Helmet is already enabled.
- [ ] Logs are persisted (Winston already writes to `Backend/logs/`).
- [ ] If you use Google OAuth, add `${BACKEND_URL}/api/auth/google/callback` to the Google Cloud OAuth client's redirect URIs.
