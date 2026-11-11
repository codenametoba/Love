import "server-only";
import { db, operationsConfigured } from "./supabase";
import { hash } from "./security";
import type { Reservation } from "./types";
export async function accessibleReservation(token: string) {
  if (!operationsConfigured() || !/^[A-Za-z0-9_-]{43}$/.test(token))
    return null;
  const { data: access } = await db()
    .from("reservation_access")
    .select("reservation_id")
    .eq("token_hash", hash(token))
    .gt("expires_at", new Date().toISOString())
    .single();
  if (!access) return null;
  const { data } = await db()
    .from("reservations")
    .select("*,sections(name),booking_windows(*)")
    .eq("id", access.reservation_id)
    .single();
  return data as Reservation | null;
}
