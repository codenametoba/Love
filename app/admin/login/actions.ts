"use server";
import { authClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { z } from "zod";
export async function signIn(_: string | undefined, form: FormData) {
  const parsed = z
    .object({ email: z.email(), password: z.string().min(8).max(200) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return "Enter your staff email and password.";
  try {
    const client = await authClient();
    const { error } = await client.auth.signInWithPassword(parsed.data);
    if (error)
      return "Sign-in failed. Check your credentials or contact the owner.";
  } catch {
    return "Staff sign-in is not configured yet.";
  }
  redirect("/admin");
}
export async function signOut() {
  const c = await authClient();
  await c.auth.signOut();
  redirect("/admin/login");
}
