-- LOVE operational source of truth. Run with the Supabase SQL editor or CLI.
create extension if not exists btree_gist;
create extension if not exists pgcrypto;
create type public.staff_role as enum ('owner','manager','reservations','editor');
create type public.reservation_status as enum ('PENDING_APPROVAL','AWAITING_PAYMENT','CONFIRMED','DECLINED','EXPIRED','CANCELLED','PAYMENT_EXCEPTION');
create table public.staff_roles(user_id uuid primary key references auth.users(id) on delete cascade, role public.staff_role not null);
create table public.section_zones(id uuid primary key default gen_random_uuid(),name text not null);
create table public.section_layouts(id uuid primary key default gen_random_uuid(),name text not null,background_url text,verified boolean not null default false);
create table public.sections(
 id uuid primary key default gen_random_uuid(),zone_id uuid references public.section_zones,layout_id uuid references public.section_layouts,
 name text not null,description text not null default '',capacity int not null check(capacity between 1 and 1000),
 deposit_cents int not null check(deposit_cents>0),minimum_spend_cents int not null check(minimum_spend_cents>=deposit_cents),
 image_url text,amenities text[] not null default '{}',policy text not null check(length(policy)>20),
 layout jsonb, published boolean not null default false,created_at timestamptz not null default now()
);
create table public.section_images(id uuid primary key default gen_random_uuid(),section_id uuid not null references public.sections on delete cascade,url text not null,caption text not null,sort_order int not null default 0);
create table public.events(id uuid primary key default gen_random_uuid(),sanity_id text unique not null,title text not null,starts_at timestamptz not null,ends_at timestamptz not null,cancelled boolean not null default false,check(ends_at>starts_at));
create table public.booking_windows(id uuid primary key default gen_random_uuid(),title text not null,starts_at timestamptz not null,ends_at timestamptz not null,arrival_start timestamptz not null,arrival_end timestamptz not null,event_id uuid references public.events,published boolean not null default false,booking_deadline timestamptz not null,lead_minutes int not null default 120 check(lead_minutes>=0),check(ends_at>starts_at),check(arrival_start>=starts_at and arrival_end<=ends_at and arrival_end>=arrival_start),check(booking_deadline<=starts_at));
create table public.availability_rules(id uuid primary key default gen_random_uuid(),section_id uuid not null references public.sections,window_id uuid not null references public.booking_windows,enabled boolean not null default true,unique(section_id,window_id));
create table public.blackouts(id uuid primary key default gen_random_uuid(),section_id uuid references public.sections,period tstzrange not null,reason text not null,check(not isempty(period)));
create table public.event_section_rules(event_id uuid references public.events on delete cascade,section_id uuid references public.sections,eligible boolean not null default true,deposit_cents int check(deposit_cents>0),minimum_spend_cents int check(minimum_spend_cents>=0),policy text,primary key(event_id,section_id));
create table public.reservations(
 id uuid primary key default gen_random_uuid(),reference text not null unique default upper(encode(gen_random_bytes(6),'hex')),
 request_key uuid not null unique default gen_random_uuid(),
 status public.reservation_status not null default 'PENDING_APPROVAL',section_id uuid not null references public.sections,window_id uuid not null references public.booking_windows,
 name text not null,email text not null,phone text not null,guests int not null check(guests>0),arrival timestamptz not null,occasion text not null,requests text not null default '',
 deposit_cents int not null check(deposit_cents>0),minimum_spend_cents int not null check(minimum_spend_cents>=deposit_cents),policy text not null,
 hold_expires_at timestamptz,checked_in_at timestamptz,no_show boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
-- A single allocation relation covers holds, confirmed bookings, and manual bookings.
-- Exclusion is enforced in PostgreSQL even when two separate workers race.
create table public.inventory_holds(id uuid primary key default gen_random_uuid(),reservation_id uuid not null unique references public.reservations,section_id uuid not null references public.sections,period tstzrange not null,expires_at timestamptz,active boolean not null default true,check(not isempty(period)),exclude using gist(section_id with =,period with &&) where(active));
create table public.confirmed_reservations(reservation_id uuid primary key references public.reservations,allocation_id uuid not null unique references public.inventory_holds,confirmed_at timestamptz not null default now());
create table public.reservation_access(token_hash text primary key,reservation_id uuid not null references public.reservations,expires_at timestamptz not null,created_at timestamptz not null default now());
create table public.checkout_sessions(id text primary key,reservation_id uuid not null references public.reservations,amount_cents int not null,expires_at timestamptz not null,created_at timestamptz not null default now());
create table public.payments(id uuid primary key default gen_random_uuid(),reservation_id uuid not null references public.reservations,stripe_session_id text not null unique,payment_intent_id text unique,amount_cents int not null,currency text not null,status text not null check(status in ('paid','exception','refunded')),created_at timestamptz not null default now());
create table public.refunds(id uuid primary key default gen_random_uuid(),payment_id uuid not null references public.payments,stripe_refund_id text unique,reason text not null,status text not null default 'requested',created_at timestamptz not null default now());
create table public.payment_events(stripe_event_id text primary key,created_at timestamptz not null default now());
create table public.payment_exceptions(id uuid primary key default gen_random_uuid(),reservation_id uuid references public.reservations,payment_id uuid references public.payments,reason text not null,resolved_at timestamptz,created_at timestamptz not null default now());
create table public.notifications(id uuid primary key default gen_random_uuid(),reservation_id uuid references public.reservations,kind text not null,payload jsonb not null,attempts int not null default 0,lease_until timestamptz,delivered_at timestamptz,last_error text,created_at timestamptz not null default now());
create index notifications_pending on public.notifications(created_at) where delivered_at is null;
create table public.reservation_activity(id uuid primary key default gen_random_uuid(),reservation_id uuid not null references public.reservations,actor_id uuid references auth.users,action text not null,note text,created_at timestamptz not null default now());
create table public.audit_logs(id uuid primary key default gen_random_uuid(),actor_id uuid references auth.users,action text not null,entity_id text,details jsonb not null default '{}',created_at timestamptz not null default now());
create table public.inquiries(id uuid primary key default gen_random_uuid(),name text not null,email text not null,phone text not null,preferred_date date not null,event_type text not null,guests int not null,budget text,message text not null,status text not null default 'new' check(status in('new','contacted','planning','closed')),notes text,created_at timestamptz not null default now());
create table public.customer_changes(id uuid primary key default gen_random_uuid(),reservation_id uuid not null references public.reservations,kind text not null check(kind in('cancellation','date-change','contact')),message text not null,status text not null default 'new',created_at timestamptz not null default now());
create table public.rate_limits(key text primary key,hits int not null default 1,reset_at timestamptz not null);

create function public.require_staff(actor uuid,allowed public.staff_role[]) returns void language plpgsql security definer set search_path=public as $$
begin if not exists(select 1 from staff_roles where user_id=actor and role=any(allowed)) then raise exception 'Not authorized';end if;end;$$;
create function public.consume_rate_limit(p_key text,p_limit int default 6) returns boolean language plpgsql security definer set search_path=public as $$
declare count_hits int;begin insert into rate_limits(key,hits,reset_at) values(p_key,1,now()+interval '1 hour') on conflict(key) do update set hits=case when rate_limits.reset_at<now() then 1 else rate_limits.hits+1 end,reset_at=case when rate_limits.reset_at<now() then now()+interval '1 hour' else rate_limits.reset_at end returning hits into count_hits;return count_hits<=p_limit;end;$$;
create function public.expire_holds() returns void language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(20261110);
 -- Lock reservations before their allocation rows, matching approval/payment lock ordering.
 perform 1 from reservations r where r.status='AWAITING_PAYMENT' and r.hold_expires_at<=clock_timestamp() order by r.id for update;
 update inventory_holds h set active=false where active and expires_at<=clock_timestamp();
 with expired as (update reservations set status='EXPIRED',updated_at=clock_timestamp() where status='AWAITING_PAYMENT' and hold_expires_at<=clock_timestamp() returning id,email,reference)
 insert into notifications(reservation_id,kind,payload) select id,'expired',jsonb_build_object('email',email,'reference',reference) from expired;
end;$$;
-- Caller must have serialized the section row before validating/allocating.
create function public.validate_slot(p_section uuid,p_window uuid,p_guests int,p_arrival timestamptz) returns jsonb language plpgsql security definer set search_path=public as $$
declare s sections;w booking_windows;er event_section_rules;deposit int;minimum int;terms text;begin
 select * into s from sections where id=p_section and published;
 select * into w from booking_windows where id=p_window and published;
 if s.id is null or w.id is null then raise exception 'This section or night is not bookable';end if;
 if clock_timestamp()>=w.booking_deadline or clock_timestamp()+make_interval(mins=>w.lead_minutes)>=w.starts_at then raise exception 'The booking deadline has passed';end if;
 if not exists(select 1 from availability_rules where section_id=s.id and window_id=w.id and enabled) then raise exception 'Section unavailable on this night';end if;
 if p_guests<1 or p_guests>s.capacity then raise exception 'Party size exceeds capacity';end if;
 if p_arrival<w.arrival_start or p_arrival>w.arrival_end then raise exception 'Choose an arrival within the published window';end if;
 if exists(select 1 from blackouts where (section_id is null or section_id=s.id) and period && tstzrange(w.starts_at,w.ends_at,'[)')) then raise exception 'This night is blocked';end if;
 deposit:=s.deposit_cents;minimum:=s.minimum_spend_cents;terms:=s.policy;
 if w.event_id is not null then
  if not exists(select 1 from events where id=w.event_id and not cancelled) then raise exception 'Event is not bookable';end if;
  select * into er from event_section_rules where event_id=w.event_id and section_id=s.id;
  if er.event_id is null or not er.eligible then raise exception 'Section not eligible for this event';end if;
  deposit:=coalesce(er.deposit_cents,deposit);minimum:=coalesce(er.minimum_spend_cents,minimum);terms:=coalesce(nullif(er.policy,''),terms);
 end if;
 if minimum<deposit or length(terms)<21 then raise exception 'Management must complete the booking policy';end if;
 if exists(select 1 from inventory_holds where section_id=s.id and active and (expires_at is null or expires_at>clock_timestamp()) and period && tstzrange(w.starts_at,w.ends_at,'[)')) then raise exception 'Section is no longer available';end if;
 return jsonb_build_object('deposit_cents',deposit,'minimum_spend_cents',minimum,'policy',terms);
end;$$;
create function public.create_request(p_data jsonb,p_token_hash text,p_access_url text) returns jsonb language plpgsql security definer set search_path=public as $$
declare terms jsonb;r reservations;begin
 perform pg_advisory_xact_lock(20261110);
 if p_data->>'requestId' is not null then
  select * into r from reservations where request_key=(p_data->>'requestId')::uuid;
  if r.id is not null then
   if r.email<>lower(p_data->>'email') or r.section_id<>(p_data->>'sectionId')::uuid or r.window_id<>(p_data->>'windowId')::uuid then raise exception 'Request details changed. Reload the page and submit again';end if;
   return jsonb_build_object('reference',r.reference,'status',r.status);
  end if;
 end if;
 perform 1 from sections where id=(p_data->>'sectionId')::uuid for update;
 terms:=validate_slot((p_data->>'sectionId')::uuid,(p_data->>'windowId')::uuid,(p_data->>'guests')::int,(p_data->>'arrival')::timestamptz);
 insert into reservations(request_key,section_id,window_id,name,email,phone,guests,arrival,occasion,requests,deposit_cents,minimum_spend_cents,policy) values(coalesce((p_data->>'requestId')::uuid,gen_random_uuid()),(p_data->>'sectionId')::uuid,(p_data->>'windowId')::uuid,p_data->>'name',lower(p_data->>'email'),p_data->>'phone',(p_data->>'guests')::int,(p_data->>'arrival')::timestamptz,p_data->>'occasion',coalesce(p_data->>'requests',''),(terms->>'deposit_cents')::int,(terms->>'minimum_spend_cents')::int,terms->>'policy') returning * into r;
 insert into reservation_access values(p_token_hash,r.id,clock_timestamp()+interval '30 days',clock_timestamp());
 insert into reservation_activity(reservation_id,action) values(r.id,'request_submitted');
 insert into notifications(reservation_id,kind,payload) values(r.id,'request',jsonb_build_object('email',r.email,'name',r.name,'reference',r.reference,'url',p_access_url)),(r.id,'management',jsonb_build_object('reference',r.reference,'message','New reservation request'));
 return jsonb_build_object('reference',r.reference,'status',r.status);
end;$$;
create function public.approve_request(p_id uuid,p_actor uuid,p_token_hash text,p_access_url text) returns jsonb language plpgsql security definer set search_path=public as $$
declare r reservations;w booking_windows;terms jsonb;expiry timestamptz;begin
 perform pg_advisory_xact_lock(20261110);
 perform require_staff(p_actor,array['owner','manager','reservations']::staff_role[]);
 select * into r from reservations where id=p_id for update;
 if r.id is null then raise exception 'Request not found';end if;
 if r.status='AWAITING_PAYMENT' then return jsonb_build_object('status',r.status,'expires_at',r.hold_expires_at);end if;
 if r.status<>'PENDING_APPROVAL' then raise exception 'Only pending requests can be approved';end if;
 perform 1 from sections where id=r.section_id for update;
 -- Release only this section's expired allocations; no reverse lock acquisition on other reservations.
 update inventory_holds set active=false where section_id=r.section_id and active and expires_at<=clock_timestamp();
 terms:=validate_slot(r.section_id,r.window_id,r.guests,r.arrival);
 -- Never silently change the price/policy the customer reviewed.
 if (terms->>'deposit_cents')::int<>r.deposit_cents or (terms->>'minimum_spend_cents')::int<>r.minimum_spend_cents or terms->>'policy'<>r.policy then raise exception 'Terms have changed. Contact the guest and create a new request';end if;
 select * into w from booking_windows where id=r.window_id;
 expiry:=least(clock_timestamp()+interval '24 hours',w.booking_deadline);
 if expiry<clock_timestamp()+interval '31 minutes' then raise exception 'Insufficient time for secure Checkout. Contact management';end if;
 insert into inventory_holds(reservation_id,section_id,period,expires_at) values(r.id,r.section_id,tstzrange(w.starts_at,w.ends_at,'[)'),expiry);
 update reservations set status='AWAITING_PAYMENT',hold_expires_at=expiry,updated_at=clock_timestamp() where id=r.id;
 insert into reservation_access values(p_token_hash,r.id,clock_timestamp()+interval '30 days',clock_timestamp());
 insert into notifications(reservation_id,kind,payload) values(r.id,'approved',jsonb_build_object('email',r.email,'reference',r.reference,'deposit',r.deposit_cents,'minimum',r.minimum_spend_cents,'policy',r.policy,'arrival',r.arrival,'expires',expiry,'url',p_access_url));
 insert into reservation_activity(reservation_id,actor_id,action) values(r.id,p_actor,'approved');
 insert into audit_logs(actor_id,action,entity_id) values(p_actor,'approve_request',r.id::text);
 return jsonb_build_object('status','AWAITING_PAYMENT','expires_at',expiry);
end;$$;
create function public.settle_payment(p_event text,p_session text,p_reservation uuid,p_intent text,p_amount int,p_currency text) returns text language plpgsql security definer set search_path=public as $$
declare r reservations;h inventory_holds;pid uuid;valid boolean;begin
 perform pg_advisory_xact_lock(20261110);
 select * into r from reservations where id=p_reservation for update;
 if r.id is null then raise exception 'Unknown reservation';end if;
 insert into payment_events(stripe_event_id) values(p_event) on conflict do nothing;
 if not found then return 'duplicate';end if;
 if exists(select 1 from payments where stripe_session_id=p_session) then return 'duplicate';end if;
 perform 1 from sections where id=r.section_id for update;
 select * into h from inventory_holds where reservation_id=r.id for update;
 valid:=r.status='AWAITING_PAYMENT' and h.active and h.expires_at>clock_timestamp() and r.hold_expires_at>clock_timestamp() and p_amount=r.deposit_cents and p_currency='usd' and exists(select 1 from checkout_sessions where id=p_session and reservation_id=r.id and amount_cents=p_amount);
 insert into payments(reservation_id,stripe_session_id,payment_intent_id,amount_cents,currency,status) values(r.id,p_session,p_intent,p_amount,p_currency,case when coalesce(valid,false) then 'paid' else 'exception' end) returning id into pid;
 if not coalesce(valid,false) then
  insert into payment_exceptions(reservation_id,payment_id,reason) values(r.id,pid,'Late, mismatched, duplicate, or unallocated payment. Review and refund or resolve; never allocate automatically.');
  -- A second payment must never invalidate an already confirmed booking.
  if r.status<>'CONFIRMED' then
   update reservations set status='PAYMENT_EXCEPTION',updated_at=clock_timestamp() where id=r.id;
   update inventory_holds set active=false where reservation_id=r.id;
  end if;
  insert into notifications(reservation_id,kind,payload) values(r.id,'payment_exception',jsonb_build_object('email',r.email,'reference',r.reference)),(r.id,'management',jsonb_build_object('reference',r.reference,'message','Payment exception requires attention'));
  return 'exception';
 end if;
 update inventory_holds set expires_at=null where id=h.id;
 insert into confirmed_reservations(reservation_id,allocation_id) values(r.id,h.id);
 update reservations set status='CONFIRMED',updated_at=clock_timestamp() where id=r.id;
 insert into reservation_activity(reservation_id,action) values(r.id,'deposit_verified');
 insert into notifications(reservation_id,kind,payload) values(r.id,'confirmed',jsonb_build_object('email',r.email,'name',r.name,'reference',r.reference,'deposit',r.deposit_cents,'policy',r.policy,'arrival',r.arrival,'section',(select name from sections where id=r.section_id),'guests',r.guests));
 return 'confirmed';
end;$$;
create function public.manage_reservation(p_id uuid,p_actor uuid,p_action text,p_note text default '') returns void language plpgsql security definer set search_path=public as $$
declare r reservations;begin
 perform pg_advisory_xact_lock(20261110);
 perform require_staff(p_actor,array['owner','manager','reservations']::staff_role[]);
 select * into r from reservations where id=p_id for update;
 if r.id is null then raise exception 'Reservation not found';end if;
 perform 1 from sections where id=r.section_id for update;
 if p_action='decline' then
  if r.status<>'PENDING_APPROVAL' then raise exception 'Only pending requests can be declined';end if;
  update reservations set status='DECLINED',updated_at=now() where id=r.id;
 elsif p_action='cancel' then
  if r.status in('CANCELLED','DECLINED') then return;end if;
  update inventory_holds set active=false where reservation_id=r.id;
  update reservations set status='CANCELLED',updated_at=now() where id=r.id;
  if exists(select 1 from payments where reservation_id=r.id and status='paid') then
   insert into payment_exceptions(reservation_id,reason) values(r.id,'Cancelled paid booking: management must review the refund policy.');
  end if;
 elsif p_action='check-in' then
  if r.status<>'CONFIRMED' then raise exception 'Only confirmed guests may check in';end if;
  update reservations set checked_in_at=now(),no_show=false where id=r.id;
 elsif p_action='no-show' then
  if r.status<>'CONFIRMED' then raise exception 'Only confirmed reservations can be marked no-show';end if;
  update reservations set no_show=true where id=r.id;
 elsif p_action<>'note' then raise exception 'Unsupported action';
 end if;
 insert into reservation_activity(reservation_id,actor_id,action,note) values(r.id,p_actor,p_action,p_note);
 insert into audit_logs(actor_id,action,entity_id,details) values(p_actor,p_action,r.id::text,jsonb_build_object('note',p_note));
 if p_action in('decline','cancel') then insert into notifications(reservation_id,kind,payload) values(r.id,p_action,jsonb_build_object('email',r.email,'reference',r.reference,'message',p_note));end if;
end;$$;
create function public.reschedule_reservation(p_id uuid,p_actor uuid,p_section uuid,p_window uuid,p_arrival timestamptz) returns void language plpgsql security definer set search_path=public as $$
declare r reservations;w booking_windows;terms jsonb;h inventory_holds;begin
 perform pg_advisory_xact_lock(20261110);
 perform require_staff(p_actor,array['owner','manager','reservations']::staff_role[]);
 select * into r from reservations where id=p_id for update;
 if r.status not in('PENDING_APPROVAL','CONFIRMED') then raise exception 'Reschedule pending or confirmed bookings only; cancel unpaid approvals first';end if;
 -- Consistent section lock order prevents cross-reschedule deadlocks.
 perform 1 from sections where id in(r.section_id,p_section) order by id for update;
 select * into h from inventory_holds where reservation_id=r.id for update;
 update inventory_holds set active=false where reservation_id=r.id;
 update inventory_holds set active=false where section_id=p_section and active and expires_at<=now();
 terms:=validate_slot(p_section,p_window,r.guests,p_arrival);
 if (terms->>'deposit_cents')::int<>r.deposit_cents or (terms->>'minimum_spend_cents')::int<>r.minimum_spend_cents or terms->>'policy'<>r.policy then raise exception 'New terms differ. Cancel and create a new request with guest consent';end if;
 select * into w from booking_windows where id=p_window;
 if r.status='CONFIRMED' then update inventory_holds set section_id=p_section,period=tstzrange(w.starts_at,w.ends_at,'[)'),active=true where id=h.id;end if;
 update reservations set section_id=p_section,window_id=p_window,arrival=p_arrival,updated_at=now() where id=r.id;
 insert into reservation_activity(reservation_id,actor_id,action) values(r.id,p_actor,'rescheduled');
 insert into audit_logs(actor_id,action,entity_id) values(p_actor,'reschedule',r.id::text);
 insert into notifications(reservation_id,kind,payload) values(r.id,'rescheduled',jsonb_build_object('email',r.email,'reference',r.reference,'arrival',p_arrival));
end;$$;
create function public.claim_notifications() returns setof public.notifications language sql security definer set search_path=public as $$
 update notifications set lease_until=now()+interval '5 minutes',attempts=attempts+1 where id in(select id from notifications where delivered_at is null and attempts<12 and (lease_until is null or lease_until<now()) order by created_at for update skip locked limit 20) returning *;
$$;
create function public.capacity_guard() returns trigger language plpgsql set search_path=public as $$
begin if exists(select 1 from reservations r join booking_windows w on w.id=r.window_id where r.section_id=new.id and r.status in('AWAITING_PAYMENT','CONFIRMED') and w.ends_at>now() and r.guests>new.capacity) then raise exception 'Capacity would invalidate an active reservation';end if;return new;end;$$;
create trigger protect_capacity before update of capacity on public.sections for each row execute function public.capacity_guard();
-- Every operational relation is private. Public discovery uses redacted server endpoints.
do $$declare t text;begin foreach t in array array['staff_roles','section_zones','section_layouts','sections','section_images','events','booking_windows','availability_rules','blackouts','event_section_rules','reservations','inventory_holds','confirmed_reservations','reservation_access','checkout_sessions','payments','refunds','payment_events','payment_exceptions','notifications','reservation_activity','audit_logs','inquiries','customer_changes','rate_limits'] loop execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon, authenticated',t);execute format('grant all on public.%I to service_role',t);end loop;end;$$;
grant select on public.staff_roles to authenticated;
create policy staff_can_read_own_role on public.staff_roles for select to authenticated using(user_id=auth.uid());
-- Explicitly remove default PUBLIC function execution privileges.
do $$declare f record;begin for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('require_staff','consume_rate_limit','expire_holds','validate_slot','create_request','approve_request','settle_payment','manage_reservation','reschedule_reservation','claim_notifications','capacity_guard') loop execute format('revoke all on function %s from public,anon,authenticated',f.sig);execute format('grant execute on function %s to service_role',f.sig);end loop;end;$$;
-- Uploads remain private until an authorized staff member publishes a reference.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('venue-media','venue-media',false,10485760,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
