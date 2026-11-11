create function public.renew_access(p_email text,p_reference text,p_hash text,p_url text) returns void language plpgsql security definer set search_path=public as $$
declare r reservations;begin
 select * into r from reservations where email=p_email and reference=p_reference;
 if r.id is null then return;end if;
 insert into reservation_access values(p_hash,r.id,now()+interval '30 days',now());
 insert into notifications(reservation_id,kind,payload) values(r.id,'access',jsonb_build_object('email',r.email,'reference',r.reference,'url',p_url));
end;$$;
revoke all on function public.renew_access(text,text,text,text) from public,anon,authenticated;
grant execute on function public.renew_access(text,text,text,text) to service_role;
