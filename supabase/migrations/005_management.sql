create function public.create_booking_window(p_actor uuid,p_window jsonb,p_sections uuid[]) returns void language plpgsql security definer set search_path=public as $$
declare wid uuid;sid uuid;begin
 perform pg_advisory_xact_lock(20261110);
 perform require_staff(p_actor,array['owner','manager']::staff_role[]);
 insert into booking_windows(title,starts_at,ends_at,arrival_start,arrival_end,event_id,published,booking_deadline,lead_minutes) values(p_window->>'title',(p_window->>'starts_at')::timestamptz,(p_window->>'ends_at')::timestamptz,(p_window->>'arrival_start')::timestamptz,(p_window->>'arrival_end')::timestamptz,(p_window->>'event_id')::uuid,(p_window->>'published')::boolean,(p_window->>'booking_deadline')::timestamptz,(p_window->>'lead_minutes')::int) returning id into wid;
 foreach sid in array p_sections loop insert into availability_rules(section_id,window_id) values(sid,wid);if p_window->>'event_id' is not null then insert into event_section_rules(event_id,section_id) values((p_window->>'event_id')::uuid,sid) on conflict do nothing;end if;end loop;
 insert into audit_logs(actor_id,action,entity_id) values(p_actor,'create_booking_window',wid::text);
end;$$;
create function public.create_blackout(p_actor uuid,p_section uuid,p_start timestamptz,p_end timestamptz,p_reason text) returns void language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(20261110);
 perform require_staff(p_actor,array['owner','manager']::staff_role[]);
 if p_end<=p_start then raise exception 'Invalid date interval';end if;
 perform 1 from sections where p_section is null or id=p_section order by id for update;
 if exists(select 1 from inventory_holds where active and (expires_at is null or expires_at>now()) and (p_section is null or section_id=p_section) and period&&tstzrange(p_start,p_end,'[)')) then raise exception 'An existing booking or hold overlaps. Resolve it before blocking this period';end if;
 insert into blackouts(section_id,period,reason) values(p_section,tstzrange(p_start,p_end,'[)'),p_reason);
 insert into audit_logs(actor_id,action,details) values(p_actor,'create_blackout',jsonb_build_object('section',p_section,'start',p_start,'end',p_end,'reason',p_reason));
end;$$;
create function public.update_inquiry(p_actor uuid,p_id uuid,p_status text,p_notes text) returns void language plpgsql security definer set search_path=public as $$
begin perform require_staff(p_actor,array['owner','manager','reservations']::staff_role[]);update inquiries set status=p_status,notes=p_notes where id=p_id;insert into audit_logs(actor_id,action,entity_id) values(p_actor,'update_inquiry',p_id::text);end;$$;
create function public.assign_staff_role(p_actor uuid,p_user uuid,p_role public.staff_role) returns void language plpgsql security definer set search_path=public as $$
begin perform require_staff(p_actor,array['owner']::staff_role[]);if p_actor=p_user then raise exception 'Cannot change own role';end if;insert into staff_roles values(p_user,p_role) on conflict(user_id) do update set role=p_role;insert into audit_logs(actor_id,action,entity_id,details) values(p_actor,'assign_role',p_user::text,jsonb_build_object('role',p_role));end;$$;
create function public.record_refund(p_actor uuid,p_payment uuid,p_refund text,p_status text,p_reason text) returns void language plpgsql security definer set search_path=public as $$
begin perform require_staff(p_actor,array['owner','manager']::staff_role[]);insert into refunds(payment_id,stripe_refund_id,status,reason) values(p_payment,p_refund,p_status,p_reason) on conflict(stripe_refund_id) do update set status=excluded.status;if p_status='succeeded' then update payments set status='refunded' where id=p_payment;update payment_exceptions set resolved_at=now() where payment_id=p_payment;end if;insert into audit_logs(actor_id,action,entity_id) values(p_actor,'refund_submitted',p_payment::text);end;$$;
create function public.cancel_event(p_actor uuid,p_event uuid) returns void language plpgsql security definer set search_path=public as $$
declare r record;begin
 perform pg_advisory_xact_lock(20261110);
 perform require_staff(p_actor,array['owner','manager']::staff_role[]);
 update events set cancelled=true where id=p_event;
 update booking_windows set published=false where event_id=p_event;
 for r in select reservations.id from reservations join booking_windows w on w.id=reservations.window_id where w.event_id=p_event and reservations.status in('PENDING_APPROVAL','AWAITING_PAYMENT','CONFIRMED') order by reservations.id loop perform manage_reservation(r.id,p_actor,'cancel','Event cancelled by management. The team will review any refund due.');end loop;
 insert into audit_logs(actor_id,action,entity_id) values(p_actor,'cancel_event',p_event::text);
end;$$;
do $$declare f record;begin for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('create_booking_window','create_blackout','update_inquiry','assign_staff_role','record_refund','cancel_event') loop execute format('revoke all on function %s from public,anon,authenticated',f.sig);execute format('grant execute on function %s to service_role',f.sig);end loop;end;$$;
