create function public.save_section(p_actor uuid,p_id uuid,p_data jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare sid uuid;begin
 perform pg_advisory_xact_lock(20261110);
 perform require_staff(p_actor,array['owner','manager']::staff_role[]);
 sid:=coalesce(p_id,gen_random_uuid());
 insert into sections(id,name,description,capacity,deposit_cents,minimum_spend_cents,image_url,amenities,policy,layout_id,layout,published) values(sid,p_data->>'name',p_data->>'description',(p_data->>'capacity')::int,(p_data->>'deposit_cents')::int,(p_data->>'minimum_spend_cents')::int,p_data->>'image_url',array(select jsonb_array_elements_text(p_data->'amenities')),p_data->>'policy',(p_data->>'layout_id')::uuid,nullif(p_data->'layout','null'::jsonb),(p_data->>'published')::boolean) on conflict(id) do update set name=excluded.name,description=excluded.description,capacity=excluded.capacity,deposit_cents=excluded.deposit_cents,minimum_spend_cents=excluded.minimum_spend_cents,image_url=excluded.image_url,amenities=excluded.amenities,policy=excluded.policy,layout_id=excluded.layout_id,layout=excluded.layout,published=excluded.published;
 insert into audit_logs(actor_id,action,entity_id) values(p_actor,'save_section',sid::text);
 return sid;
end;$$;
create function public.save_layout(p_actor uuid,p_name text,p_verified boolean) returns uuid language plpgsql security definer set search_path=public as $$
declare lid uuid;begin perform require_staff(p_actor,array['owner','manager']::staff_role[]);insert into section_layouts(name,verified) values(p_name,p_verified) returning id into lid;insert into audit_logs(actor_id,action,entity_id) values(p_actor,'save_layout',lid::text);return lid;end;$$;
create function public.apply_refund_status(p_refund text,p_status text) returns void language plpgsql security definer set search_path=public as $$
declare pid uuid;begin
 update refunds set status=p_status where stripe_refund_id=p_refund returning payment_id into pid;
 if pid is not null and p_status='succeeded' then update payments set status='refunded' where id=pid;update payment_exceptions set resolved_at=now() where payment_id=pid;end if;
end;$$;
revoke all on function public.save_section(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_section(uuid,uuid,jsonb) to service_role;
revoke all on function public.save_layout(uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.save_layout(uuid,text,boolean) to service_role;
revoke all on function public.apply_refund_status(text,text) from public,anon,authenticated;
grant execute on function public.apply_refund_status(text,text) to service_role;
