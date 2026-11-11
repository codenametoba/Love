# LOVE — Crimson Society

Implemented 10 November 2026. Crimson Society is an internal art direction; the public identity remains LOVE. This direction supersedes the prior aubergine/chartreuse/serif design.

## Visual language

Obsidian #110D0E and near black #090809 provide the foundation. Oxblood #45121F and deep crimson #741B2C support selected surfaces; crimson #AD233C marks primary actions. Ivory #F1E8E0, muted rose gray #A89B9D and copper #D9AD91 provide text and restrained details. Copper is not used as a gold luxury motif.

Locally hosted Barlow Condensed Semibold supplies contemporary display typography; Arial/Helvetica supplies readable body and operational typography. Font files include the SIL Open Font License. There are no added dependencies, external font requests, decorative chapter codes, stars, tickers, record stamps or outline headlines.

## Composition

Home opens with full-bleed indoor conceptual nightlife imagery, an asymmetric left-aligned message in protected negative space, a booking action and a real upcoming event reference only when published. The previous rustic pub and split-screen hero are retired. “Stay for what happens next.” is the default headline; published CMS headline/body fields remain authoritative.

The atmosphere sequence offsets cocktail detail and social photography around an editorial text block. The calendar becomes a dark publication-like spread. The booking desk integrates real date/guest intent controls into an oxblood surface, without inventing VIP photography or floor plans. A light menu spread changes pace. Authorized moments, a private-event invitation and an expressive closing complete the sequence.

Supporting routes retain separate compositions: an offset photo essay for The Space; poster artwork and filtering for Events; an artwork/information layout for event details; a light, readable Menu; an asymmetric gallery with accessible media dialog; a practical Reservation flow; a guided Private Events inquiry; and a useful location/contact surface for Find Us. Admin retains its operational layout and information density.

Mobile receives deliberate crops, separate headline wrapping, vertical booking controls and a large-link navigation panel. Reduced motion removes transitions and animations. Hero text uses movement without fading interactive content through inaccessible contrast levels.

## Source structure

- `app/globals.css`: stylesheet entry point.
- `app/base.css`: foundational and supporting-route layouts.
- `app/crimson.css`: current public composition and responsive direction.
- `app/operational.css`: booking, forms, status and administration rules.

No database, API, auth, payment, email or CMS schema changes were needed. Source backup: `/private/tmp/love-before-crimson.tgz`. Backend contract hashes were captured before implementation and compared afterward.

## Content and imagery

No approved venue photographs, logo artwork, prices, capacities, published events or external project credentials were supplied. Reference images are visibly labeled “Illustrative reference. Not photographed at LOVE.” They are never inserted into the authentic Moments gallery. Publish authorized media in Sanity and set its order to replace references; the first authorized image is the hero, later images form the atmosphere sequence, and the “At the Table” collection supplies menu imagery. Review image crops when publishing. Real section photography and verified geometry remain controlled by operational inventory.

New licensed development references:

- Chani Kaplan, red-lit club interior: https://unsplash.com/photos/dark-club-interior-with-red-neon-lights-and-a-person-faiUOHwW4c0 — https://unsplash.com/license — stored as `nightlife-reference.jpg`.
- Alexandru Cojanu, indoor social nightlife: https://www.pexels.com/photo/people-at-club-19923640/ — https://www.pexels.com/license/ — stored as `social-reference.jpg`.
- Existing disclosed cocktail reference remains in use. Rustic pub, outdoor concert and restaurant references are not rendered by the new public pages.
- Display font: https://github.com/google/fonts/tree/main/ofl/barlowcondensed; bundled license in `public/fonts/OFL-BarlowCondensed.txt`.

The available LOVE references and screenshots were reviewed. Other portfolio projects were unavailable; cross-project uniqueness is not asserted. Required brand labels, factual information and accessible operational wording remain stable.

## Supplied content update

The user subsequently provided venue photography and food/drinks menus and confirmed the Fountain Square location for LOVE. The stock references and public reference notices have been replaced with these supplied materials. Home now appears in navigation. See CONTENT.md for the current content source and implementation record; the reference-image description above documents the earlier design stage.
