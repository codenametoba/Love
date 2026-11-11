# Review findings

## Independent Claude review

Claude Code `2.1.295` is installed at `/Users/jacoco/.local/bin/claude`. `claude auth status` reported `loggedIn: false`, `authMethod: none`. No Claude review was performed. No alternative identity, credential, or security bypass was attempted. After the owner signs in through the normal authorized flow, request independent review of design originality, populated mobile layouts, accessibility, authorization, payment settlement, and transaction races. This remains a launch checklist item.

## Implementation review and resolved findings

These are the implementation agent’s checks, not an independent certification.

| Finding                                                                            | Resolution                                                                                                        |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Historical business details could be mistaken for current LOVE facts               | Kept historical sources in discovery documentation; public address/hours/contacts require management verification |
| Fictional seat map would misrepresent the venue                                    | Verified layout flag and consistent layout identity required; fully functional section list otherwise             |
| Two managers could approve competing requests                                      | PostgreSQL exclusion constraint, row locks, shared transactional inventory lock, approval-time revalidation       |
| Expiry comparisons could use stale transaction-start time after waiting for a lock | Expiry-sensitive functions use `clock_timestamp()`                                                                |
| Payment redirect could imply confirmation                                          | UI reads database status only; signed verified webhook is the settlement boundary                                 |
| Late payment could allocate a section already released to another guest            | Explicit payment-exception path; never allocate late payments automatically                                       |
| A second payment could disturb an already confirmed reservation                    | Preserve confirmed state/allocation and flag only the additional payment                                          |
| Network retry could duplicate a customer request                                   | Client request UUID and unique transactional request deduplication                                                |
| Failed reschedule could release the original section                               | Release/validate/reassign in one transaction, tested rollback                                                     |
| Blackout or capacity edit could silently invalidate an active guest allocation     | Overlap checks and a capacity trigger reject unsafe edits                                                         |
| Unverified CMS scheduling could override authoritative inventory                   | Explicit stable-ID import; active requests prevent schedule changes; no automatic allocation updates              |
| Role checks only in navigation would expose staff operations                       | Every protected handler/server action checks staff identity; privileged SQL functions recheck roles               |
| Partial availability-query failure could present an available section              | All dependency query errors now fail the availability request                                                     |
| Customer records could be guessed from reference numbers                           | Random hashed, expiring bearer tokens; original email/reference needed for email-only renewal                     |
| Duplicate email processing or network interruption could repeat sends              | Leased transactional outbox and Resend idempotency keys                                                           |
| Refund event could arrive before the staff action records a pending refund         | Cron reconciles pending provider refund status                                                                    |
| Public footer links failed WCAG 2.2 target-size scan                               | Increased clickable target height and spacing                                                                     |
| Unauthenticated child staff pages could throw while layout redirected              | Dedicated page authorization helper redirects before child data reads                                             |
| Vulnerable dependency versions in tooling                                          | Upgraded Sanity/Vitest; applied targeted patched transitive dependencies; audit reached zero vulnerabilities      |
| Large request body or invalid raw Stripe payload                                   | Streaming byte limit and signature verification before settlement                                                 |

## Remaining constraints

No approved business content, operational configuration, real accounts/keys, or production domain were supplied. Real hosted auth, Storage, Sanity publication, Stripe money movement, Resend delivery, cron scheduling, provider backups, and manual screen-reader review must still be demonstrated. Final retention/legal terms require management approval. The reference wordmark/photographs are provisional.

Automated accessibility results apply to tested local pages and their current empty states. Re-run with final media, real menu items, event artwork, and populated booking/admin data. No legal or accessibility certification is claimed.
