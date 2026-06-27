<div align="center">

# GateWay:Colossus

**A community project showcase — discover, explore, and share open-source projects.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF2E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

[Demo](https://gateway-colossus.vercel.app) · [Report Bug](../../issues) · [Request Feature](../../issues)

</div>

---

## About

GateWay:Colossus is a living archive of community-built projects. Share your work, discover what others are building, and draw inspiration from the collective. Paste any GitHub URL and watch your project come to life with auto-populated metadata, rendered READMEs, and live stats.

## Features

### Core
- **GitHub Integration** — Paste a URL, get stars, language, license, topics, and full README rendered with `react-markdown` + `remark-gfm`
- **Search & Filter** — Full-text search across all projects, filter by category, language, and status
- **Pagination** — 20 projects per page with page controls
- **Trending** — Sort by stars, newest, or trending score
- **Bookmarks** — Save projects to a personal bookmarks page
- **Comments** — Discuss projects with threaded comments
- **Social Actions** — Like and bookmark projects with live counts
- **Project Cards** — Hover preview with key metrics, 3D tilt effect

### Auth & Users
- **Supabase Auth** — Email/password, GitHub OAuth, Google OAuth
- **Password Reset** — Forgot password and reset password flows with email verification
- **Role System** — Admin, member, viewer roles with granular permissions
- **Admin Dashboard** — Moderation, categories, API keys, webhooks, permissions management
- **Permission Requests** — Request elevated permissions from admins

### Admin Panel
- **Moderation** — Approve/reject pending projects with GitHub sync button
- **Webhooks** — Create/manage webhooks with event selection, delivery logs, and retry
- **API Keys** — Generate and revoke API keys (v1 API)
- **Permissions** — Manage user roles and add-project permissions
- **Categories** — Curate project categories
- **Settings** — Site configuration
- **Users** — User management

### API
- **REST API (v1)** — Query projects, get by ID, with pagination, filtering, sorting
- **Webhook Events** — `project.created`, `project.liked`, `project.commented`, `project.archived`
- **Webhook Signing** — HMAC-SHA256 payload verification
- **Webhook Retry** — Retry failed deliveries from the admin UI with logging

### GitHub Sync
- **Auto-sync** — Fetch fresh repo data (stars, README, topics) on demand
- **Refresh Button** — One-click refresh on any project detail page
- **Admin Sync** — Sync pending projects from the moderation panel

### SEO & Deployment
- **Dynamic OG Metadata** — Server-generated Open Graph tags per project
- **Sitemap** — Auto-generated `sitemap.xml` with all static + project routes
- **Robots.txt** — Generated with admin/api disallow rules
- **Vercel-Ready** — `vercel.json`, environment variable documentation, zero-config deploy

### Premium UI/UX
- **OLED-first dark design** with neon green accent, Geist typography, OKLCH color tokens
- **Animated Canvas Background** — Colossus figure, stone gateway, energy vortex, perspective grid, 300+ particles
- **Cursor Trail** — Neon particle trail following mouse movement
- **Scroll Parallax** — Multi-layer depth animation
- **Micro-interactions** — Spring-animated buttons, 3D tilt cards, staggered entrances
- **Toast System** — Spring-animated notifications (success, error, info, warning)
- **Animated Counters** — Scroll-triggered number reveals
- **Skeleton Screens** — Shimmer-animated loading states
- **Error Boundary** — Graceful recovery UI
- **Accessibility** — Skip-to-content link, focus rings, reduced motion support, ARIA labels
- **Responsive** — Mobile-first design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + OKLCH color tokens |
| UI Components | Custom (Button, Card, Modal, Input, Badge, Spinner, etc.) |
| Animation | Framer Motion + Canvas 2D |
| Database/Auth | Supabase (PostgreSQL + Auth + SSR) |
| Markdown | react-markdown + remark-gfm |
| Fonts | Geist Sans + Geist Mono |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/LEADRACER/GateWay-Colossus.git
cd GateWay-Colossus

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
# Start the dev server
npm run dev

# Open http://localhost:3000
```

### Build

```bash
npm run build
npm start
```

## Database Schema

The project uses 15+ tables. Key tables include:

- `profiles` — User profiles linked to auth.users
- `projects` — Project metadata, repo info, README, stars, topics
- `project_readme` — Full README content (separate table for large text)
- `bookmarks` — User project bookmarks with unique constraint
- `comments` — Project comments with profile join
- `activities` — Activity feed (likes, bookmarks, comments, project creation)
- `permission_requests` — Role elevation requests
- `webhooks` / `webhook_deliveries` — Outbound webhook configuration and logs
- `sync_jobs` — GitHub sync job history
- `api_keys` — API key management

Full migrations in `supabase/migrations/`.

## Project Structure

```
src/
├── app/
│   ├── admin/                    # Admin dashboard (6 pages)
│   ├── api/                      # API routes (REST v1, projects, webhooks)
│   ├── auth/                     # Auth pages (login, register, password reset)
│   ├── bookmarks/                # Personal bookmarks
│   ├── profile/[id]/             # User profiles
│   ├── projects/                 # Project listing, detail, new, edit
│   ├── trending/                 # Trending projects
│   ├── globals.css               # Design system tokens + animations
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home with animated hero + stats
│   ├── sitemap.ts                # Auto-generated sitemap
│   └── robots.ts                 # Robots.txt config
├── components/
│   ├── features/                 # Feature components (layout, auth, project)
│   └── ui/                       # Design system components (18+ primitives)
├── lib/
│   ├── supabase/                 # Client, server, middleware clients
│   └── types/                    # TypeScript types
└── services/
    ├── auth.ts                   # Auth helpers (signIn, signUp, OAuth, password reset)
    ├── github.ts                 # GitHub API integration
    ├── projects.ts               # Project CRUD
    ├── discovery.ts              # Search, filter, pagination
    ├── social.ts                 # Bookmarks, likes, comments
    ├── integrations.ts           # Webhook management + delivery
    └── admin.ts                  # Moderation, permissions
```

## Deploy to Vercel

1. Push to GitHub:
   ```bash
   git push origin main
   ```

2. Import the repository in the [Vercel Dashboard](https://vercel.com/new)

3. Set environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key

4. Deploy — Vercel auto-detects the Next.js framework

## API Usage

### REST API (v1)

```bash
# List projects (paginated)
curl https://gateway-colossus.vercel.app/api/v1/projects?limit=10&offset=0

# Get a single project
curl https://gateway-colossus.vercel.app/api/v1/projects/{id}

# Filter by category and sort
curl 'https://gateway-colossus.vercel.app/api/v1/projects?category=web-app&sort=stars&limit=20'
```

### Webhooks

Configure webhooks in the admin panel to receive events:

- `project.created` — A new project is added
- `project.liked` — A project receives a like
- `project.commented` — A new comment is posted
- `project.archived` — A project is archived
- `*` — All events

Deliveries include HMAC-SHA256 signed payloads for verification.

## Design System

### Colors (OKLCH)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `oklch(0.0 0 0)` | OLED black background |
| `--color-surface` | `oklch(0.07 0.005 145)` | Card backgrounds |
| `--color-accent` | `oklch(0.75 0.25 145)` | Neon green primary |
| `--color-text` | `oklch(0.95 0.005 145)` | Primary text |
| `--color-text-muted` | `oklch(0.65 0.015 145)` | Secondary text |

### Typography

- **Headings:** Geist Sans (variable)
- **Body:** Geist Sans (variable)
- **Code:** Geist Mono (variable)

### Motion

- **Button press:** `spring(400, 17)` → `scale(0.97)`
- **Card hover:** `spring(400, 17)` → `y(-2)`
- **Entrance:** `spring(260, 20)` → opacity + y
- **Toast:** `spring(400, 25)` → opacity + y + scale

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

---

<div align="center">

Built by Akhil · Powered by the collective

</div>
