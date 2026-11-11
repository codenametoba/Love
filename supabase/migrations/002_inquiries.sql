create function public.create_inquiry(p_data jsonb) returns void language plpgsql security definer set search_path=public as $$
declare iid uuid;begin
 insert into inquiries(name,email,phone,preferred_date,event_type,guests,budget,message) values(p_data->>'name',lower(p_data->>'email'),p_data->>'phone',(p_data->>'date')::date,p_data->>'eventType',(p_data->>'guests')::int,p_data->>'budget',p_data->>'message') returning id into iid;
 insert into notifications(kind,payload) values('inquiry',jsonb_build_object('email',p_data->>'email','name',p_data->>'name')),('management',jsonb_build_object('reference',iid,'message','New private gathering inquiry'));
end;$$;
revoke all on function public.create_inquiry(jsonb) from public,anon,authenticated;
grant execute on function public.create_inquiry(jsonb) to service_role;
