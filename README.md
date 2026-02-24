# Jobflow – Job Tracking Dashboard

Production-style job application tracking dashboard built with **Next.js + Prisma + PostgreSQL + NextAuth**.

Designed to help you manage job applications, track interview stages, and analyze your job search activity with a clean, responsive UI.

**Live Demo:** [https://job-tracker-wheat.vercel.app/]

---

## Demo Account

- Sign in with **GitHub** or **Email/Password** (register first).
- Visit the landing page and use "Log in to get started" to explore the dashboard.

---

## Tech Stack

**Frontend**

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts

**Backend**

- Next.js API Routes
- Prisma ORM
- PostgreSQL (Render)
- NextAuth.js (GitHub OAuth + Credentials)

**Deployment**

- Vercel (App)
- Render PostgreSQL (database)

---

## Core Features

**Job Management**

- Add / Edit / Delete job applications
- Status workflow: Resume → Interview 1/2/3 → Offer / Rejected
- Company, title, applied date, tags, job URL
- Soft delete with restore & archive system

**Dashboard & Analytics**

- Real-time status overview (Waiting / Decided / Interviews)
- Interview progress tracking
- Charts for offer vs rejected distribution
- Search & filter functionality

**Auth & Profile**

- GitHub OAuth
- Email/password registration and login
- Protected routes with session management

**Responsive Design**

- Mobile-first layout
- Optimized desktop navigation
- Clean component-based UI system

---

## Architecture

```
Next.js (Frontend + API)
    ↓
Prisma ORM
    ↓
PostgreSQL (Render)
```

Single codebase with separation between UI components and API route handlers.

**Project structure**

- `src/app/` – App Router pages and API routes
- `src/components/` – Reusable UI components
- `src/lib/` – Auth, Prisma client, utilities
- `prisma/` – Schema and migrations

---

## What This Project Shows

- Fullstack architecture with Next.js App Router
- REST-style API design with Next.js Route Handlers
- Auth (NextAuth.js) with GitHub and credentials
- State management and optimistic updates
- Production-style UI and responsive layout
- Deployable stack (Vercel + Render PostgreSQL)
- Reusable React components and shared types
- SEO metadata and error handling

---

## Future Improvements

- Role-based access
- Advanced filters and saved views
- Export (CSV/PDF)
- Analytics by period and position type
- Email reminders for follow-ups
- File attachments (resume, notes)

---

## Local Setup

```bash
git clone https://github.com/your-username/job-tracker.git
cd job-tracker
npm install
```

###Create `.env.local`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
```

### Run:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run dev server

```bash
npm run dev
```

App runs at **http://localhost:3000** (or next available port).

---

## About

Job search tracker focused on clarity and simplicity. Built to practice fullstack Next.js, Prisma, and deployment (Vercel + Render).
