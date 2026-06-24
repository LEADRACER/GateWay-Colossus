<div align="center">

# GateWay:Colossus

**A community project showcase — built by the collective.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF2E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)

[Demo](https://your-demo-url.com) · [Report Bug](../../issues) · [Request Feature](../../issues)

</div>

---

## About

GateWay:Colossus is a living archive of community-built projects. Share your work, discover what others are building, and draw inspiration from the collective. A massive stone gateway rendered in Canvas stands as the centerpiece — a portal between ideas.

Paste any GitHub URL and watch your project come to life with auto-populated metadata, rendered READMEs, and live stats.

## Features

- **GitHub Integration** — Paste a URL, get stars, language, license, topics, and full README rendered with `react-markdown` + `remark-gfm`
- **Premium UI/UX** — OLED-first dark design with neon green accent, Geist typography, and OKLCH color tokens
- **Canvas Background** — Animated Colossus figure made of light, stone gateway silhouette, energy vortex, perspective grid, and 300+ live particles
- **Cursor Trail** — Neon green particle trail with glow halo following mouse movement
- **Scroll Parallax** — Multi-layer depth: stars, Colossus figure, gateway, and horizon grid all move at different rates
- **Micro-interactions** — Ripple buttons, 3D tilt cards, spring-physics press states, staggered entrances
- **Toast System** — Spring-animated notifications with 4 variants (success, error, info, warning)
- **Animated Counters** — Scroll-triggered number reveals with ease-out quart easing
- **Skeleton Screens** — Shimmer-animated loading states for all data-heavy views
- **Error Boundary** — Graceful recovery UI with "Try Again" and "Reload Page" options
- **Accessibility** — Skip-to-content link, enhanced focus rings, reduced motion support, ARIA labels
- **Responsive** — Mobile-first with touch optimizations and safe area insets

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + OKLCH color tokens |
| UI Components | Custom (Button, Card, Modal, Input, Badge, etc.) |
| Animation | Framer Motion + Canvas 2D |
| Data | Supabase (PostgreSQL + Auth + RSC) |
| Markdown | react-markdown + remark-gfm |
| Fonts | Geist Sans + Geist Mono |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project with a `projects` table (see schema below)

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

### Database Schema

```sql
create table projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  github_url text not null,
  owner text not null,
  repo_name text not null,
  repo_description text,
  repo_readme text,
  repo_language text,
  repo_topics text[],
  repo_stars integer default 0,
  repo_license text,
  repo_avatar text,
  status text default 'active',
  cached_at timestamp with time zone,
  created_by uuid references auth.users(id)
);

-- Enable RLS
alter table projects enable row level security;

-- Allow authenticated users to insert
create policy "Users can insert projects" on projects
  for insert with check (auth.role() = 'authenticated');

-- Allow anyone to read
create policy "Anyone can read projects" on projects
  for select using (true);

-- Allow owners to delete
create policy "Owners can delete projects" on projects
  for delete using (auth.uid() = created_by);

-- Allow owners to update
create policy "Owners can update projects" on projects
  for update using (auth.uid() = created_by);
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

## Project Structure

```
src/
├── app/
│   ├── (routes)/
│   │   ├── projects/
│   │   │   ├── page.tsx          # Project listing with search & filters
│   │   │   ├── new/page.tsx      # New project form
│   │   │   ├── [id]/page.tsx     # Project detail with README rendering
│   │   │   └── [id]/edit/page.tsx
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── profile/[id]/page.tsx
│   ├── globals.css               # Design system tokens + animations
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home with animated hero + stats
│   ├── loading.tsx               # Global loading state
│   ├── not-found.tsx             # 404 page
│   └── error.tsx                 # Error page
├── components/
│   ├── GatewayBackground.tsx     # Canvas: Colossus figure + gateway + particles
│   ├── CursorTrail.tsx           # Canvas: mouse-following neon trail
│   ├── features/
│   │   ├── StatsSection.tsx      # Animated counter stats
│   │   ├── layout/Header.tsx     # Sticky header with auth state
│   │   ├── project/
│   │   │   ├── ProjectCard.tsx   # 3D tilt card with hover preview
│   │   │   ├── ProjectList.tsx   # Grid with staggered entrance
│   │   │   └── NewProjectForm.tsx # GitHub URL input with preview
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       ├── RegisterForm.tsx
│   │       └── UserMenu.tsx
│   └── ui/
│       ├── AnimatedCounter.tsx   # Scroll-triggered number reveal
│       ├── Badge.tsx             # Semantic badges
│       ├── Button.tsx            # Primary button with variants
│       ├── Card.tsx              # Container with hover lift
│       ├── EmptyState.tsx        # Empty state with action
│       ├── ErrorBoundary.tsx     # Error recovery UI
│       ├── ErrorMessage.tsx      # Inline error display
│       ├── Input.tsx             # Labeled input with hints
│       ├── MarkdownRenderer.tsx   # Styled markdown prose
│       ├── Modal.tsx             # Animated modal dialog
│       ├── PageTransition.tsx    # Spring page transitions
│       ├── ProjectPreview.tsx    # Hover preview with live data
│       ├── RippleButton.tsx      # Button with ripple effect
│       ├── Skeleton.tsx          # Shimmer loading skeletons
│       ├── Spinner.tsx           # Loading spinner
│       ├── TiltCard.tsx          # 3D mouse-tracking tilt
│       └── Toast.tsx             # Toast notification system
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── types/
│       ├── database.ts
│       └── supabase.ts
└── services/
    ├── auth.ts                   # Auth helpers (signIn, signUp, OAuth)
    ├── github.ts                 # GitHub API integration
    ├── projects.ts               # Project CRUD operations
    └── profiles.ts               # Profile operations
```

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

- **Button press:** spring(400, 17) → scale(0.97)
- **Card hover:** spring(400, 17) → y(-2)
- **Entrance:** spring(260, 20) → opacity + y
- **Toast:** spring(400, 25) → opacity + y + scale

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
