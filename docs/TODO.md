# ✅ TODO — task board

> **Rules:** max **2** tasks in *Now*. New ideas always land in *Later* — they
> never interrupt the current task. Claude moves cards here during
> `/new-task` and `/end-day`. Humans can edit this file any time.
>
> **Format:** `T-###  (P1|P2|P3)  short name — detail`. P1 = most important.

## 🔥 Now (working on it)
- [ ] T-001 (P1) Verify & finish passenger→offer join flow — passenger joins, driver
  gets notified, driver confirms/rejects, passenger gets notified. Last commit says
  "user joins to driver offer but **not checked**". → see `docs/PLAN.md`

## 📋 Next (ready to start)
- [ ] T-002 (P1) Driver offer wizard screen (mobile, 4 steps) — create/edit offer UI
  (`driver-app-standalone/screens/OfferWizardScreen.tsx`, currently missing)
- [ ] T-003 (P2) Admin passengers page shows empty — registered passengers not listed
  at `/passengers` (`PASSENGERS_NOT_SHOWING_DEBUG.md`)

## 💡 Later / ideas (parking lot)
- [ ] T-004 (P2) Consolidate the ~48 scattered `.md` fix-notes into `docs/` + delete
  the stale `api,admin,db/tmp/` duplicates (Phase 2 of the doc cleanup)
- [ ] T-005 (P2) Booking / seat-reservation system hardening (payment hooks)
- [ ] T-006 (P3) Payments integration (cash / card)
- [ ] T-007 (P3) Ratings after trip (driver ↔ passenger)
- [ ] T-008 (P3) Map + geocoding for offer route selection
- [ ] T-009 (P3) Real-time updates (WebSocket) for offer/booking status
- [ ] T-010 (P3) Add a real test suite (none exists today)

## ✅ Done (newest on top)
- [x] Push notifications: per-app FCM tokens + driver app registration fixed — 2026
- [x] Driver offers: backend API + status machine + admin moderation UI — 2026
- [x] Driver app: offers list screen (filters, status badges) — 2026
- [x] Auth: phone OTP (Eskiz) + Google SSO + JWT — 2026
