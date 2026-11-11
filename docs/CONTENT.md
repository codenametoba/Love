# LOVE content update — 10 November 2026

The user confirmed LOVE is a rebrand of the lounge at the existing Paradox Lounge Indianapolis location, supplied nine screenshots, and authorized use of those pictures and menu references. Public brand copy remains LOVE. No prior-name explanation or development/reference notices are displayed in venue content.

## Content sources

- User-supplied food menu: Screenshot 2026-11-10 at 06.18.17.png.
- User-supplied cocktail menu: Screenshot 2026-11-10 at 06.18.36.png.
- Venue address corroborated by Visit Indy: https://www.visitindy.com/directory/paradox-lounge/ and Fountain Fletcher District Association: https://fountainfletcher.com/merchant/paradox-lounge/ . Address: 1059 Virginia Avenue, Indianapolis, IN 46203. User confirmed reuse for LOVE.
- Supplied photographs copied to `public/images/venue/`: lounge overview (06.16.10), VIP lounge (06.15.24), blue room (06.16.58), cocktails (06.17.16), evening seating (06.17.39). Duplicate lower-resolution overview, body close-up and photographed menu pages were not used as editorial images.

The menu is adapted/transcribed from the supplied references, with original concise descriptions and LOVE branding replacing the previous name in house items. Illegible dessert and side prices were omitted rather than filling every possible item. Online operating hours conflict, so no schedule is asserted. Existing branding visible within supplied photographs was not altered. No event dates, performers, inventory positions, section prices or booking availability were invented.

## Implementation

`lib/venue-content.ts` contains the typed repository content used when no Sanity project is connected. Existing configured Sanity queries and authorization/publication controls remain authoritative; configured CMS failure is not masked by repository content. This adds 39 menu entries and five venue photographs, location/directions and editorial venue descriptions. No credentials or backend services are required to display this content.

Home now appears in desktop and mobile navigation. Homepage previews include drinks and food, the section invitation includes supplied lounge photography, The Space describes the actual photographed interior, Moments has collection filters/media viewing, and Find Us includes the address and directions. Booking controls and closed availability remain operationally honest.
