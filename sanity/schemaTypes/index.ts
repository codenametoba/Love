import { defineField, defineType } from "sanity";
const published = defineField({
  name: "published",
  title: "Publish on website",
  type: "boolean",
  initialValue: false,
});
const image = defineField({
  name: "image",
  type: "image",
  options: { hotspot: true },
});
const url = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "url",
    validation: (r) => r.uri({ scheme: ["https"] }),
  });
export const schemaTypes = [
  defineType({
    name: "venue",
    title: "Venue & homepage",
    type: "document",
    fields: [
      defineField({
        name: "verified",
        title: "LOVE-era business information is management-verified",
        type: "boolean",
        initialValue: false,
      }),
      defineField({
        name: "heroHeadline",
        title: "Homepage headline",
        type: "string",
      }),
      defineField({
        name: "heroBody",
        title: "Homepage introduction",
        type: "text",
      }),
      defineField({ name: "address", type: "string" }),
      defineField({ name: "phone", type: "string" }),
      defineField({
        name: "email",
        type: "string",
        validation: (r) => r.email(),
      }),
      url("directionsUrl", "Verified directions link"),
      defineField({ name: "hours", type: "text" }),
      defineField({ name: "parking", type: "text" }),
      defineField({ name: "entryPolicy", type: "text" }),
      url("instagram", "Official Instagram URL"),
      defineField({
        name: "seoDescription",
        type: "text",
        validation: (r) => r.max(160),
      }),
    ],
  }),
  defineType({
    name: "page",
    title: "Page copy & SEO",
    type: "document",
    fields: [
      defineField({
        name: "path",
        type: "string",
        description:
          "For example /the-space, /events, /menu, /moments, /reserve, /visit, /private-events, /privacy, /booking-policy, /accessibility, /terms",
        validation: (r) => r.required(),
      }),
      defineField({
        name: "title",
        type: "string",
        validation: (r) => r.required(),
      }),
      defineField({ name: "intro", type: "text" }),
      defineField({
        name: "body",
        type: "text",
        description:
          "Plain-text content for policy pages; separate paragraphs with blank lines.",
      }),
      defineField({ name: "seoTitle", type: "string" }),
      defineField({
        name: "seoDescription",
        type: "text",
        validation: (r) => r.max(160),
      }),
      published,
    ],
  }),
  defineType({
    name: "event",
    title: "Events",
    type: "document",
    fields: [
      defineField({
        name: "title",
        type: "string",
        validation: (r) => r.required(),
      }),
      defineField({
        name: "slug",
        type: "slug",
        options: { source: "title" },
        validation: (r) => r.required(),
      }),
      defineField({
        name: "description",
        type: "text",
        validation: (r) => r.required(),
      }),
      defineField({
        name: "start",
        type: "datetime",
        validation: (r) => r.required(),
      }),
      defineField({
        name: "end",
        type: "datetime",
        validation: (r) =>
          r
            .required()
            .custom((end, context) =>
              end &&
              context.document?.start &&
              new Date(String(end)) <= new Date(String(context.document.start))
                ? "End must follow start"
                : true,
            ),
      }),
      image,
      defineField({ name: "performers", type: "string" }),
      defineField({ name: "category", type: "string" }),
      defineField({ name: "featured", type: "boolean" }),
      defineField({ name: "ageRestriction", type: "string" }),
      defineField({ name: "dressCode", type: "string" }),
      defineField({ name: "entry", type: "text" }),
      url("ticketUrl", "Verified ticket / RSVP URL"),
      defineField({
        name: "bookingEnabled",
        title: "Show section booking action",
        type: "boolean",
        initialValue: false,
      }),
      defineField({
        name: "operationalId",
        title: "Operational event UUID",
        type: "string",
        description:
          "Copy the UUID returned by management synchronization. Never create a different ID for an existing event.",
      }),
      published,
    ],
  }),
  defineType({
    name: "menuItem",
    title: "Menu items",
    type: "document",
    fields: [
      defineField({
        name: "name",
        type: "string",
        validation: (r) => r.required(),
      }),
      defineField({ name: "description", type: "text" }),
      defineField({
        name: "price",
        title: "Price (USD)",
        type: "number",
        validation: (r) => r.min(0),
      }),
      defineField({
        name: "category",
        type: "string",
        validation: (r) => r.required(),
      }),
      defineField({ name: "available", type: "boolean", initialValue: true }),
      defineField({ name: "dietary", type: "string" }),
      defineField({ name: "allergens", type: "string" }),
      image,
      defineField({ name: "order", type: "number", initialValue: 0 }),
      published,
    ],
  }),
  defineType({
    name: "media",
    title: "Gallery & venue photography",
    type: "document",
    fields: [
      defineField({
        name: "kind",
        type: "string",
        initialValue: "image",
        options: {
          list: [
            { title: "Photograph", value: "image" },
            { title: "Short video", value: "video" },
          ],
        },
      }),
      defineField({
        name: "video",
        type: "file",
        options: { accept: "video/mp4,video/webm" },
        description:
          "Upload an authorized, optimized short video. Include a poster photograph and a transcript for spoken audio.",
      }),
      defineField({
        name: "transcript",
        type: "text",
        description:
          "Text equivalent for spoken audio or meaningful on-screen content.",
      }),
      image,
      defineField({
        name: "caption",
        title: "Caption / accessible image description",
        type: "string",
        validation: (r) => r.required(),
      }),
      defineField({
        name: "collection",
        type: "string",
        options: {
          list: [
            "Inside LOVE",
            "On the Floor",
            "At the Table",
            "The Celebrations",
          ],
        },
        validation: (r) => r.required(),
      }),
      defineField({ name: "credit", type: "string" }),
      defineField({
        name: "authorized",
        title: "I confirm permission to publish this image",
        type: "boolean",
        initialValue: false,
        validation: (r) => r.required(),
      }),
      defineField({ name: "order", type: "number", initialValue: 0 }),
      published,
    ],
  }),
  defineType({
    name: "faq",
    title: "Frequently asked questions",
    type: "document",
    fields: [
      defineField({
        name: "question",
        type: "string",
        validation: (r) => r.required(),
      }),
      defineField({
        name: "answer",
        type: "text",
        validation: (r) => r.required(),
      }),
      defineField({ name: "order", type: "number" }),
      published,
    ],
  }),
];
