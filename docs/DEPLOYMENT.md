# Deployment preparation

Nothing has been deployed, registered, provisioned, or billed. The intended production host is Vercel; this is a native Next.js project, not a static Sites export.

## 1. Provision and protect projects

Create organization-owned Sanity, Supabase, Stripe, Resend, Turnstile, and Vercel projects. Use a separate staging environment and Stripe test mode for integration tests. Store secrets in the hosting environment, never in Git or chat. `.env.example` lists every required variable.

Use Node.js 22.14 or later, `npm ci`, and the committed lockfile. Build with `npm run build`. Sanity is a development/studio dependency; the customer app uses `@sanity/client`. Targeted overrides pin patched transitive CLI dependencies; reassess them when upgrading Sanity.

## 2. Database and owner setup

Apply `supabase/migrations/001_operations.sql` through `007_content_operations.sql` in numeric order using Supabase CLI migrations or the project SQL editor. These are initial migrations, not safe repeated ad-hoc scripts. Back up existing data before applying changes to an established project.

Migrations require PostgreSQL `btree_gist` and `pgcrypto`, Supabase `auth.users`, `auth.uid()`, `storage.buckets`, and the standard `anon`, `authenticated`, and `service_role` roles. All operational tables enable RLS. Do not add public read/write policies to customer or payment relations.

Create/invite the initial owner in Supabase Auth, then run this once with the **actual invited user UUID**:

```sql
insert into public.staff_roles(user_id,role)
values ('REPLACE_WITH_ACTUAL_AUTH_USER_UUID'::uuid,'owner');
```

Disable public staff sign-up, configure strong password requirements/MFA in the provider, and configure production auth URLs. The application uses staff password sign-in and validated server sessions; no public customer account is needed. Keep the service-role key server-only.

The `venue-media` bucket is private. Staff uploads accept JPEG/PNG/WebP up to 10 MB. Published eligible section views use one-hour signed URLs. Do not make the whole bucket public.

## 3. Editorial setup

Set both app Sanity variables and studio variables to the same project/dataset. Run `npm run studio`, authenticate with an authorized Sanity project user, and deploy the studio through Sanity’s normal workflow. Set `SANITY_STUDIO_URL` to that HTTPS URL. Allow the exact app/studio origins in Sanity CORS. Invite editors separately with appropriate Sanity project permissions; Supabase roles do not automatically grant Sanity access.

Create one Venue & homepage document. Verify current LOVE-era details with management before checking its verified flag. Create pages by exact route path to override introductions/SEO; policy body fields replace the legal drafts. Publish current menu items and authorized media. The gallery’s publication query requires `authorized == true`.

Event workflow: publish editorial event → staff Content studio → synchronize event → copy returned operational UUID into Sanity → publish again → create operational booking nights/eligible sections → configure event overrides as needed. Do not infer recurring nights from historical events. Editorial synchronization never silently changes existing booking windows or allocations.

Allow up to 60 seconds for published content revalidation. Do not include CMS write tokens in the customer app.

## 4. Booking inventory

Managers configure actual sections, capacities, photographs, deposits/minimum spends, and complete conditions. Amounts are stored in USD cents. Conditions must explicitly state refundability, whether the deposit applies to minimum spend, arrival requirements, and cancellation rules.

Publish specific booking windows with start/end, arrival window, booking deadline, lead time, and eligible sections. All timestamps must include a timezone offset. Indianapolis uses `America/Indiana/Indianapolis` and changes with daylight saving time; do not hardcode a year-round offset. No window means no customer availability.

Only register a verified floor plan after management supplies accurate geometry. Otherwise leave layout unset and use the section list/photographs.

## 5. Stripe and email

Configure test Stripe keys first. Register `/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `refund.created`, and `refund.updated`. Store the endpoint-specific signing secret. Test retries, failed cards, abandoned sessions, deadline expiry, and late payment. The confirmation redirect cannot confirm a booking.

Verify the Resend sending domain with DNS, set `EMAIL_FROM`, `MANAGEMENT_EMAIL`, and `RESEND_API_KEY`, and confirm sender/reply-to behavior. Emails are queued transactionally and require the operations cron. Do not approve live requests until email and payment providers are configured and delivery is demonstrated.

`NEXT_PUBLIC_SITE_URL` must match the environment’s actual canonical HTTPS origin. It generates secure email links and validates request Origin. Use the corresponding staging origin for staging; do not point staging emails at production.

## 6. Bot protection and operations job

Configure Turnstile for exact staging/production hostnames. Set the public site key and secret. Production submissions fail closed if bot protection or rate-limit salt is missing. Generate a random `RATE_LIMIT_SALT` and `CRON_SECRET` through your secret manager.

`vercel.json` requests `/api/cron` every minute. Verify your Vercel plan supports this schedule before enabling it. The handler requires `Authorization: Bearer <CRON_SECRET>`; Vercel must be configured with the matching secret. A separate authorized scheduler is also possible. Cron expires holds, processes email, reconciles refunds, and prunes expired access/rate-limit records. Monitor failed jobs and notifications with repeated attempts.

## 7. Verification before launch

Complete [READINESS.md](READINESS.md). Demonstrate a real test-mode browser → request API → Supabase row → management approval → email → Stripe Checkout → signed webhook → confirmed allocation → confirmation email. Then test role isolation, cancellation, rescheduling, inventory competition, refunds, notification retries, and restored backups.

Only after approval should you configure live Stripe keys, approve legal/booking policies, replace reference imagery, publish verified business details, set `NEXT_PUBLIC_LAUNCH_READY=true`, and deploy to the authorized production project. The flag controls indexing; it is not a substitute for content/payment review.

Set custom domain and TLS, verify canonical links/OG/sitemap, and configure redirects only for legacy domains/paths you control and have approved. No legacy redirect is preconfigured.

## 8. Print menu QR

After the permanent production domain is verified:

```sh
npm run menu:qr
```

The generator refuses localhost, common preview domains, and example domains. It produces SVG and 2400px PNG files in `deliverables/`, targeting `/menu`. Scan-test printed proofs and approve size/contrast before distribution. No temporary-URL print assets have been generated.

## Backups, recovery, and retention

Enable Supabase managed backups/PITR appropriate to the plan and business recovery objective; confirm storage backup coverage separately. Keep migrations in version control and export Sanity content before major editorial changes. Perform a restore to a separate staging project, verify allocations/payment IDs, then reconcile with Stripe before reopening inventory. Never blindly replay successful payment events into an inconsistent restored allocation state.

Management must approve retention periods for guest details, inquiries, payment/audit records, notification payloads, and uploads. These periods cannot be inferred from the brief. Until approved, no destructive customer-record retention job is enabled. Expired access tokens/rate limits are pruned; broader deletion or anonymization requires a documented legal/accounting review and backup-retention plan. This is a launch blocker.

## Observability

Monitor Vercel function/cron failures; Supabase capacity, backup status, and query errors; Resend deliveries/bounces; Stripe webhook retries; unresolved `payment_exceptions`; and notifications with `attempts >= 3`. Avoid logging bearer URLs, contact details, request bodies, or credentials. URL-path tokens can appear in platform access logs; restrict log access/retention and redact reservation path tokens in any added analytics or external observability integration.
