# Production readiness checklist

Status: **not approved for public launch**. This file separates implemented work from provider-dependent acceptance checks.

## Implemented locally

- [x] Native Next.js/TypeScript/Tailwind application and lockfile
- [x] All requested public routes, responsive navigation, event browser, menu, media gallery, inquiry form
- [x] Honest unpublished-content states; historical details withheld
- [x] Guest booking flow, capacity-aware list and verified-layout map support
- [x] PostgreSQL schema, private operational RLS, exclusion constraints, service-only functions
- [x] Approval, temporary hold, expiry, verified-payment settlement, replay protection
- [x] Late/mismatched payment exceptions and refund workflow
- [x] Staff authentication integration, server role checks, audit history
- [x] Staff overview, booking search/detail/calendar, sections/photos, schedule, blackouts, event overrides
- [x] Manual requests, check-in/no-show, cancellation, rescheduling, guest change requests
- [x] Sanity schemas and app reads; explicit safe event synchronization
- [x] Stripe Checkout/webhook adapter; Resend templates/outbox; cron/refund reconciliation
- [x] Secure expiring customer links and link renewal
- [x] JSON validation, Origin checks, bounded request bodies, durable throttling, Turnstile adapter
- [x] Reduced-motion support, metadata, Open Graph image, robots, sitemap
- [x] QR generator that requires a permanent production domain
- [x] Automated validation, security, SQL invariant, webhook-boundary, and browser test suites
- [x] Deployment guide, admin guide, research/originality record, review and QA reports

## Content and business approval required

- [ ] Approved LOVE logo/wordmark
- [ ] Authorized venue/section/menu photography; replace both reference images
- [ ] Current address, map pin, contacts, hours, official socials
- [ ] Verified accessibility/parking/entry requirements
- [ ] Approved food/drinks menu, availability, prices, allergen information
- [ ] Actual event schedule, artwork, performers, tickets/RSVP links
- [ ] Accurate section names, capacities, amenities, photographs, geometry
- [ ] Deposits/minimum spends and section/event conditions, including refundability and deposit application
- [ ] Legal entity/privacy contact and final legal notices
- [ ] Approved data retention/deletion/anonymization and backup retention policy

## Service integration and live acceptance required

- [ ] Organization-owned Supabase, Sanity, Stripe, Resend, Turnstile, and Vercel environments
- [ ] Migrations applied to the actual Supabase staging project
- [ ] Owner account bootstrapped; invited staff and provider MFA/security configured
- [ ] Live auth/session refresh, every staff role boundary, and private storage tested
- [ ] CMS create/update/unpublish, authorized media/video, and SEO updates tested against real Sanity
- [ ] Stable event identity and operational import tested against actual CMS/database
- [ ] Genuine test-mode customer request saved; management approval allocates one live hold
- [ ] Genuine acknowledgment/approval/confirmation/cancellation emails delivered
- [ ] Genuine Stripe test Checkout payment, signed webhook, one confirmed allocation
- [ ] Failure, abandonment, duplicate delivery, expired/late payment, refund, and reschedule scenarios tested through providers
- [ ] Cron authorized, running at the required cadence, and monitored; notification dead-letter handling rehearsed
- [ ] Backups enabled and a staging restore demonstrated
- [ ] Screen-reader/manual accessibility review and actual populated-content checks
- [ ] Claude independent review after authorized sign-in

## Release approval required

- [ ] Approved permanent domain, canonical URLs, TLS, sender DNS, and social ownership
- [ ] Authorized Vercel production project/deployment and appropriate cron plan
- [ ] Production-specific keys, webhook secret, trusted hosts, Turnstile, rate-limit/cron secrets
- [ ] Replace draft policies and all reference imagery; verify all business information
- [ ] Set launch-ready indexing flag only after sign-off
- [ ] Generate and scan-test print QR assets against permanent `/menu` URL
- [ ] Configure legacy redirects only after control/rebrand strategy is verified

No public booking capability should be advertised as live until the unchecked service/content requirements have evidence. A passing local build does not substitute for provider acceptance.
