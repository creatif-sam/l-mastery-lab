# Language Mastery Lab (LML)

> A collaborative language-learning platform powered by **Next.js 15**, **Supabase**, and **AI-assisted pedagogy**. Students, tutors, and administrators interact in a structured environment designed to accelerate language acquisition through lessons, quizzes, community, and real-time mentorship.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
  - [Student Dashboard](#student-dashboard)
  - [Tutor Dashboard](#tutor-dashboard)
  - [Admin Panel](#admin-panel)
  - [Public Pages](#public-pages)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Security](#security)

---

## Overview

Language Mastery Lab is a **multi-role SaaS platform** where:

| Role | What they do |
|------|------|
| **Student** | Take lessons, attempt quizzes, track XP & rankings, join groups, message tutors, read blogs |
| **Tutor** | Manage assigned students, create/grade quizzes, post blogs, send notifications |
| **Admin** | Full platform oversight — users, analytics, mail campaigns, community moderation, platform logs |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router, Server Components) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 + `tailwindcss-animate` |
| UI Components | Radix UI primitives + custom shadcn/ui-style components |
| Auth & DB | [Supabase](https://supabase.com/) (Auth, PostgreSQL, RLS, Realtime) |
| Email | [Resend](https://resend.com/) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Toasts | [Sonner](https://sonner.emilkowal.ski/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Hosting | Vercel (recommended) |

---

## Features

### Student Dashboard

- **Home** — Personalized greeting, XP progress, group stats, upcoming meeting cards, phrase of the day
- **Lessons** — Categorised lesson modules with completion tracking
- **Quiz** — Timed quizzes with score recording and history
- **Rankings** — Leaderboard within organization and groups
- **Community** — Posts, replies, reactions; community point system
- **Blog** — Read and share published blog posts
- **Messages / Inbox** — Direct messaging with tutors
- **Network** — Find and connect with language partners
- **Notifications** — Real-time bell with unread badge
- **Settings** — Profile, target language, level, country

> **Copy protection** is enforced on all student pages — text selection, clipboard events, right-click, and keyboard shortcuts (`Ctrl+C`, `Ctrl+A`, `Ctrl+S`, `PrtSc`, etc.) are blocked and a Sonner toast informs the student why.

---

### Tutor Dashboard

- Manage assigned students and groups
- Create and publish lessons / quizzes
- Blog authoring with draft/publish workflow
- Community moderation tools
- Direct messaging
- Notification management

---

### Admin Panel

Located at `/protected/admin`, role-gated to `admin`.

| Section | Path | What it shows |
|---------|------|---------------|
| **Overview** | `/admin` | KPI cards, recent users, top learners, weekly activity |
| **Users** | `/admin/users` | Full user list with role, language, level, XP |
| **Tutors** | `/admin/tutors` | Tutor-specific management |
| **Analytics** | `/admin/analytics` | Role breakdown, language distribution, level buckets |
| **Community** | `/admin/community` | Moderate community posts |
| **Messages** | `/admin/messages` | Platform-wide message view |
| **Mail Campaigns** | `/admin/mail` | Send bulk email campaigns via Resend |
| **Blog** | `/admin/blog` | Approve / manage blog posts |
| **Notifications** | `/admin/notifications` | Send platform notifications |
| **Platform Logs** | `/admin/logs` | Real-time activity feed — who did what, when, from where |
| **Settings** | `/admin/settings` | Platform configuration |

---

### Public Pages

| Route | Description |
|-------|-------------|
| `/` | Marketing hero with collaborative animation |
| `/learn-more` | Feature breakdown and onboarding CTA |
| `/blog` | Public blog index |
| `/blog/[id]` | Individual blog post with share button |
| `/contact` | Contact form |
| `/auth/login` | Login form |
| `/auth/sign-up` | Registration form |
| `/auth/forgot-password` | Password reset request |
| `/auth/update-password` | Set new password (from email link) |

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── contact/          # Contact form handler
│   │   ├── log/              # Platform activity log ingest
│   │   ├── mail/send/        # Resend email dispatch
│   │   ├── notifications/    # Notification API
│   │   └── track/            # Page-view tracker
│   ├── auth/                 # Auth pages
│   ├── blog/                 # Public blog
│   ├── contact/              # Contact page
│   ├── learn-more/           # Marketing page
│   └── protected/
│       ├── admin/            # Admin panel (role=admin only)
│       ├── student-board/    # Student dashboard
│       └── tutor/            # Tutor dashboard
├── components/
│   ├── copy-protection.tsx   # Client-side copy/screenshot guard
│   ├── notifications/
│   ├── messaging/
│   ├── leaderboard/
│   └── ui/
├── lib/
│   ├── log-activity.ts       # Client helper to log platform activities
│   ├── utils.ts
│   └── supabase/
└── supabase/
    └── migrations/
```

---

## Database Schema

| Table | Purpose |
|-------|--------|
| `profiles` | User data — name, role, XP, level, group, org, language |
| `lessons` | Lesson content with category, order, media |
| `lesson_categories` | Localised category names (EN / FR) |
| `user_lesson_progress` | Per-user lesson completion tracking |
| `quiz_attempts` | Quiz submissions with scores |
| `community_posts` | Community feed posts and replies |
| `blog_posts` | Blog entries with draft/published status |
| `notifications` | In-app notification records |
| `page_views` | Page-view events (anonymous + authenticated) |
| `platform_logs` | Structured activity log — user, action, entity, metadata, IP |
| `contact_messages` | Contact form submissions |

All tables have **Row Level Security (RLS)** enabled.

---

## Environment Variables

Create a `.env.local` file at the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend (email)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# App URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

> Never commit `.env.local` to version control.

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A [Supabase](https://supabase.com/) project with migrations applied
- (Optional) A [Resend](https://resend.com/) account

### Install & Run

```bash
# 1. Clone
git clone https://github.com/your-org/language-mastery-lab.git
cd language-mastery-lab

# 2. Install
npm install

# 3. Configure .env.local
cp .env.example .env.local

# 4. Apply migrations
supabase db push
# or run files in supabase/migrations/ via the Supabase SQL editor

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm run start
```

---

## Deployment

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com/)
3. Add environment variables in the Vercel dashboard
4. Deploy — Vercel auto-detects Next.js settings

---

## Security

| Measure | Detail |
|---------|--------|
| **Row Level Security** | Every Supabase table has RLS; policies enforce role-based access |
| **Server-side auth** | Every protected page validates session + role before rendering |
| **Copy protection** | Student pages block clipboard, right-click, print & screenshot shortcuts |
| **Env isolation** | `SUPABASE_SERVICE_ROLE_KEY` is server-only, never exposed client-side |
| **Email confirmation** | Sign-up requires email verification |
| **Admin-only routes** | All `/protected/admin/*` routes redirect non-admins |

---

## License

Proprietary — Language Mastery Lab © 2026. All rights reserved.

## Features

- Works across the entire [Next.js](https://nextjs.org) stack
  - App Router
  - Pages Router
  - Proxy
  - Client
  - Server
  - It just works!
- supabase-ssr. A package to configure Supabase Auth to use cookies
- Password-based authentication block installed via the [Supabase UI Library](https://supabase.com/ui/docs/nextjs/password-based-auth)
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Components with [shadcn/ui](https://ui.shadcn.com/)
- Optional deployment with [Supabase Vercel Integration and Vercel deploy](#deploy-your-own)
  - Environment variables automatically assigned to Vercel project

## Demo

You can view a fully working demo at [demo-nextjs-with-supabase.vercel.app](https://demo-nextjs-with-supabase.vercel.app/).

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&project-name=nextjs-with-supabase&repository-name=nextjs-with-supabase&demo-title=nextjs-with-supabase&demo-description=This+starter+configures+Supabase+Auth+to+use+cookies%2C+making+the+user%27s+session+available+throughout+the+entire+Next.js+app+-+Client+Components%2C+Server+Components%2C+Route+Handlers%2C+Server+Actions+and+Middleware.&demo-url=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&demo-image=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2Fopengraph-image.png)

The above will also clone the Starter kit to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-run-locally).

## Clone and run locally

1. You'll first need a Supabase project which can be made [via the Supabase dashboard](https://database.new)

2. Create a Next.js app using the Supabase Starter template npx command

   ```bash
   npx create-next-app --example with-supabase with-supabase-app
   ```

   ```bash
   yarn create next-app --example with-supabase with-supabase-app
   ```

   ```bash
   pnpm create next-app --example with-supabase with-supabase-app
   ```

3. Use `cd` to change into the app's directory

   ```bash
   cd with-supabase-app
   ```

4. Rename `.env.example` to `.env.local` and update the following:

  ```env
  NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[INSERT SUPABASE PROJECT API PUBLISHABLE OR ANON KEY]
  ```
  > [!NOTE]
  > This example uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, which refers to Supabase's new **publishable** key format.
  > Both legacy **anon** keys and new **publishable** keys can be used with this variable name during the transition period. Supabase's dashboard may show `NEXT_PUBLIC_SUPABASE_ANON_KEY`; its value can be used in this example.
  > See the [full announcement](https://github.com/orgs/supabase/discussions/29260) for more information.

  Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` can be found in [your Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true)

5. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The starter kit should now be running on [localhost:3000](http://localhost:3000/).

6. This template comes with the default shadcn/ui style initialized. If you instead want other ui.shadcn styles, delete `components.json` and [re-install shadcn/ui](https://ui.shadcn.com/docs/installation/next)

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.

## Feedback and issues

Please file feedback and issues over on the [Supabase GitHub org](https://github.com/supabase/supabase/issues/new/choose).

## More Supabase examples

- [Next.js Subscription Payments Starter](https://github.com/vercel/nextjs-subscription-payments)
- [Cookie-based Auth and the Next.js 13 App Router (free course)](https://youtube.com/playlist?list=PL5S4mPUpp4OtMhpnp93EFSo42iQ40XjbF)
- [Supabase Auth and the Next.js App Router](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs)
