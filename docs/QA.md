# QA report — 10 November 2026

The Crimson Society redesign supersedes the prior visual direction. See [redesign review](redesign/REVIEW.md). No backend contract or database migration changed during the redesign.

## Scope and result

LOVE is implemented as a local Next.js application. It is **not deployed, connected to production services, or open for actual reservations**. Final venue details/assets and all external project credentials remain absent. This report distinguishes real local evidence from simulated interfaces and pending provider verification.

## Verified evidence

| Check                           | Result                           | Evidence / boundary                                                                                                                                          |
| ------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TypeScript                      | PASS                             | `npm run typecheck`; strict compiler checks                                                                                                                  |
| Production build                | PASS                             | `npm run build`; all requested route families compiled/generated                                                                                             |
| Automated application/SQL tests | PASS                             | `npm test`: 47 tests across four suites                                                                                                                      |
| Actual SQL migration execution  | PASS                             | Seven migrations applied to embedded PostgreSQL with real `btree_gist` and `pgcrypto`; minimal auth/storage scaffolding emulates Supabase-owned schemas      |
| Native PostgreSQL race          | PRIOR PASS                             | Prior implementation run, unchanged SQL: PostgreSQL 18.6 temporary localhost cluster, two independently verified backend process IDs; competing approvals produced exactly one active allocation      |
| Browser suite                   | PASS                             | Playwright: 12 tests using installed Google Chrome against the production build                                                                              |
| Public routes                   | PASS                             | 14 routes, including legal drafts, invalid secure-link state, and staff login; dynamic unknown events use 404                                                |
| Runtime/image errors            | PASS                             | No `pageerror` events across the public-route sweep; rendered reference images loaded                                                                        |
| Responsive overflow             | PASS                             | 320, 390, 768, 1440, 1920px viewports, plus default desktop test viewport; representative public pages fit the viewport                                      |
| Automated accessibility         | PASS                             | Axe checks tagged WCAG 2 A/AA, 2.1 AA, and 2.2 AA on home, reserve, inquiries, events, menu, staff login; zero reported violations                           |
| Protected staff access          | PASS (unconfigured/anonymous)    | Payment-management URL redirects to staff login; no guest/payment data exposed                                                                               |
| Fail-closed services            | PASS                             | Availability returns closed/unconfigured; submissions show service-unavailable errors; missing cron credentials return 401; absent webhook setup returns 503 |
| Booking UI                      | PASS (explicit browser fixtures) | Night → section → details → terms review → PENDING_APPROVAL acknowledgment, without payment collection                                                       |
| Stripe signature boundary       | PASS (SDK + mocked persistence)  | Invalid signatures rejected; unpaid completions ignored; signed paid facts passed to settlement; DB failure returns retryable 500                            |
| Dependency audit                | PASS                             | Targeted patched overrides and upgraded toolchain reached zero reported vulnerabilities                                                                      |
| Claude independent review       | NOT RUN                          | Installed CLI reports unauthenticated; no review claimed                                                                                                     |

## Important SQL scenarios covered

- Competing guest requests do not allocate inventory.
- Competing approvals allow one active allocation; a direct overlapping insert is rejected by the PostgreSQL exclusion constraint.
- Repeated request UUID returns one existing request.
- Matching paid Checkout facts can confirm only a live hold.
- Duplicate webhook delivery returns idempotently without another payment.
- Expired hold can be reallocated; late payment becomes an exception and cannot take the replacement allocation.
- Underpayment, wrong currency, and a payment without approval do not confirm a booking.
- An extra payment does not disturb an existing confirmed allocation.
- Cancellation releases inventory and flags a paid booking for review.
- Unauthorized editor approval is rejected in PostgreSQL.
- Capacity changes cannot invalidate active guest counts.
- Failed rescheduling rolls back the original allocation.
- Blackouts cannot overlap live allocations.
- Closed deadlines and excess party sizes are rejected.
- Event cancellation cancels associated bookings without automatic refunds.
- Rate limiting is atomic; public database roles cannot read operational customer/payment data or call privileged functions.

## Browser verification details

The browser suite uses no real customer information. Its booking-flow test intercepts availability/submission with **test-only fixtures**. This proves UI behavior and payload shape, not a hosted Supabase or Stripe integration. All other unconfigured-service assertions test the actual local server responses. No successful email delivery or money movement is fabricated.

The native race test used `tests/database.integration.ts` with a temporary PostgreSQL runtime installed outside the repository. Its cluster was stopped and disposable test data removed afterward. It tested real independent database connections, not a PGlite queue. The first fixture attempted an exact microsecond boundary through a JavaScript millisecond Date; it was corrected to an arrival inside the permitted window before the successful run.

To reproduce against your own **new disposable PostgreSQL database**:

```sh
LOVE_ALLOW_DISPOSABLE_DB=true TEST_DATABASE_URL='postgresql://YOUR_TEST_CONNECTION' npm run test:db
```

Do not point that script at an existing Supabase or production database. It creates test auth/storage schemas, roles, migrations, and fixture records. Normal embedded tests do not need a database URL.

## Visual review

Desktop and small-phone redesign screenshots are saved as [preview-desktop.png](preview-desktop.png) and [preview-mobile.png](preview-mobile.png). Screenshot capture uses reduced motion so a frame during the photo-reveal animation is not mistaken for the completed page. Reference images are visibly labeled. The original ticker, decorative chapter codes, stars, vertical rails, record stamp and giant overlay wordmark have been removed. The phone composition prioritizes the booking action and then the indoor reference photograph.

## Not yet verified

Actual Supabase Auth invitations/session refresh/role isolation under real accounts; provider RLS/Storage setup and uploads; real Sanity publication and event import; genuine Stripe test Checkout/webhook delivery/refunds; genuine Resend delivery/bounces; hosted cron; notification retry behavior under provider outages; live staging rescheduling/cancellation; actual final section geometry/media; screen-reader testing; retention policy; backup restoration; performance with final venue imagery/video; custom domain and production SEO.

Automated axe checks do not establish complete WCAG conformance. Re-run against final populated content and perform keyboard/screen-reader checks. Complete [READINESS.md](READINESS.md) before opening bookings or setting the indexing flag.

## Crimson Society final verification

- Final production build and strict typecheck passed.
- All 47 application/SQL tests passed; all 12 Playwright tests passed against `next start` (production build).
- 44 backend/API/admin/CMS/SQL source files matched their pre-redesign SHA-256 hashes; manifest: `redesign/backend-preservation.json`.
- Final home preview: zero console errors, all four rendered images decoded, local Barlow Condensed font loaded, mobile document width exactly 390px.
- Full-page desktop and mobile home captures: `redesign/home-desktop-full.png` and `redesign/home-mobile-full.png`; supporting-page captures and viewport previews were refreshed from the production build.
- Reviewed desktop/home, mobile/home, The Space, Reservations and Private Events captures visually. Reference disclosures remain visible.
- Existing SQL race evidence is historical; no new native PostgreSQL concurrency run was needed for this visual-only change. Live provider checks remain pending credentials.
- Local production preview is available at http://localhost:3000; restart after source changes with `npm run build` then `npm run start`, or use `npm run dev` for editing.

## Venue content update verification

After the user supplied venue photography/menu screenshots and confirmed the rebrand location: production build passed, all 47 unit/SQL tests passed, and all 13 Playwright tests passed. The new browser case verifies food and cocktail content, Home navigation, the venue image, address/directions, gallery dialog/Escape dismissal and collection filtering. Populated menu/home pages passed the existing automated WCAG scan and viewport overflow checks. Screenshots were refreshed. `lib/content.ts` now supplies typed repository venue content when Sanity is not connected; queries for configured Sanity remain unchanged. Administration changed only an obsolete inline color-token reference. Backend business logic, APIs, migrations and payment/auth behavior were not modified by this update.
