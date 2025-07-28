# Job Tracker (`my-jobflow`)

A full-stack job application tracking web app built with [Next.js](https://nextjs.org), [Prisma](https://www.prisma.io/), and [PostgreSQL](https://www.postgresql.org/). Easily track your job applications, interview stages, and outcomes with a clean and responsive UI.

---

## Features

- ✅ Add/Edit/Delete job applications
- 🗂 Filter by status and search by company/title
- 📈 Track stats: applications, interviews, offers, rejections
- 🗑 Soft delete with trash bin
- 📱 Fully responsive (mobile-friendly)
- 🔐 Authentication-ready (if added)

---

## Tech Stack

- **Framework**: [Next.js 14 App Router](https://nextjs.org/docs/app)
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Styling**: Tailwind CSS
- **Deployment**: [Vercel](https://vercel.com)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide](https://lucide.dev)

---

## Getting Started

### 1. Clone the repository

- git clone https://github.com/your-username/job-tracker.git
- cd job-tracker

### 2. Install dependencies

- npm install

# or

- yarn install

### 3. Set up environment variables

- DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

### 4. Set up the database with Prisma

- npx prisma migrate dev --name init

### 5. Start the development server

- npm run dev

## Deployment

This project is ready to be deployed on Vercel.

# 1. Push your project to GitHub

# 2. Go to vercel.com and import your repository

# 3. Add your DATABASE_URL under Environment Variables

# 4. Click Deploy
