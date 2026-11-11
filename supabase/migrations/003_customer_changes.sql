create function public.customer_change(p_id uuid,p_kind text,p_message text) returns void language plpgsql security definer set search_path=public as $$
begin
 if p_kind not in('cancellation','date-change','contact') then raise exception 'Invalid request type';end if;
 insert into customer_changes(reservation_id,kind,message) values(p_id,p_kind,p_message);
 insert into notifications(reservation_id,kind,payload) values(p_id,'management',jsonb_build_object('reference',(select reference from reservations where id=p_id),'message','Customer requested '||p_kind));
 insert into reservation_activity(reservation_id,action,note) values(p_id,'customer_'||p_kind,p_message);
end;$$;
revoke all on function public.customer_change(uuid,text,text) from public,anon,authenticated;
grant execute on function public.customer_change(uuid,text,text) to service_role;
