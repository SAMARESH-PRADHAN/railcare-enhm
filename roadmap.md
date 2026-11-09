# EnHM Management System — Build Roadmap

## Foundation (done first)
- [x] Data model + TypeScript types (src/data/types.ts)
- [x] Demo seed data (src/data/seed.ts) — 11 stations, 3 CHIs, 2 clerks, officer, admin
- [x] Shared localStorage store + actions (src/lib/store.tsx)
- [x] Status derivation helpers (src/lib/derive.ts)
- [x] Design system (src/styles.css) + root shell/fonts (src/routes/__root.tsx)
- [x] Role selection home (/)

## Shell & shared
- [x] AppShell: sidebar + header + mobile bottom nav + role switcher
- [x] Questions & Assumptions drawer (all roles)
- [x] Shared: StatusBadge, PageHeader, StatCard, EmptyState, ConfirmDialog, SampleBanner

## Role workspaces
- [x] Officer dashboard (Needs attention / Cleared by Clerks / Grid, layout toggle)
- [x] Officer: exceptions, verifications, contracts
- [x] Clerk dashboard (worklist, send back / clear with mandatory notes, carried-forward)
- [x] Clerk: verification history
- [x] CHI mobile-first dashboard (phone frame on desktop, offline sync demo indicator)
- [x] CHI task entry (solid waste + MRF, out-of-range remark rule, photo attach)
- [x] CHI corrections (sent back) + history

## Modules
- [x] Activity 2 — Solid Waste daily reporting (/activities/2)
- [x] Activity 9 — MRF plastic baling: daily, monthly, auctions, contracts (/activities/9)
- [x] Activity catalogue (31 activities, 29 upcoming with client-doc previews)
- [x] Contract alerts page

## Admin
- [x] Admin dashboard, users (CHI/Clerk/Officer tabs), stations, assignments
- [x] Leave & reassignment with history
- [x] Activity configuration, reporting rules, range configuration
- [x] Reports overview, audit trail, demo settings

## Shared pages & polish
- [x] Stations directory + station details, Users directory + details
- [x] Assumptions page, Reports overview, Audit trail, Demo settings, contract alerts, activity catalogue
- [x] Complete missing shared navigation destinations and user profiles
- [x] Responsive pass (mobile), accessibility (icons+text statuses), visual polish
- [ ] Verify full demo flow end-to-end in browser
