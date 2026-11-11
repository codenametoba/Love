import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFile, readdir } from "node:fs/promises";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
let pg: PGlite;
const owner = "a0000000-0000-4000-8000-000000000001",
  editor = "a0000000-0000-4000-8000-000000000002";
beforeAll(async () => {
  pg = new PGlite({ extensions: { btree_gist, pgcrypto } });
  await pg.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as 'select null::uuid';create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`,
  );
  for (const file of (await readdir("supabase/migrations")).sort())
    await pg.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
  await pg.query("insert into auth.users values($1),($2)", [owner, editor]);
  await pg.query("insert into staff_roles values($1,'owner'),($2,'editor')", [
    owner,
    editor,
  ]);
}, 120000);
afterAll(async () => {
  await pg?.close();
});
async function fixture() {
  const sid = randomUUID(),
    wid = randomUUID();
  await pg.query(
    "insert into sections(id,name,capacity,deposit_cents,minimum_spend_cents,policy,published) values($1,'TEST ONLY',8,10000,50000,'Test: deposit is non-refundable and counts toward minimum spend.',true)",
    [sid],
  );
  await pg.query(
    "insert into booking_windows(id,title,starts_at,ends_at,arrival_start,arrival_end,published,booking_deadline) values($1,'TEST ONLY',now()+interval '5 days',now()+interval '5 days 5 hours',now()+interval '5 days',now()+interval '5 days 1 hour',true,now()+interval '4 days')",
    [wid],
  );
  await pg.query(
    "insert into availability_rules(section_id,window_id) values($1,$2)",
    [sid, wid],
  );
  const { rows } = await pg.query<{ arrival_start: string }>(
    "select arrival_start from booking_windows where id=$1",
    [wid],
  );
  const arrival = new Date(rows[0].arrival_start).toISOString();
  return { sid, wid, arrival };
}
async function request(f: Awaited<ReturnType<typeof fixture>>) {
  const token = randomUUID();
  const d = {
    sectionId: f.sid,
    windowId: f.wid,
    name: "Test Guest",
    email: "guest@example.test",
    phone: "3175550100",
    guests: 4,
    arrival: f.arrival,
    occasion: "Birthday",
  };
  const { rows } = await pg.query<{ result: { reference: string } }>(
    "select create_request($1::jsonb,$2,$3) result",
    [JSON.stringify(d), token, "https://example.test/reservation/test"],
  );
  const result = await pg.query<{ id: string }>(
    "select id from reservations where reference=$1",
    [rows[0].result.reference],
  );
  return result.rows[0].id;
}
async function approve(id: string, actor = owner) {
  return pg.query("select approve_request($1,$2,$3,$4)", [
    id,
    actor,
    randomUUID(),
    "https://example.test/reservation/test",
  ]);
}
async function pay(
  id: string,
  {
    amount = 10000,
    currency = "usd",
    session = `cs_${randomUUID()}`,
    event = `evt_${randomUUID()}`,
  } = {},
) {
  await pg.query(
    "insert into checkout_sessions(id,reservation_id,amount_cents,expires_at) values($1,$2,10000,now()+interval '1 day') on conflict do nothing",
    [session, id],
  );
  return pg.query<{ result: string }>(
    "select settle_payment($1,$2,$3,$4,$5,$6) result",
    [event, session, id, `pi_${session}`, amount, currency],
  );
}
async function state(id: string) {
  return (
    await pg.query<{ status: string }>(
      "select status from reservations where id=$1",
      [id],
    )
  ).rows[0].status;
}
describe("actual PostgreSQL migrations and reservation invariants (embedded; single backend)", () => {
  it("deduplicates a retried request before allocating or notifying twice", async () => {
    const f = await fixture();
    const d = {
      requestId: randomUUID(),
      sectionId: f.sid,
      windowId: f.wid,
      name: "Test Guest",
      email: "guest@example.test",
      phone: "3175550100",
      guests: 4,
      arrival: f.arrival,
      occasion: "Birthday",
    };
    const call = () =>
      pg.query<{ result: { reference: string } }>(
        "select create_request($1::jsonb,$2,$3) result",
        [
          JSON.stringify(d),
          randomUUID(),
          "https://example.test/reservation/test",
        ],
      );
    const a = await call(),
      b = await call();
    expect(a.rows[0].result.reference).toBe(b.rows[0].result.reference);
    expect(
      (
        await pg.query("select * from reservations where request_key=$1", [
          d.requestId,
        ])
      ).rows,
    ).toHaveLength(1);
  });
  it("allows competing requests without allocating inventory", async () => {
    const f = await fixture();
    const a = await request(f),
      b = await request(f);
    expect(a).not.toBe(b);
    expect(await state(a)).toBe("PENDING_APPROVAL");
    expect(
      (
        await pg.query("select * from inventory_holds where section_id=$1", [
          f.sid,
        ])
      ).rows,
    ).toHaveLength(0);
  });
  it("approves only one competing request", async () => {
    const f = await fixture();
    const a = await request(f),
      b = await request(f);
    const approvals = await Promise.allSettled([approve(a), approve(b)]);
    expect(approvals.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      (
        await pg.query(
          "select * from inventory_holds where section_id=$1 and active",
          [f.sid],
        )
      ).rows,
    ).toHaveLength(1);
  });
  it("enforces the exclusion constraint even on direct overlapping inserts", async () => {
    const f = await fixture();
    const a = await request(f),
      b = await request(f);
    await approve(a);
    await expect(
      pg.query(
        "insert into inventory_holds(reservation_id,section_id,period) select $1,section_id,period from inventory_holds where reservation_id=$2",
        [b, a],
      ),
    ).rejects.toMatchObject({ code: "23P01" });
  });
  it("confirms only a verified matching payment and treats replay idempotently", async () => {
    const f = await fixture(),
      a = await request(f);
    await approve(a);
    const session = `cs_${randomUUID()}`,
      event = `evt_${randomUUID()}`;
    expect((await pay(a, { session, event })).rows[0].result).toBe("confirmed");
    expect((await pay(a, { session, event })).rows[0].result).toBe("duplicate");
    expect(await state(a)).toBe("CONFIRMED");
    expect(
      (await pg.query("select * from payments where reservation_id=$1", [a]))
        .rows,
    ).toHaveLength(1);
  });
  it("never confirms a late payment after the section is reallocated", async () => {
    const f = await fixture(),
      a = await request(f),
      b = await request(f);
    await approve(a);
    await pg.query(
      "update inventory_holds set expires_at=now()-interval '1 minute' where reservation_id=$1",
      [a],
    );
    await pg.query(
      "update reservations set hold_expires_at=now()-interval '1 minute' where id=$1",
      [a],
    );
    await pg.query("select expire_holds()");
    await approve(b);
    expect((await pay(a)).rows[0].result).toBe("exception");
    expect(await state(a)).toBe("PAYMENT_EXCEPTION");
    expect(await state(b)).toBe("AWAITING_PAYMENT");
    expect(
      (
        await pg.query(
          "select * from confirmed_reservations where reservation_id=$1",
          [a],
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("routes underpayment into an exception", async () => {
    const f = await fixture(),
      a = await request(f);
    await approve(a);
    expect((await pay(a, { amount: 1 })).rows[0].result).toBe("exception");
    expect(await state(a)).toBe("PAYMENT_EXCEPTION");
  });
  it("rejects wrong currency without confirming inventory", async () => {
    const f = await fixture(),
      a = await request(f);
    await approve(a);
    expect((await pay(a, { currency: "eur" })).rows[0].result).toBe(
      "exception",
    );
  });
  it("does not confirm a payment without a live approval", async () => {
    const f = await fixture(),
      a = await request(f);
    expect((await pay(a)).rows[0].result).toBe("exception");
  });
  it("releases inventory on cancellation and flags paid bookings for review", async () => {
    const f = await fixture(),
      a = await request(f);
    await approve(a);
    await pay(a);
    await pg.query(
      "select manage_reservation($1,$2,'cancel','Test cancellation')",
      [a, owner],
    );
    expect(await state(a)).toBe("CANCELLED");
    const b = await request(f);
    await approve(b);
    expect(
      (
        await pg.query(
          "select * from payment_exceptions where reservation_id=$1",
          [a],
        )
      ).rows,
    ).toHaveLength(1);
  });
  it("does not invalidate a confirmed booking when an additional payment arrives", async () => {
    const f = await fixture(),
      a = await request(f);
    await approve(a);
    await pay(a);
    expect((await pay(a)).rows[0].result).toBe("exception");
    expect(await state(a)).toBe("CONFIRMED");
    expect(
      (
        await pg.query(
          "select * from inventory_holds where reservation_id=$1 and active",
          [a],
        )
      ).rows,
    ).toHaveLength(1);
  });
  it("blocks staff without operations permissions", async () => {
    const f = await fixture(),
      a = await request(f);
    await expect(approve(a, editor)).rejects.toThrow("Not authorized");
    expect(await state(a)).toBe("PENDING_APPROVAL");
  });
  it("guards capacity changes against active bookings", async () => {
    const f = await fixture(),
      a = await request(f);
    await approve(a);
    await expect(
      pg.query("update sections set capacity=2 where id=$1", [f.sid]),
    ).rejects.toThrow("Capacity would invalidate");
  });
  it("rolls back a failed reschedule without losing the original allocation", async () => {
    const f = await fixture(),
      a = await request(f);
    await approve(a);
    await pay(a);
    const other = await fixture();
    await pg.query("update sections set deposit_cents=20000 where id=$1", [
      other.sid,
    ]);
    await expect(
      pg.query("select reschedule_reservation($1,$2,$3,$4,$5)", [
        a,
        owner,
        other.sid,
        other.wid,
        other.arrival,
      ]),
    ).rejects.toThrow("New terms differ");
    expect(
      (
        await pg.query(
          "select * from inventory_holds where reservation_id=$1 and section_id=$2 and active",
          [a, f.sid],
        )
      ).rows,
    ).toHaveLength(1);
  });
  it("protects existing inventory from overlapping blackouts", async () => {
    const f = await fixture(),
      a = await request(f);
    await approve(a);
    await expect(
      pg.query(
        "select create_blackout($1,$2,now()+interval '5 days',now()+interval '6 days','Test blackout')",
        [owner, f.sid],
      ),
    ).rejects.toThrow("existing booking or hold");
  });
  it("refuses expired booking deadlines and excess party size", async () => {
    const f = await fixture();
    await pg.query(
      "update booking_windows set booking_deadline=now()-interval '1 second' where id=$1",
      [f.wid],
    );
    await expect(request(f)).rejects.toThrow("deadline");
    const f2 = await fixture();
    await pg.query("update sections set capacity=2 where id=$1", [f2.sid]);
    await expect(request(f2)).rejects.toThrow("capacity");
  });
  it("cancels an event and its bookings without issuing automatic refunds", async () => {
    const f = await fixture();
    const e = randomUUID();
    await pg.query(
      "insert into events(id,sanity_id,title,starts_at,ends_at) values($1,$2,'TEST',now()+interval '5 days',now()+interval '6 days')",
      [e, e],
    );
    await pg.query("update booking_windows set event_id=$1 where id=$2", [
      e,
      f.wid,
    ]);
    await pg.query(
      "insert into event_section_rules(event_id,section_id) values($1,$2)",
      [e, f.sid],
    );
    const a = await request(f);
    await approve(a);
    await pay(a);
    await pg.query("select cancel_event($1,$2)", [owner, e]);
    expect(await state(a)).toBe("CANCELLED");
    expect(
      (
        await pg.query(
          "select * from refunds where payment_id in(select id from payments where reservation_id=$1)",
          [a],
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("limits requests using an atomic database counter", async () => {
    const key = randomUUID();
    const answers = [];
    for (let i = 0; i < 4; i++)
      answers.push(
        (
          await pg.query<{ allowed: boolean }>(
            "select consume_rate_limit($1,3) allowed",
            [key],
          )
        ).rows[0].allowed,
      );
    expect(answers).toEqual([true, true, true, false]);
  });
  it("denies public access to customer data and privileged functions", async () => {
    await pg.exec("set role anon");
    try {
      await expect(pg.query("select * from reservations")).rejects.toThrow(
        "permission denied",
      );
      await expect(pg.query("select expire_holds()")).rejects.toThrow(
        "permission denied",
      );
    } finally {
      await pg.exec("reset role");
    }
    await pg.exec("set role authenticated");
    try {
      await expect(pg.query("select * from payments")).rejects.toThrow(
        "permission denied",
      );
    } finally {
      await pg.exec("reset role");
    }
  });
});
