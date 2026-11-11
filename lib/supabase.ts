import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export const operationsConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
export function db() {
  if (!operationsConfigured())
    throw new Error("Reservations are not open yet. Please check back soon.");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function authClient() {
  const jar = await cookies();
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    throw new Error("Staff sign-in is not configured.");
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll(items) {
          try {
            items.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Server components cannot write. Proxy refreshes cookies. */
          }
        },
      },
    },
  );
}
export type Role = "owner" | "manager" | "reservations" | "editor";
export async function staff(
  allowed: Role[] = ["owner", "manager", "reservations", "editor"],
) {
  const client = await authClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new Error("Sign in to continue.");
  const { data } = await db()
    .from("staff_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (!data || !allowed.includes(data.role))
    throw new Error("You do not have permission for this action.");
  return { user, role: data.role as Role };
}
export async function rpc<T = unknown>(
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await db().rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export async function pageStaff(
  allowed: Role[] = ["owner", "manager", "reservations", "editor"],
) {
  const { redirect } = await import("next/navigation");
  try {
    return await staff(allowed);
  } catch (error) {
    return redirect(
      error instanceof Error && error.message.includes("permission")
        ? "/admin"
        : "/admin/login",
    );
  }
}
