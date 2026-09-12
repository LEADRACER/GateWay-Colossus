# GateWay:Colossus - Teaming System Specification

## Overview
A GitHub-native team collaboration system where users form teams, showcase projects collectively, and request featured placement on FIRED page and homepage.

---

## 1. Team Model

### Team Identity
| Field | Spec |
|-------|------|
| `name` | Human-readable, set by leader (displayed on UI) |
| `slug` | **Auto-generated**: `{name-slug}-{6-digit-code}` e.g., `frontend-wizards-a7f3k2` |
| `code` | 6-char alphanumeric (unique, used for invites/URLs) |
| `description` | Optional, markdown supported |
| `avatar_url` | Optional, team logo |
| `leader_id` | FK → `profiles.id` (creator = leader) |
| `is_locked` | Boolean, leader toggles (locked = no join requests allowed) |
| `is_public` | Boolean, discoverable in team directory |
| `member_count` | Denormalized counter |
| `created_at` | Timestamp |
| `updated_at` | Timestamp |

### Team Member Roles
| Role | Permissions |
|------|-------------|
| `leader` | Full control: edit team, lock/unlock, invite, kick, promote/demote, delete team, request showcase |
| `admin` | Invite, kick, promote/demote members, request showcase |
| `member` | View team, request showcase for own projects, leave team |

### Team Membership Flow
```
┌─────────────┐     Invite by username      ┌─────────────┐
│   Leader    │ ──────────────────────────► │   Target    │
└─────────────┘   (notification/email)      │   User      │
                                             └──────┬──────┘
                                                    │
                            ┌───────────────────────┼───────────────────────┐
                            ▼                       ▼                       ▼
                       Accept                  Decline                    Ignore
                            │                       │                       │
                            ▼                       ▼                       ▼
                       role: member          request deleted          expires in 7d
                            │
                            ▼
                       team_members++
```

**Join Requests (Public Teams):**
- Any user can request to join unlocked public teams
- Leader/admins review → accept/reject
- Auto-expire after 30 days

---

## 2. Project Ownership

### Project Types
| Type | Owner | `team_id` | `is_team_project` |
|------|-------|-----------|-------------------|
| Individual | `profiles.id` (creator) | `NULL` | `false` |
| Team | `teams.id` | `teams.id` | `true` |

### Rules
- Only **leader/admins** can create team projects
- Team projects appear on team profile page
- Individual projects remain on user profile
- Transfer: Leader can transfer individual → team (with member consent)

---

## 3. Showcase System

### Showcase Targets
| Target | Description | Visual Spec |
|--------|-------------|-------------|
| **Homepage** | "Big sophisticated dynamic realtime animated art" | Full-width canvas, WebGL/Canvas animation, interactive |
| **FIRED Page** | Appears on scroll down | Staggered reveal, card grid with entrance animations |

### Showcase Request
```typescript
interface ShowcaseRequest {
  id: UUID;
  project_id: UUID;           // Must be active, not already showcased
  requested_by: UUID;         // Leader/admin/creator
  type: 'homepage' | 'fired' | 'both';
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: UUID;
  reviewed_at?: Timestamp;
  created_at: Timestamp;
}
```

### Approval Flow
```
Member/Leader requests showcase
         │
         ▼
   ┌─────────────┐
   │ Admin Queue │ (real-time, toast notifications)
   └──────┬──────┘
          │
    ┌─────┴─────┐
    ▼           ▼
 Approve     Reject
    │           │
    ▼           ▼
Project    Notification
showcased    to requester
```

### Duration
- **Permanent** until admin manually removes
- No auto-expiry
- Admin can revoke anytime → project returns to normal listing

---

## 4. Homepage - "The Canvas"

### Visual Concept
> **Big sophisticated dynamic realtime animated art**

### Technical Requirements
- **Full viewport canvas** (WebGL via Three.js or Canvas 2D)
- **Realtime**: 60fps, responsive to:
  - Mouse/touch position (particle attraction/repulsion)
  - Scroll progress (parallax layers)
  - Time (ambient animation loops)
  - Data-driven: team/project stats feed visual parameters
- **Interactive**: Click/hover reveals team/project previews
- **Performance**: 
  - `requestAnimationFrame` loop
  - Offscreen fallback for low-end devices
  - Respects `prefers-reduced-motion`
- **Layers** (back to front):
  1. Ambient particle field (10k+ particles, GPU instanced)
  2. Team constellation nodes (connected by edges = collaborations)
  3. Project orbiting rings (size = stars, color = language)
  4. UI overlay (navigation, search, showcase cards)

### Data Feed
```typescript
interface CanvasDataPoint {
  id: string;           // team or project id
  type: 'team' | 'project';
  position: [x, y, z];  // normalized 0-1
  size: number;         // visual weight
  color: string;        // hex
  metadata: {
    name: string;
    memberCount?: number;
    stars?: number;
    language?: string;
    isShowcased: boolean;
  };
}
```

---

## 5. FIRED Page

### Behavior
- **Trigger**: Appears when user scrolls past 60% of homepage
- **Transition**: Smooth scroll-snap or sticky reveal
- **Layout**: Masonry/grid of showcased projects
- **Animation**: Staggered entrance (framer-motion), hover lift

### Content
- All projects with `showcase_type IN ('fired', 'both')`
- Card shows: repo avatar, name, team badge, stars, language, "Showcased by [Team]"
- Click → project detail page

---

## 6. Admin System

### Admin Setup
```sql
-- One-time after first GitHub login
UPDATE profiles SET role = 'admin' WHERE login = 'ADMIN_GITHUB_USERNAME';
```

### Admin Capabilities
| Area | Actions |
|------|---------|
| Showcase Requests | View queue, approve/reject with notes, revoke active showcases |
| Teams | View all, force-delete, transfer leadership |
| Users | Role management, ban/suspend |
| Analytics | Team count, project count, showcase metrics |

### Admin UI
- **Route**: `/admin/showcase-requests` (primary)
- **Real-time**: New requests appear without refresh (SSE or polling)
- **Bulk actions**: Approve/reject multiple

---

## 7. Database Schema (Reference)

```sql
-- TEAMS
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,           -- "team-name-a7f3k2"
  code CHAR(6) UNIQUE NOT NULL,        -- "a7f3k2"
  description TEXT,
  avatar_url TEXT,
  leader_id UUID NOT NULL REFERENCES profiles(id),
  is_locked BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  member_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TEAM MEMBERS
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader','admin','member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','rejected','left')),
  invited_by UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- JOIN REQUESTS
CREATE TABLE team_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- PROJECTS (extend)
ALTER TABLE projects ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN is_team_project BOOLEAN DEFAULT false;

-- SHOWCASE REQUESTS
CREATE TABLE showcase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('homepage','fired','both')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_join_requests_team ON team_join_requests(team_id);
CREATE INDEX idx_showcase_requests_status ON showcase_requests(status);
CREATE INDEX idx_projects_team ON projects(team_id);
```

---

## 8. API Contract

### Teams
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/teams` | Public | List public teams (paginated, searchable) |
| POST | `/api/teams` | User | Create team (auto-generates slug + code) |
| GET | `/api/teams/:code` | Public | Team detail (members, projects) |
| PATCH | `/api/teams/:code` | Leader | Update name, description, avatar, lock state |
| DELETE | `/api/teams/:code` | Leader | Delete team (cascades) |
| POST | `/api/teams/:code/members/invite` | Leader/Admin | Invite by GitHub username |
| PATCH | `/api/teams/:code/members/:userId` | Leader/Admin | Update role |
| DELETE | `/api/teams/:code/members/:userId` | Leader/Admin/Self | Remove member / leave |
| POST | `/api/teams/:code/join-requests` | User | Request to join (if public & unlocked) |
| GET | `/api/teams/:code/join-requests` | Leader/Admin | List pending requests |
| POST | `/api/teams/:code/join-requests/:id/accept` | Leader/Admin | Accept request |
| POST | `/api/teams/:code/join-requests/:id/reject` | Leader/Admin | Reject request |

### Projects
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/projects` | User | Create (optional `team_id` if leader/admin) |
| PATCH | `/api/projects/:id` | Owner/Leader | Update (can transfer to/from team) |

### Showcase
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/projects/:id/showcase` | Leader/Admin/Creator | Request showcase |
| GET | `/api/admin/showcase-requests` | Admin | List all (filterable) |
| PATCH | `/api/admin/showcase-requests/:id` | Admin | Approve/reject/revoke |

---

## 9. UI Routes

```
/
├── /teams                          # Team directory (search, filter)
├── /teams/new                      # Create team
├── /teams/:code                    # Team profile (tabs: Overview, Members, Projects, Join Requests)
├── /teams/:code/edit               # Team settings (leader only)
├── /projects/new                   # Updated: team selector dropdown
├── /admin/showcase-requests        # Admin queue
└── /profile/:id                    # Updated: shows teams + team projects
```

---

## 10. Component Inventory

### Team Components
| Component | Location | Props |
|-----------|----------|-------|
| `TeamCard` | `features/team/` | `team`, `variant?: 'card' \| 'compact'` |
| `TeamList` | `features/team/` | `teams`, `pagination` |
| `CreateTeamModal` | `features/team/` | `onSuccess` |
| `TeamProfile` | `features/team/` | `team`, `currentUserRole` |
| `MemberList` | `features/team/` | `members`, `currentUserRole`, `onInvite`, `onKick`, `onRoleChange` |
| `InviteMemberModal` | `features/team/` | `teamCode`, `onInvite` |
| `JoinRequestList` | `features/team/` | `requests`, `onAccept`, `onReject` |
| `TeamProjectCard` | `features/team/` | `project`, `showTeamBadge` |

### Showcase Components
| Component | Location | Props |
|-----------|----------|-------|
| `ShowcaseRequestCard` | `features/admin/` | `request`, `onApprove`, `onReject` |
| `HomepageCanvas` | `features/home/` | `dataPoints`, `showcasedProjects` |
| `FiredSection` | `features/fired/` | `projects` |

---

## 11. Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Run migration SQL
- [ ] Update `src/lib/types/database.ts`
- [ ] Create `src/services/teams.ts`
- [ ] Create `src/services/showcase.ts`
- [ ] Update `src/services/projects.ts` for team_id

### Phase 2: API Layer (Week 1-2)
- [ ] `/api/teams` (GET, POST)
- [ ] `/api/teams/:code` (GET, PATCH, DELETE)
- [ ] `/api/teams/:code/members/*`
- [ ] `/api/teams/:code/join-requests/*`
- [ ] `/api/projects/:id/showcase`
- [ ] `/api/admin/showcase-requests*`

### Phase 3: Team Pages (Week 2)
- [ ] `/teams` directory page
- [ ] `/teams/new` create page
- [ ] `/teams/:code` profile with tabs
- [ ] `/teams/:code/edit` settings
- [ ] Member management modals
- [ ] Join request review page

### Phase 4: Project Integration (Week 2-3)
- [ ] Team selector in `/projects/new`
- [ ] Team badge on `ProjectCard`
- [ ] Team projects on team profile
- [ ] Transfer project to/from team

### Phase 5: Showcase & Admin (Week 3)
- [ ] Showcase request flow
- [ ] Admin queue at `/admin/showcase-requests`
- [ ] Approve/reject with toast notifications

### Phase 6: Homepage Canvas (Week 3-4)
- [ ] Three.js/Canvas setup
- [ ] Particle system + team constellation
- [ ] Realtime data feed
- [ ] Scroll-triggered FIRED section
- [ ] Reduced motion fallback

### Phase 7: Polish (Week 4)
- [ ] Empty states, loading skeletons
- [ ] Toast notifications for all actions
- [ ] Invite email/notification (if Supabase SMTP configured)
- [ ] Search/filter on team directory
- [ ] Mobile responsive all pages

---

## 12. Environment Variables

```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NEXT_PUBLIC_SITE_URL=

# New (optional)
NEXT_PUBLIC_CANVAS_PARTICLE_COUNT=10000
NEXT_PUBLIC_FIRED_SCROLL_THRESHOLD=0.6
```

---

## 13. Future Extensibility

| Feature | Foundation Ready? |
|---------|-------------------|
| Team chat/discussions | ❌ New tables needed |
| Team analytics dashboard | ✅ Member count, project count |
| Sponsored teams | ❌ New billing tables |
| Team templates | ❌ New template system |
| Cross-team collaborations | ✅ Many-to-many via projects |

---

## 14. Notes for Next Session

1. **Start with Phase 1** - Migration + Types + Services
2. **Admin GitHub username** - Provide when ready to promote
3. **Homepage canvas** - Share design references (Three.js examples, shadertoy, etc.)
4. **FIRED page** - Clarify if separate route (`/fired`) or section on homepage
5. **Notifications** - Supabase Realtime for join requests, showcase updates?
6. **Search** - GitHub username autocomplete for invites (needs GitHub API token with `read:user`)

---

*Generated for GateWay:Colossus Teaming System v1.0*
*Last updated: 2026*