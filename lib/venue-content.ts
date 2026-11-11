import type { Venue, MenuItem, Media } from "./types";

// User-approved rebrand content, supplied venue photographs and menu references.
// See docs/CONTENT.md for provenance. Configured Sanity publication remains authoritative.
export const venueContent: Venue = {
  verified: true,
  address: "1059 Virginia Avenue, Indianapolis, IN 46203",
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=1059+Virginia+Avenue+Indianapolis+IN+46203",
  heroBody:
    "Cocktails at the bar. Dinner with your circle. Music that brings the room together. Find us in Fountain Square.",
  intro: "A lounge with a social pulse, in the heart of Fountain Square.",
  seoDescription:
    "LOVE in Fountain Square, Indianapolis. Craft cocktails, food, music and section reservations at 1059 Virginia Avenue.",
};

export const venueMedia: Media[] = [
  {
    _id: "love-lounge",
    kind: "image",
    url: "/images/venue/lounge-overview.png",
    caption: "A room made for good company.",
    collection: "The Space",
  },
  {
    _id: "love-cocktails",
    kind: "image",
    url: "/images/venue/cocktails.png",
    caption: "A little color at the bar.",
    collection: "At the Table",
  },
  {
    _id: "love-blue-room",
    kind: "image",
    url: "/images/venue/blue-room.png",
    caption: "Chandelier light. Late-night energy.",
    collection: "The Space",
  },
  {
    _id: "love-vip",
    kind: "image",
    url: "/images/venue/vip-lounge.png",
    caption: "Settle into your own corner.",
    collection: "The Space",
  },
  {
    _id: "love-seating",
    kind: "image",
    url: "/images/venue/evening-seating.png",
    caption: "A different view of the evening.",
    collection: "The Space",
  },
];

type MenuRow = readonly [name: string, price: number, description?: string];
const category = (name: string, rows: readonly MenuRow[]): MenuItem[] =>
  rows.map(([title, price, description], i) => ({
    _id: `${name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-${i}`,
    name: title,
    category: name,
    price,
    description,
    available: true,
  }));

export const menuContent: MenuItem[] = [
  ...category("Craft Cocktails", [
    ["LOVE Paloma", 18, "Tequila, mezcal, mint, citrus and agave."],
    ["OG Old Fashioned", 18, "Bourbon, bitters, sugar and a cherry finish."],
    ["Talk To Me Nice", 16, "Tito’s vodka, lemon and cotton candy."],
    [
      "Tiki Summer",
      18,
      "Floral vodka, passion fruit and butterfly pea flower.",
    ],
    [
      "Black Beauty",
      16,
      "Tito’s vodka, blackberry purée, elderflower and ginger.",
    ],
    ["Keep It One-Honey", 16, "Gin, lavender honey and citrus."],
    ["The Perfect Daiquiri", 16, "Bacardi rum, lime and sugar."],
    [
      "Fallen Sunset",
      18,
      "Tequila, orange liqueur, citrus and a red wine float.",
    ],
    [
      "Thanks!",
      18,
      "Maker’s Mark, Earl Grey, orange, bitters, rosemary and cherry.",
    ],
    ["Like I’m Golden", 18, "Hennessy, Grand Marnier and a touch of gold."],
  ]),
  ...category("Starters", [
    ["Pretzel Bites", 8],
    ["Spinach Artichoke Dip", 12],
    ["Sautéed Brussels Sprouts", 10],
    ["Bruschetta Shrimp", 14],
    ["Rosemary Garlic Lamb Chops", 24],
    ["Ahi Tuna", 16],
    ["Ahi Tuna Tacos", 14],
  ]),
  ...category("Wings", [
    [
      "Six Wings",
      12,
      "Choose Buffalo, Garlic Parmesan, Lemon Pepper, Dry Rub, Hot Honey BBQ or Teriyaki.",
    ],
    [
      "Ten Wings",
      18,
      "Choose Buffalo, Garlic Parmesan, Lemon Pepper, Dry Rub, Hot Honey BBQ or Teriyaki.",
    ],
  ]),
  ...category("Burgers & Sandwiches", [
    [
      "The LOVE Burger",
      18,
      "Wagyu blend, cheddar, smoked gouda, lettuce, tomato, red onion, over-easy egg and secret sauce. Served with fries.",
    ],
    [
      "Mushroom Swiss Burger",
      18,
      "Wagyu blend, sautéed mushrooms, crispy onions, arugula and garlic cream cheese. Served with fries.",
    ],
    [
      "BBQ Bacon Burger",
      18,
      "Beef burger, candied bacon, spicy BBQ sauce, lettuce, tomato, red onion and smoked cheddar. Served with fries.",
    ],
    [
      "Turkey Burger",
      16,
      "Pepper jack, cranberry relish, goat cheese spread, arugula and sriracha mayo. Served with fries.",
    ],
    [
      "Nashville Hot Yardbird Sandwich",
      18,
      "Nashville-style chicken with fried egg, pickle chips, cheese and secret sauce. Served with fries.",
    ],
  ]),
  ...category("Street Tacos", [
    [
      "Chicken Tacos",
      14,
      "Chicken, red onion, cotija cheese and cilantro-lime salsa.",
    ],
    ["Beef Tacos", 17, "Seasoned beef, peppers and onions with mango cream."],
    [
      "Cauliflower Tacos",
      12,
      "Cauliflower, onion, tomato, cheese and chimichurri salsa.",
    ],
    ["Garlic Shrimp Tacos", 17, "Garlic shrimp, jalapeño and avocado cream."],
  ]),
  ...category("Flatbreads", [
    [
      "BBQ Chicken",
      14,
      "BBQ chicken, pineapple, mozzarella and red onion with spicy BBQ sauce.",
    ],
    ["Margherita", 12, "Sliced tomatoes, fresh basil, garlic and mozzarella."],
    [
      "Meat Eaters",
      17,
      "Pepperoni, Italian sausage and mozzarella with marinara.",
    ],
    [
      "Veg Out",
      12,
      "Roasted peppers, mushrooms, red onion, spinach and basil with house sauce.",
    ],
  ]),
  ...category("Salads", [
    [
      "Seasonal Mix",
      14,
      "Arcadian greens, cranberries, red onion, candied pecans and goat cheese with raspberry vinaigrette. Add shrimp $6 or grilled chicken $5.",
    ],
    [
      "The Wedge",
      10,
      "Romaine, pickled red onion, cherry tomato and bleu cheese dressing.",
    ],
  ]),
  ...category("Sides", [
    ["Garlic Parmesan Fries", 6],
    ["Plain Jane Fries", 5],
    ["Fried Zucchini", 5],
    ["Spicy Fried Cabbage", 6],
    ["Mixed Vegetables", 6],
  ]),
];
