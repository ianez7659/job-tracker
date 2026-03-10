# Jobflow – Job Tracking Dashboard

Production-style job application tracking dashboard built with **Next.js + Prisma + PostgreSQL + NextAuth**.

Designed to help you manage job applications, track interview stages, and analyze your job search activity with a clean, responsive UI.

**Live Demo:** [https://job-tracker-wheat.vercel.app/]

| | |
| :---: | :---: |
| ![1](./screenshots/jf1.png) | ![2](./screenshots/jf1d.png) |
| ![3](./screenshots/jf3.png) | ![4](./screenshots/jf3d.png) |

---

## Demo Account

**Option 1 – Use the pre-created demo account**

- **Email:** `demo@example.com`
- **Password:** `demo1234`

Visit the landing page and use "Log in to get started", or go to the [login page](https://job-tracker-wheat.vercel.app/login) and sign in with the credentials above.

**Option 2 – Register your own account**

- Go to the login page and use **"First time here? Register"** to create an account with your email and password, then sign in to go straight to the dashboard.

You can also sign in with **GitHub** or **Google** if you prefer.

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
- NextAuth.js (GitHub + Google OAuth + Credentials)

**Deployment**

- Vercel (App)
- Render PostgreSQL (database)

---

## Core Features

**Job Management**

- Add / Edit / Delete job applications
- Status workflow: Resume → Interview 1/2/3 → Offer / Rejected
- Company, position level (Intern / Co-op / Entry / Junior / Intermediate / Senior / Lead), applied date, tags, job URL
- Soft delete with restore & archive system

**Dashboard & Analytics**

- Real-time status overview (Waiting / Decided / Interviews)
- Interview progress tracking
- Charts for offer vs rejected distribution
- Search & filter functionality

**Auth & Profile**

- GitHub and Google OAuth
- Email/password registration and login
- First-time category selection (redirect to category page until set)
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
- Auth (NextAuth.js) with GitHub, Google, and credentials
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

### Option A: Run app in Docker (use existing database)

Build and run the Next.js app in a container. The app will use `DATABASE_URL` from your `.env.local` (for example, a Render or local Postgres instance):

```bash
docker compose up --build app
```

The app will be available at `http://localhost:3000`.

Stop the app:

```bash
docker compose down
```

### Option B: Run DB with Docker Compose (app on host)

Start only PostgreSQL in Docker (app runs on host with `npm run dev`):

```bash
docker compose up -d db
```

Set in `.env.local`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jobflow"
```

Then run migrations and dev server on the host:

```bash
npx prisma migrate dev
npm run dev
```

Stop the DB:

```bash
docker compose down
```

### Option C: Use an existing database

```bash
git clone https://github.com/ianez7659/job-tracker.git
cd job-tracker
npm install
```

### Create `.env.local`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Run:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Run dev server

```bash
npm run dev
```

App runs at **http://localhost:3000** (or next available port).

---

## About

Job search tracker focused on clarity and simplicity. Built to practice fullstack Next.js, Prisma, and deployment (Vercel + Render).
