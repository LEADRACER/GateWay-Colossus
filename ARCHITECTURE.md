# GateWay:Colossus — Architecture Blueprint

> "A mountain in front of them, impossible to climb."

---

## Data Layer — Schema & Types

### Auth Providers
- Email/password (Supabase Auth built-in)
- GitHub OAuth
- Google OAuth

### Role System

Three tiers — precise and intentional:

| Role | Who | Identified by | Default? | Can do |
|------|-----|---------------|----------|--------|
| `admin` | Akhil only | Admin email or bootstrap | No (seeded) | Everything — create/edit/delete any project, promote users via member_id |
| `member` | People Akhil chooses | `member_id` (unique numeric ID) | No | Permissions decided at the end of the build |
| `viewer` | Everyone else | Their auth UUID | Yes (on signup) | Browse public projects, view profiles |

**Member ID assignment flow:**
1. User signs up → profile created with role `viewer`, no `member_id`
2. Admin (Akhil) uses the admin panel to look up a user
3. Admin assigns them a `member_id` (auto-generated unique integer) and promotes them to `member`
4. `member_id` is the key — it's a badge number, not their auth UUID

### Core Tables

#### `profiles`
Extends Supabase `auth.users` with application-specific user data.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `auth.users.id` FK | Primary key, references auth.users |
| `member_id` | `int` | `null` | Unique numeric badge. Admin has `null` (he is above the system). Assigned by admin on member promotion. |
| `username` | `text` | — | Unique, displayed name |
| `avatar_url` | `text` | null | Profile picture |
| `bio` | `text` | null | Short bio |
| `role` | `text` | `'viewer'` | `admin` / `member` / `viewer` |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |

#### `projects`
The primary resource — community projects.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | Primary key |
| `name` | `text` | — | Project name |
| `purpose` | `text` | — | One-line purpose |
| `description` | `text` | — | Full description |
| `github_url` | `text` | null | GitHub repository link |
| `website_url` | `text` | null | Live site / demo link |
| `logo_url` | `text` | null | Project logo image |
| `tags` | `text[]` | `{}` | Tech stack / categories |
| `status` | `text` | `'active'` | `active` / `archived` / `in development` |
| `created_by` | `uuid` | — | FK → `profiles.id` |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |

> **Teams** — deferred to end of build. Not in scope for Phase 1-9.

---

### TypeScript Types

```typescript
// src/lib/types/database.ts

export type UserRole = 'admin' | 'member' | 'viewer'
export type ProjectStatus = 'active' | 'archived' | 'in development'

export interface Profile {
  id: string
  member_id: number | null   // null for admin, unique int for members
  username: string
  avatar_url: string | null
  bio: string | null
  role: UserRole              // defaults to 'viewer' on signup
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  purpose: string
  description: string
  github_url: string | null
  website_url: string | null
  logo_url: string | null
  tags: string[]
  status: ProjectStatus
  created_by: string  // profiles.id (uuid)
  created_at: string
  updated_at: string
}
```

---

### API Route Design

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/projects` | Public | List projects (paginated, filterable) |
| `POST` | `/api/projects` | Required | Create project |
| `GET` | `/api/projects/[id]` | Public | Get single project |
| `PATCH` | `/api/projects/[id]` | Required | Update project (owner/admin) |
| `DELETE` | `/api/projects/[id]` | Required | Delete project (owner/admin) |
| `GET` | `/api/profiles/[id]` | Public | Get user profile |
| `PATCH` | `/api/profiles/[id]` | Required | Update own profile |

---

### Service Layer

```
src/services/
├── projects.ts      # CRUD operations for projects
├── profiles.ts      # Profile read/update
└── auth.ts          # Auth helper functions
```

Each service function:
- Takes validated input
- Calls Supabase
- Returns typed data
- Throws on error (caught by API route handler)

---

### Route Design (Pages)

```
src/app/
├── page.tsx                           # Home — hero, featured projects, CTA
├── layout.tsx                         # Root layout (header, footer)
├── loading.tsx                        # Root loading state
├── error.tsx                          # Root error boundary
├── not-found.tsx                      # 404 page
├── projects/
│   ├── page.tsx                       # Project list (server component)
│   ├── loading.tsx                    # Projects loading skeleton
│   ├── [id]/
│   │   ├── page.tsx                   # Project detail (server component with params)
│   │   └── not-found.tsx             # 404 for missing project
│   └── new/
│       └── page.tsx                   # Create project (protected, client component)
├── auth/
│   ├── login/
│   │   └── page.tsx                   # Login form
│   ├── register/
│   │   └── page.tsx                   # Register form
│   └── callback/
│       └── route.ts                   # OAuth callback handler
└── api/
    └── projects/
        ├── route.ts                   # GET (list) + POST (create)
        └── [id]/
            └── route.ts              # GET + PATCH + DELETE
```

### Component Tree

```
src/components/
├── ui/                                # Shared primitives
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Spinner.tsx
│   ├── Badge.tsx
│   ├── Skeleton.tsx
│   ├── EmptyState.tsx
│   ├── ErrorMessage.tsx
│   └── Modal.tsx
├── features/
│   ├── project/
│   │   ├── ProjectCard.tsx           # Card for project grid
│   │   ├── ProjectDetail.tsx         # Full project view
│   │   ├── ProjectForm.tsx           # Create/edit form
│   │   └── ProjectList.tsx           # Grid wrapper with states
│   ├── auth/
│   │   ├── LoginForm.tsx             # Email/password + OAuth buttons
│   │   ├── RegisterForm.tsx          # Registration form
│   │   └── UserMenu.tsx              # Dropdown: profile, settings, logout
│   └── layout/
│       ├── Header.tsx                # Nav bar with auth state
│       ├── Footer.tsx                # Site footer
│       └── NavLink.tsx               # Active-aware navigation link
└── icons/                            # Reusable icon components or lucide imports
```

---

### Design Tokens (CSS Variables)

Keep the terminal aesthetic but expand for production:

```css
:root {
  /* Core palette */
  --color-bg: #0a0a0a;
  --color-surface: #111111;
  --color-surface-elevated: #1a1a1a;
  --color-border: #333333;
  --color-border-accent: #00ff41;
  
  /* Text */
  --color-text: #f5f5f5;
  --color-text-muted: #a3a3a3;
  --color-text-dim: #666666;
  
  /* Accent */
  --color-accent: #00ff41;
  --color-accent-dim: #00cc33;
  --color-accent-glow: rgba(0, 255, 65, 0.15);
  
  /* Semantic */
  --color-success: #00ff41;
  --color-warning: #ffaa00;
  --color-error: #ff3355;
  --color-info: #3399ff;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
}
```

---

This is the blueprint. Every decision documented so we build with intention, not by accident. When you're ready to move, I'll start Phase 2: **Foundation** — scaffold the project with Next.js, set up configs, TypeScript types, and the folder structure.
