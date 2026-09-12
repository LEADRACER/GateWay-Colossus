# Teaming System - Implementation Checklist

## Quick Reference for Future Sessions

---

### ✅ Phase 1: Database & Types
- [ ] Run `supabase-teams-migration.sql` in Supabase SQL Editor
- [ ] Update `src/lib/types/database.ts` with Team, TeamMember, TeamJoinRequest, ShowcaseRequest interfaces
- [ ] Create `src/services/teams.ts`
- [ ] Create `src/services/showcase.ts`
- [ ] Update `src/services/projects.ts` (add team_id params)

### ✅ Phase 2: API Routes
- [ ] `GET/POST /api/teams`
- [ ] `GET/PATCH/DELETE /api/teams/:code`
- [ ] `POST /api/teams/:code/members/invite`
- [ ] `PATCH/DELETE /api/teams/:code/members/:userId`
- [ ] `POST /api/teams/:code/join-requests`
- [ ] `GET /api/teams/:code/join-requests`
- [ ] `POST /api/teams/:code/join-requests/:id/accept`
- [ ] `POST /api/teams/:code/join-requests/:id/reject`
- [ ] `POST /api/projects/:id/showcase`
- [ ] `GET/PATCH /api/admin/showcase-requests`
- [ ] `PATCH /api/admin/showcase-requests/:id`

### ✅ Phase 3: Team Pages
- [ ] `/teams` - Directory with search/filter
- [ ] `/teams/new` - Create team modal/page
- [ ] `/teams/:code` - Profile (Overview | Members | Projects | Join Requests)
- [ ] `/teams/:code/edit` - Settings (lock/unlock, description, avatar)
- [ ] Member management: invite modal, role dropdown, kick confirm
- [ ] Join request review page

### ✅ Phase 4: Project Integration
- [ ] Team selector in `/projects/new` (only for leaders/admins)
- [ ] Team badge on `ProjectCard` component
- [ ] Team projects tab on team profile
- [ ] Transfer project to/from team (leader only)

### ✅ Phase 5: Showcase & Admin
- [ ] Showcase request button on project detail (leader/admin/creator)
- [ ] Admin queue at `/admin/showcase-requests`
- [ ] Real-time toast for new requests
- [ ] Approve/reject with notes modal
- [ ] Revoke showcase action

### ✅ Phase 6: Homepage Canvas (The Art)
- [ ] Three.js/Canvas setup with `requestAnimationFrame`
- [ ] Particle system (GPU instanced, 10k+)
- [ ] Team constellation nodes + edges
- [ ] Project orbiting rings
- [ ] Mouse/touch interaction (attraction/repulsion)
- [ ] Scroll progress → animation parameters
- [ ] `prefers-reduced-motion` fallback (static image)
- [ ] Data feed from `/api/teams` + `/api/projects`
- [ ] Scroll-triggered FIRED section reveal

### ✅ Phase 7: FIRED Page
- [ ] Staggered entrance animations (framer-motion)
- [ ] Masonry grid of showcased projects
- [ ] Team badge, "Showcased by [Team]"
- [ ] Infinite scroll / pagination

### ✅ Phase 8: Polish
- [ ] Empty states (no teams, no members, no requests)
- [ ] Loading skeletons everywhere
- [ ] Toast notifications (invite sent, request accepted, showcase approved)
- [ ] Invite email via Supabase SMTP (if configured)
- [ ] GitHub username autocomplete for invites
- [ ] Mobile responsive all pages
- [ ] SEO meta tags for team pages

---

## 🔑 Pending from User

| Item | Status |
|------|--------|
| Admin GitHub username | ⏳ Waiting |
| Homepage canvas design references | ⏳ Waiting |
| FIRED page: separate route or section? | ⏳ Waiting |
| Supabase SMTP configured for emails? | ⏳ Unknown |

---

## 📁 Files to Create/Modify

### New Files
```
src/lib/types/database.ts          (extend)
src/services/teams.ts
src/services/showcase.ts
src/app/api/teams/route.ts
src/app/api/teams/[code]/route.ts
src/app/api/teams/[code]/members/invite/route.ts
src/app/api/teams/[code]/members/[userId]/route.ts
src/app/api/teams/[code]/join-requests/route.ts
src/app/api/teams/[code]/join-requests/[id]/accept/route.ts
src/app/api/teams/[code]/join-requests/[id]/reject/route.ts
src/app/api/projects/[id]/showcase/route.ts
src/app/api/admin/showcase-requests/route.ts
src/app/api/admin/showcase-requests/[id]/route.ts
src/app/teams/page.tsx
src/app/teams/new/page.tsx
src/app/teams/[code]/page.tsx
src/app/teams/[code]/edit/page.tsx
src/app/teams/[code]/members/page.tsx
src/app/teams/[code]/join-requests/page.tsx
src/app/admin/showcase-requests/page.tsx
src/components/features/team/TeamCard.tsx
src/components/features/team/TeamList.tsx
src/components/features/team/CreateTeamModal.tsx
src/components/features/team/TeamProfile.tsx
src/components/features/team/MemberList.tsx
src/components/features/team/InviteMemberModal.tsx
src/components/features/team/JoinRequestList.tsx
src/components/features/team/TeamProjectCard.tsx
src/components/features/admin/ShowcaseRequestCard.tsx
src/components/features/home/HomepageCanvas.tsx
src/components/features/fired/FiredSection.tsx
```

### Modified Files
```
src/lib/types/database.ts
src/services/projects.ts
src/app/projects/new/page.tsx
src/components/features/project/ProjectCard.tsx
src/app/profile/[id]/page.tsx
src/app/admin/layout.tsx (add showcase-requests nav)
```

---

## 🚀 Next Session Start Command

```bash
# 1. Run migration in Supabase
# 2. Start with Phase 1: Types + Services
# 3. Then Phase 2: API Routes
```

---

*Checklist generated for GateWay:Colossus Teaming System*