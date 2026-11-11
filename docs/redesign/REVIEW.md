# Crimson Society implementation review

The latest direction replaces the previous split image/serif layout across all public route families. Public naming remains LOVE. New source-level palette, contemporary condensed typography, cinematic hero, photographic sequence, event presentation, booking desk, menu preview, moments and closing are implemented. Supporting route compositions and customer booking/status surfaces share the new palette without making the operational interfaces experimental.

Backend preservation was verified by SHA-256 comparisons for every file under `lib`, `app/api`, `app/admin`, `supabase` and `sanity`. No changed files were found. Reservation inventory, approval, holds, payment verification, emails, roles and CMS publication/authorization contracts remain intact. Event-level section links still require bookingEnabled and an operational event ID.

The first browser pass identified contrast during the hero text opacity transition. The opacity animation was removed; the short text movement remains. The inquiry test now accepts either existing closed-service message, while still requiring a visible error and no success acknowledgment. Final verification evidence is recorded in QA.md.

Claude Code is installed but `claude auth status` reports loggedIn false / authMethod none. Independent Claude review was not run. No live external-provider test, deployment, content approval or management acceptance is claimed.

Public photography is conceptual and visibly disclosed until authorized venue assets are published. No fake event posters, menu prices, section inventory or guest gallery images were added. Contact details remain withheld until verified.
