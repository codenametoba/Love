create function public.sync_event(p_actor uuid,p_sanity_id text,p_title text,p_start timestamptz,p_end timestamptz) returns uuid language plpgsql security definer set search_path=public as $$
declare e events;eid uuid;begin
 perform pg_advisory_xact_lock(20261110);
 perform require_staff(p_actor,array['owner','manager']::staff_role[]);
 select * into e from events where sanity_id=p_sanity_id for update;
 if e.id is not null and (e.starts_at<>p_start or e.ends_at<>p_end) and exists(select 1 from reservations r join booking_windows w on w.id=r.window_id where w.event_id=e.id and r.status in('PENDING_APPROVAL','AWAITING_PAYMENT','CONFIRMED')) then raise exception 'Existing requests or bookings prevent schedule changes. Resolve these first';end if;
 insert into events(sanity_id,title,starts_at,ends_at) values(p_sanity_id,p_title,p_start,p_end) on conflict(sanity_id) do update set title=excluded.title,starts_at=excluded.starts_at,ends_at=excluded.ends_at returning id into eid;
 insert into audit_logs(actor_id,action,entity_id) values(p_actor,'sync_event',eid::text);
 return eid;
end;$$;
create function public.event_section_override(p_actor uuid,p_event uuid,p_section uuid,p_deposit int,p_minimum int,p_policy text,p_eligible boolean) returns void language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(20261110);
 perform require_staff(p_actor,array['owner','manager']::staff_role[]);
 if p_deposit<=0 or p_minimum<p_deposit or length(p_policy)<21 then raise exception 'Invalid event terms';end if;
 insert into event_section_rules(event_id,section_id,eligible,deposit_cents,minimum_spend_cents,policy) values(p_event,p_section,p_eligible,p_deposit,p_minimum,p_policy) on conflict(event_id,section_id) do update set eligible=excluded.eligible,deposit_cents=excluded.deposit_cents,minimum_spend_cents=excluded.minimum_spend_cents,policy=excluded.policy;
 insert into audit_logs(actor_id,action,entity_id) values(p_actor,'event_override',p_event::text);
end;$$;
revoke all on function public.sync_event(uuid,text,text,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.sync_event(uuid,text,text,timestamptz,timestamptz) to service_role;
revoke all on function public.event_section_override(uuid,uuid,uuid,int,int,text,boolean) from public,anon,authenticated;
grant execute on function public.event_section_override(uuid,uuid,uuid,int,int,text,boolean) to service_role;
