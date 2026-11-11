# LOVE — Indianapolis

The Crimson Society redesign is implemented. See [current design direction](docs/DESIGN.md) and [redesign review](docs/redesign/REVIEW.md). Global and project instructions record the user’s originality and TypeScript preferences.

A local Next.js App Router application for LOVE: an original editorial website, guest reservation requests, management approval, section inventory, Stripe deposit verification, a notification outbox, and Sanity editorial tools.

**Current status: built and locally tested; not deployed or ready for public bookings.** The user supplied venue photographs and food/drinks menu screenshots and confirmed LOVE uses the existing Fountain Square location. The menu, gallery, address and directions are populated; see [content sources](docs/CONTENT.md). Service credentials, approved booking policies and operational inventory remain pending.

## Run locally

Requires Node.js 22.14+ and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Without credentials, all public pages work, availability is closed, submissions fail honestly, and staff access is protected. To review the booking UI with fixture data, run the Playwright suite; fixture inventory is never shipped to the public app.

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Playwright uses an installed Playwright Chromium by default. If needed, set `PLAYWRIGHT_EXECUTABLE_PATH` to your local Chrome executable. Embedded PostgreSQL migration/invariant tests run inside `npm test`. True multi-connection approval testing requires a **new disposable PostgreSQL database**, documented in [QA](docs/QA.md).

## What is implemented

- Every requested public route, dynamic event details, secure customer reservation pages, legal drafts, responsive navigation, event filters, menu categories, media viewing, private inquiries, and distinct unavailable states.
- A four-step booking flow: published night → eligible section/list or verified map → guest details → reviewed conditions. Guests never need an account.
- PostgreSQL inventory constraints and service-only transaction functions. Approval creates an exclusive temporary hold. Only a signed Stripe webhook and successful allocation reconciliation confirm a booking.
- Late-payment exceptions, webhook replay protection, request deduplication, cancellation, rescheduling, check-in/no-show, manual requests, full refunds, and refund-status reconciliation.
- Staff authentication, server-enforced roles, overview, reservation search, daily/weekly calendars, section uploads/configuration, booking nights, event overrides, blackouts, inquiry management, payment exceptions, notification queue, staff role assignment, and audit history.
- Sanity schema/configuration and published-content reads for menus, events, gallery, venue details, homepage introduction, page introductions, SEO, and policies. Event scheduling is synchronized explicitly, preserving the database as inventory authority.
- Transactional Resend email templates, leased/idempotent outbox processing, rate limiting, Turnstile integration, security headers, private customer access tokens, metadata, sitemap, Open Graph image, and a production-domain QR generator.

## Connect services

Follow [deployment setup](docs/DEPLOYMENT.md). No accounts were provisioned, no credentials were invented, and no production data was changed. Configure real projects, apply migrations, bootstrap one owner, publish approved content, and perform live integration QA before enabling bookings.

## Project map

| Path                   | Purpose                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `app/`                 | Public pages, staff pages, server actions, API routes              |
| `components/`          | Editorial UI, forms, booking steps, media viewer                   |
| `lib/`                 | Auth, content, validation, inventory reads, payment/email adapters |
| `sanity/`              | Editable editorial schemas                                         |
| `supabase/migrations/` | Operational schema, RLS, transactional functions                   |
| `tests/`               | Validation, security, signed webhook boundary, SQL, browser tests  |
| `scripts/menu-qr.ts`   | Stable-domain print QR generation                                  |
| `docs/`                | Discovery, design, operations, deployment, review, QA              |

Read [the admin guide](docs/ADMIN.md), [architecture](docs/ARCHITECTURE.md), [design decisions](docs/DESIGN.md), [research](docs/DISCOVERY.md), [readiness checklist](docs/READINESS.md), and [review findings](docs/REVIEW.md).

The wordmark is provisional. Venue photographs and menu content now use the materials supplied by the user. Source records and the CMS replacement path are documented in [content sources](docs/CONTENT.md).
