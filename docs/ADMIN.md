# LOVE staff guide

## Getting in

Open `/admin` and sign in with your invited Supabase Auth staff credentials. There is no public staff registration. Ask an owner to invite you and assign your role.

- **Owner:** all operational tools, payment controls, staff roles, audit log.
- **Manager:** reservations, sections, scheduling, inquiries, content synchronization, payments/refunds.
- **Reservation staff:** guest list, calendar, manual requests, approvals/declines, changes, check-in, notes, inquiries.
- **Content editor:** content-studio access page only; no guest records or payment controls. Sanity access also requires a separate project invitation.

## Open reservations

1. In Sections & layout, create real venue sections with correct names, capacities, authorized photographs, USD-cent deposit/minimum spend, amenities, and complete booking terms. Publish only approved sections.
2. Under Booking schedule, add a specific bookable night. Supply timezone-qualified timestamps, arrival window, deadline, lead time, and eligible sections. Publish the night.
3. For an event, first synchronize its published Sanity event from Content studio. Record the returned operational UUID in Sanity. Set event-specific section terms if needed. A published flyer alone does not open bookings.
4. Check the public reservation page. It must show the correct night, capacity filters, prices, and conditions. No section may appear without a published eligible night.

Leave floor plans unset until accurate venue geometry is supplied. The section list is fully functional. If a layout is verified, assign each section coordinates as percentages of the same plan. Mixed layouts are never combined into one map.

## Handle a reservation

- **Pending approval:** view the guest, party size, requested section/night, arrival, and saved terms. Approve only after operational review. Approval rechecks inventory and allocates an exclusive temporary hold; competing requests may fail at this step.
- **Awaiting payment:** the guest receives a secure deposit link and deadline through the notification worker. Do not call this a confirmed reservation. Verify the email queue if the guest has not received it.
- **Confirmed:** the server verified the paid Stripe session and a live exclusive allocation. Record check-in or no-show from the detail page.
- **Expired:** the payment deadline passed; the section can be offered to others. A late payment is an exception and never takes another guest’s section.
- **Declined/cancelled:** the guest receives an update. Paid cancellations appear for refund-policy review; cancelling does not automatically issue a refund.

For changed prices or policies, do not silently approve old terms. Contact the guest and create a new request with the current terms.

## Changes, manual requests, and blackouts

Secure customer pages let guests request contact, cancellation, or date changes. These requests appear on the booking detail page; staff must review and act. The guest’s booking does not change merely because a request was sent.

Use Change section or date after getting guest agreement. The new inventory is checked transactionally. Different deposit, minimum spend, or conditions require a new request. Unpaid approvals should be cancelled before moving to another booking window.

Manual request uses the same validation, approval, and deposit workflow as online bookings. There is no unverified-payment shortcut to confirmation.

Blackouts block one section or the whole venue over a time interval. Resolve any overlapping live hold/booking first. Event cancellation releases affected allocations, notifies guests, and flags paid bookings for review. Unpublish the editorial event separately in Sanity.

## Inquiries

Private Gatherings submissions are inquiries, not venue confirmations. Record follow-up notes and move the status through New → Contacted → Planning → Closed as appropriate. A status change does not send a message automatically; use the venue’s approved communications process.

## Payments and exceptions

Review unresolved exceptions each day. Check the Stripe payment/session and guest’s saved policy. Confirm availability and contact the guest before offering another arrangement. Never mark a payment exception confirmed by editing database rows.

To issue a full deposit refund, cancel a confirmed booking first, select the payment, enter a reason, and submit from Payments & exceptions. The provider idempotency key prevents accidental duplicate full refunds. Provider updates/cron reconcile refund status. Review failed refunds in Stripe.

## Publishing content

Use Open Sanity Studio from Content studio. Edit menu items, categories/prices, event details/artwork, gallery images/video, page introductions, SEO, policies, and current venue information. Gallery media require permission confirmation before appearing publicly. Add useful captions; provide an optimized poster and transcript for video with spoken audio. Set publication flags deliberately; draft content stays hidden.

Verify all LOVE-era contact/location/hours information before enabling the Venue verified flag. Historical listings are not approval. Policy documents should be reviewed before replacing the draft copy. Published changes normally appear within 60 seconds.

## Daily operating checks

Review pending approvals, unpaid holds, today’s confirmed arrivals, new inquiries, customer change requests, payment exceptions, and notification failures. Repeated email failures require checking the sender domain/API configuration and provider logs. The notification worker stops retrying after 12 attempts; escalate dead letters for manual resolution. Confirm the cron is running before opening new nights.

Backups, service secrets, production deployment, legal review, and retention settings belong to the owner’s launch process. Staff must not paste credentials or customer bearer links into public channels.
