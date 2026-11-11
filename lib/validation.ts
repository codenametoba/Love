import { z } from "zod";
const person = {
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(30)
    .regex(/^[+\d\s().-]+$/),
  website: z.string().max(0).optional(),
  bot: z.string().max(4096).optional(),
};
export const reservationSchema = z.object({
  ...person,
  requestId: z.uuid().optional(),
  sectionId: z.uuid(),
  windowId: z.uuid(),
  guests: z.number().int().min(1).max(1000),
  arrival: z.iso.datetime({ offset: true }),
  occasion: z.enum([
    "Birthday",
    "Celebration",
    "Group Night Out",
    "Anniversary",
    "Other",
  ]),
  requests: z.string().trim().max(2000).default(""),
  accepted: z.literal(true),
});
export const inquirySchema = z.object({
  ...person,
  date: z.iso.date(),
  eventType: z.enum([
    "Birthday",
    "Private Celebration",
    "Corporate Event",
    "Group Gathering",
    "Other Occasion",
  ]),
  guests: z.number().int().min(2).max(1000),
  budget: z.string().trim().max(100).optional(),
  message: z.string().trim().min(10).max(3000),
});
export const changeSchema = z.object({
  kind: z.enum(["cancellation", "date-change", "contact"]),
  message: z.string().trim().min(5).max(2000),
});
export function safeHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}
