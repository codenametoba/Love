// Real multi-connection verification. Use ONLY a new, disposable PostgreSQL database.
import { Pool } from "pg";
import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
if (
  !process.env.TEST_DATABASE_URL ||
  process.env.LOVE_ALLOW_DISPOSABLE_DB !== "true"
)
  throw new Error(
    "Set TEST_DATABASE_URL to a new disposable PostgreSQL database and LOVE_ALLOW_DISPOSABLE_DB=true. This suite creates schemas and test data. It must never target a production database.",
  );
const pool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL,
  max: 4,
});
try {
  await pool.query(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as 'select null::uuid';create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`,
  );
  for (const f of (await readdir("supabase/migrations")).sort())
    await pool.query(await readFile(`supabase/migrations/${f}`, "utf8"));
  const actor = randomUUID(),
    sid = randomUUID(),
    wid = randomUUID();
  await pool.query("insert into auth.users values($1)", [actor]);
  await pool.query("insert into staff_roles values($1,'owner')", [actor]);
  await pool.query(
    "insert into sections(id,name,capacity,deposit_cents,minimum_spend_cents,policy,published) values($1,'TEST ONLY',8,10000,50000,'Test-only deposit and minimum-spend booking policy.',true)",
    [sid],
  );
  await pool.query(
    "insert into booking_windows(id,title,starts_at,ends_at,arrival_start,arrival_end,published,booking_deadline) values($1,'TEST ONLY',now()+interval '5 days',now()+interval '6 days',now()+interval '5 days',now()+interval '5 days 1 hour',true,now()+interval '4 days')",
    [wid],
  );
  await pool.query(
    "insert into availability_rules(section_id,window_id) values($1,$2)",
    [sid, wid],
  );
  const {
    rows: [window],
  } = await pool.query(
    "select arrival_start from booking_windows where id=$1",
    [wid],
  );
  const request = {
    sectionId: sid,
    windowId: wid,
    name: "TEST ONLY",
    email: "test@example.test",
    phone: "3175550100",
    guests: 4,
    arrival: new Date(
      new Date(window.arrival_start).getTime() + 15 * 60000,
    ).toISOString(),
    occasion: "Other",
  };
  const refs = await Promise.all(
    [1, 2].map(async () => {
      const { rows } = await pool.query(
        "select create_request($1,$2,$3) result",
        [JSON.stringify(request), randomUUID(), "https://example.test"],
      );
      return rows[0].result.reference;
    }),
  );
  const { rows: bookings } = await pool.query(
    "select id from reservations where reference=any($1)",
    [refs],
  );
  const clients = await Promise.all([pool.connect(), pool.connect()]);
  let outcomes: PromiseSettledResult<unknown>[];
  try {
    const pids = await Promise.all(
      clients.map((c) => c.query("select pg_backend_pid() id")),
    );
    assert.notEqual(pids[0].rows[0].id, pids[1].rows[0].id);
    outcomes = await Promise.allSettled(
      bookings.map((b, i) =>
        clients[i].query("select approve_request($1,$2,$3,$4)", [
          b.id,
          actor,
          randomUUID(),
          "https://example.test",
        ]),
      ),
    );
  } finally {
    clients.forEach((c) => c.release());
  }
  assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
  const {
    rows: [allocation],
  } = await pool.query(
    "select count(*)::int n from inventory_holds where active and section_id=$1",
    [sid],
  );
  assert.equal(allocation.n, 1);
  console.log(
    "PASS: two independent PostgreSQL connections raced approvals; exactly one active allocation.",
  );
} finally {
  await pool.end();
}
