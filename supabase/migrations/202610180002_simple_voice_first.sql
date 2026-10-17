-- Revised brief: three core features plus one-screen helpers. Retain old tables as legacy data.
alter table profiles add column whatsapp_opt_in boolean not null default false;
alter table profiles add column whatsapp_opt_in_at timestamptz;
alter table profiles add column whatsapp_opt_out_at timestamptz;
alter table profiles add column water_alert_opt_in boolean not null default false;
alter table profiles add column last_whatsapp_inbound_at timestamptz;
alter table fields add column water text;
alter table seasons add column harvest_date date;
alter table seasons add column yield_unit text not null default 'quintal' check(yield_unit in('quintal','kg'));
alter table diagnoses add column status text not null default 'queued' check(status in('queued','ready','needs_photo','expert_pending','expert_replied'));
alter table diagnoses add column confidence numeric check(confidence between 0 and 1);
alter table land_listings add column past_crops text[] not null default '{}';
alter table notifications add column channel text not null default 'push' check(channel in('whatsapp','sms','push'));
alter table notifications add column template text;
alter table notifications add column status text not null default 'queued' check(status in('queued','deferred','sent','failed','cancelled'));
alter table notifications add column sent_at timestamptz;
alter table notifications add column urgent boolean not null default false;
alter table notifications add column deep_link text;
alter table notifications add column audio_path text;
alter table notifications add column provider_message_id text;
alter table notifications add column dedupe_key text unique;
create index notification_daily_limit on notifications(farmer_id,sent_at) where status='sent' and not urgent;

create table public.notification_consents(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),opted_in boolean not null,source text not null check(source in('onboarding','settings','whatsapp_stop')),created_at timestamptz not null default now());
create table public.state_notices(state_code text not null,version integer not null,notice_en text not null,source text not null,effective_date date not null,created_at timestamptz not null default now(),primary key(state_code,version));
create table public.land_saved_searches(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),origin extensions.geography(point,4326),radius_km integer not null check(radius_km in(5,10,25)),max_rent numeric check(max_rent>0),min_area numeric,max_area numeric,water_source text,season text,created_at timestamptz not null default now());
create table public.land_messages(id uuid primary key default gen_random_uuid(),interest_id uuid not null references land_interests(id),sender_id uuid not null references profiles(id),text_en text not null check(length(text_en) between 1 and 1000),audio_path text,created_at timestamptz not null default now());
create table public.audio_cache(text_hash text not null,lang text not null,storage_path text not null,expires_at timestamptz not null,created_at timestamptz not null default now(),primary key(text_hash,lang));
alter table notification_consents enable row level security;
alter table state_notices enable row level security;
alter table land_saved_searches enable row level security;
alter table land_messages enable row level security;
alter table audio_cache enable row level security;
create policy own_consent_history on notification_consents for select to authenticated using(farmer_id=auth.uid());
create policy notices_read on state_notices for select to authenticated using(true);
create policy notices_admin on state_notices for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy own_land_searches on land_saved_searches for all to authenticated using(farmer_id=auth.uid()) with check(farmer_id=auth.uid());
create policy accepted_participants_read on land_messages for select to authenticated using(exists(select 1 from land_interests i join land_listings l on l.id=i.listing_id where i.id=interest_id and i.status='accepted' and (i.farmer_id=auth.uid() or l.owner_id=auth.uid())));
create policy accepted_participants_send on land_messages for insert to authenticated with check(sender_id=auth.uid() and exists(select 1 from land_interests i join land_listings l on l.id=i.listing_id where i.id=interest_id and i.status='accepted' and (i.farmer_id=auth.uid() or l.owner_id=auth.uid())));
-- Dynamic speech can contain private farm data. Client audio access is via server-authorized signed URLs.
create policy audio_admin on audio_cache for all to authenticated using(public.is_admin()) with check(public.is_admin());
revoke insert,update,delete on notification_consents from anon,authenticated;
revoke insert,update,delete on notifications from anon,authenticated;

create function public.set_whatsapp_consent(opt_in boolean) returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 update profiles set whatsapp_opt_in=opt_in,whatsapp_opt_in_at=case when opt_in then now() else whatsapp_opt_in_at end,whatsapp_opt_out_at=case when opt_in then null else now() end where id=auth.uid();
 insert into notification_consents(farmer_id,opted_in,source) values(auth.uid(),opt_in,'settings');
 if not opt_in then update notifications set status='cancelled' where farmer_id=auth.uid() and channel='whatsapp' and status in('queued','deferred');end if;
end$$;
revoke all on function set_whatsapp_consent(boolean) from public,anon;
grant execute on function set_whatsapp_consent(boolean) to authenticated;

create function public.accept_land_interest(interest uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 update land_interests i set status='accepted' from land_listings l where i.id=interest and l.id=i.listing_id and l.owner_id=auth.uid() and l.verified_status='approved' and i.status='requested';
 if not found then raise exception 'Verified listing owner and pending interest required';end if;
end$$;
revoke all on function accept_land_interest(uuid) from public,anon;
grant execute on function accept_land_interest(uuid) to authenticated;
-- Farmers cannot impersonate acceptance by updating their own interest's status.
revoke update on land_interests from authenticated;
revoke insert on land_interests from authenticated;
grant insert(id,farmer_id,listing_id) on land_interests to authenticated;

-- A transactional reservation serializes cap checks. Only a backend worker may call this.
create function public.reserve_notification(target uuid,kind text,message text,approved_template text,urgent_message boolean,dedupe text) returns uuid language plpgsql security definer set search_path=public as $$
declare p profiles;local_time timestamp;used integer;channel_name text;status_name text;result uuid;
begin
 select * into p from profiles where id=target for update;
 if p.id is null then raise exception 'Profile not found';end if;
 select id into result from notifications where dedupe_key=dedupe;
 if result is not null then return result;end if;
 if kind='water' and not p.water_alert_opt_in then return null;end if;
 local_time=now() at time zone 'Asia/Kolkata';
 channel_name=case when p.whatsapp_opt_in then 'whatsapp' else 'push' end;
 if channel_name='whatsapp' and (p.last_whatsapp_inbound_at is null or p.last_whatsapp_inbound_at<now()-interval '24 hours') and approved_template is null then raise exception 'Approved template required outside service window';end if;
 select count(*) into used from notifications where farmer_id=target and not urgent and status in('sent','queued') and (created_at at time zone 'Asia/Kolkata')::date=local_time::date;
 status_name=case when extract(hour from local_time)>=21 or extract(hour from local_time)<6 or(not urgent_message and used>=2) then 'deferred' else 'queued' end;
 insert into notifications(farmer_id,message_en,channel,template,status,urgent,dedupe_key) values(target,message,channel_name,approved_template,status_name,urgent_message,dedupe) returning id into result;
 return result;
end$$;
revoke all on function reserve_notification(uuid,text,text,text,boolean,text) from public,anon,authenticated;
grant execute on function reserve_notification(uuid,text,text,text,boolean,text) to service_role;
-- The sending worker MUST re-check consent, quiet hours and reservations immediately before delivery.

-- Terminology aliases use the existing normalized tables and their underlying RLS.
create view shops with(security_invoker=true) as select id,owner_id,name,verified_status,location from sellers;
create view shop_prices with(security_invoker=true) as select id,seller_id as shop_id,product_id,price,pack_quantity,pack_unit,stock from seller_listings;
create view buyers with(security_invoker=true) as select distinct owner_id as id,name,verified_status,location from buyer_demands;
create view buyer_offers with(security_invoker=true) as select id,owner_id as buyer_id,crop_id,quantity_quintals,price_per_quintal,verified_status,location from buyer_demands;
insert into state_notices(state_code,version,notice_en,source,effective_date) values('UP',1,'Owner and farmer agree lease terms themselves under applicable state law. The app only connects them; it never creates or stores a lease.','Demo notice: local legal review required before production','2026-10-18');
