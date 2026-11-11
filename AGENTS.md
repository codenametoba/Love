# LOVE project guidance

## Originality

The user requires a distinct visual identity and original editorial copy for every project. Do not reuse another project's slogans, copy, page composition, navigation signature, decorative motifs, numbered chapter labels, star/asterisk separators, ticker strips, or layout formula. Review available portfolio references before choosing a direction; never claim uniqueness against projects you cannot inspect. Ordinary semantic HTML, accessible controls, shared functional infrastructure, required brand names, factual dates/counts, and clear operational labels may remain reusable.

For LOVE specifically: no decorative section numbering, label dots, star/asterisk motifs, repeating slogan bands, vertical editorial rails, circular record stamps, outlined giant headlines, or giant LOVE text over photographs. Use the Crimson Society palette: obsidian, near black, oxblood, deep crimson, restrained crimson, warm copper and soft ivory. Retain the minimal LOVE. wordmark and clear section booking actions. No aubergine, lime or chartreuse. The user has supplied venue photos and menu screenshots and confirmed LOVE is the rebrand at the Paradox Lounge location. Use those assets and customer-facing LOVE copy; retain provenance in internal documentation. Preserve CMS publication/authorization controls.

## Technology

Use TypeScript for production code, React/Next.js for web applications, Node.js for server work and development automation, and Tailwind/standard CSS for styling. Use JavaScript/TypeScript tooling for animation, integration, automation, and testing. SQL is appropriate for PostgreSQL migrations, constraints, and security. Do not introduce Python, PHP, Java, Ruby, other languages, services, frameworks, or dependencies without technical necessity. Explain a necessary language exception before introducing it. Keep strict types, consistent conventions, and a maintainable structure.

## Operational boundaries

Preserve the existing API contracts, PostgreSQL migrations, database inventory constraints, approval workflow, Stripe verification, Resend outbox, authentication, and role checks during visual changes. Do not invent venue facts, prices, capacities, events, or credentials. Do not deploy without authorization. Run checks appropriate to changed behavior and retain honest provider-dependent launch blockers.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
