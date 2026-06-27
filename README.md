# Jobflow – Job Tracking Dashboard

Production-grade job application tracking dashboard built with **Next.js + Prisma + PostgreSQL + NextAuth**.

Helps you manage job applications, track interview stages, build interview skills, and analyze your job search activity — with gamification, AI assistance, and a dedicated admin panel.

**Live Demo:** [https://job-tracker-wheat.vercel.app/]
**Live Demo Using Demo Account:** [https://job-tracker-wheat.vercel.app/welcome]

|                               |                               |
| :---------------------------: | :---------------------------: |
|  ![1](./screenshots/jf1.png)  | ![2](./screenshots/jf1d.png)  |
| ![3](./screenshots/jf001.png) | ![4](./screenshots/jf002.png) |
|  ![5](./screenshots/jf4.png)  | ![6](./screenshots/jf4d.png)  |

---

## Demo Account

**Option 1 – Use the pre-created demo account**

- **Email:** `demo@example.com`
- **Password:** `demo1234`

Visit the landing page and use "Log in to get started", or go to the [login page](https://job-tracker-wheat.vercel.app/welcome) and sign in with the credentials above.

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
- Recharts, Chart.js
- Zustand
- cmdk (command palette)
- react-markdown, remark-gfm
- react-easy-crop

**Backend**

- Next.js API Routes
- Prisma ORM
- PostgreSQL (Render)
- NextAuth.js (GitHub + Google OAuth + Credentials)
- OpenAI API (stage advice, ATS match, company research, business card extraction, quiz generation)
- Cheerio (JD scraping, URL metadata)
- Vercel Blob (resume / avatar storage)

**PWA**

- Custom service worker with versioned caching
- Web app manifest with share target
- iOS / Android install prompts

**Deployment**

- Vercel (App)
- Render PostgreSQL (Database)

---

## Core Features

|                               |                               |
| :---------------------------: | :---------------------------: |
| ![1](./screenshots/jf003.png) | ![2](./screenshots/jf004.png) |
| ![3](./screenshots/jf005.png) | ![4](./screenshots/jf006.png) |

**Job Management**

- Add / Edit / Delete job applications (standard and walk-in entry modes)
- Pipeline workflow: Applying → Applied → Interview 1/2/3 → Offer / Rejected
- Company, position level, applied date, tags, job URL
- Apply flow with resume PDF upload and ATS-style match vs JD
- AI-powered stage advice and expected interview questions (JD-based)
- Stale applying detection for jobs stuck in early stages
- Offer completion flow — guides users through confirming pending job offers
- Soft delete with restore and archive system

**Dashboard & Gamification**

- Real-time status overview with search and filters
- XP / Level system with daily check-in and login streak
- Daily missions and interview drill (quiz with category-based question bank + AI-generated questions)
- Interview progress tracking
- Offer vs rejected distribution charts

**AI Features**

- Stage-specific advice and expected interview questions
- ATS resume match scoring against job descriptions
- Company research with AI interview angle reports
- Business card photo extraction (company / contact info)

**Admin Panel**

- User management with role assignment and category overview
- Hired pool CRM — offer lifecycle tracking (pending → verified / inactive)
- Hired rate analytics and rankings
- Real-time notifications with polling and read tracking
- Activity log (audit trail for all admin actions)
- Command palette search and CSV export

**Auth & Profile**

- GitHub and Google OAuth
- Email/password registration and login
- Role-based access (Student / Alumni / Staff)
- First-time category selection flow
- Profile photo crop and upload
- Protected routes with session management

**Responsive Design**

- Mobile-first layout with desktop sidebar navigation
- PWA installable on iOS and Android
- Clean component-based UI system

---

## Architecture

```
Next.js (Frontend + API)
    ├── src/domains/     ← Domain logic (admin, hired)
    ├── src/lib/         ← Auth, XP, quiz, utilities
    ├── src/components/  ← Reusable UI components
    ↓
Prisma ORM
    ↓
PostgreSQL (Render)
```

**Project structure**

- `src/app/` – App Router pages and API routes (user dashboard + admin panel)
- `src/components/` – Reusable UI components
- `src/domains/` – Domain-specific business logic
- `src/lib/` – Auth, Prisma client, XP system, quiz engine, utilities
- `src/stores/` – Client state management (Zustand)
- `prisma/` – Schema and migrations
- `data/` – Static data (quiz question bank)

---

## What This Project Shows

- Fullstack architecture with Next.js App Router
- Domain-layered backend with separated business logic
- REST-style API design with Next.js Route Handlers
- Auth (NextAuth.js) with GitHub, Google, and credentials
- Role-based access control with admin panel
- AI integration (OpenAI) across multiple user-facing features
- Gamification system (XP, missions, streaks, quizzes)
- PWA with service worker and install flow
- State management and optimistic updates
- Production-style UI and responsive layout
- Deployable stack (Vercel + Render PostgreSQL)

---

## Future Improvements

- Email reminders for follow-ups
- Advanced saved views and custom filters
- Expanded analytics by period and position type

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
OPENAI_API_KEY="sk-your-key-here"

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

Full-featured job search tracker with gamification, AI assistance, and admin tools. Built with Next.js, Prisma, and deployed on Vercel + Render.
