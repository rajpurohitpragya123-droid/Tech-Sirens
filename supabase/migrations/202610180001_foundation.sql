-- Reference migration. Apply only to a local Supabase instance, then run the SQL checks.
create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create type public.app_role as enum ('farmer','seller','buyer','transporter','storage_operator','landowner','stubble_partner','technician','expert','admin');
create type public.verification_status as enum ('pending','approved','rejected');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 role app_role not null default 'farmer', name text, phone text, language text not null default 'hi', village text,
 location extensions.geography(point,4326), verified_status verification_status not null default 'pending',
 benchmark_opt_in boolean not null default false, created_at timestamptz not null default now()
);
create function public.is_admin() returns boolean language sql stable security definer set search_path=public
as $$select exists(select 1 from public.profiles where id=auth.uid() and role='admin')$$;
create function public.create_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,phone) values(new.id,new.phone) on conflict do nothing;return new;end$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile();
create function public.protect_verification() returns trigger language plpgsql set search_path=public as $$
begin
 if auth.role()='authenticated' and not public.is_admin() and
 ((to_jsonb(new)->>'verified_status') is distinct from (to_jsonb(old)->>'verified_status'))
 then raise exception 'Only an administrator may change verification';end if;
 return new;
end$$;

create table public.crop_reference (
 id text primary key, kc numeric[] not null, stage_days integer[] not null, crop_duration integer not null check(crop_duration>0),
 shelf_life_days integer not null, residue_factor numeric not null check(residue_factor>=0), reference_source text not null,
 effective_date date not null, created_at timestamptz not null default now()
);
create table public.fields (
 id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),name text not null,area numeric not null check(area>0),
 unit text not null check(unit in ('acre','bigha','hectare')), ownership text not null check(ownership in ('owned','rented')),
 soil text,irrigation_method text,pump_flow_rate numeric check(pump_flow_rate>0),location extensions.geography(point,4326),created_at timestamptz not null default now()
);
create index fields_location_gist on fields using gist(location);
create table public.seasons (
 id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),field_id uuid not null references fields(id),
 crop_id text not null references crop_reference(id),season text not null,variety text,sowing_date date,yield_quintals numeric check(yield_quintals>=0),
 yield_per_acre numeric check(yield_per_acre>=0),seed_rate numeric,sowing_offset_days numeric,fertiliser_splits integer,soil text,
 created_at timestamptz not null default now()
);
create table public.diary_entries(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),season_id uuid references seasons(id),kind text not null,quantity numeric,unit text,note text,occurred_at timestamptz not null default now(),created_at timestamptz not null default now());
create table public.diseases(id text primary key,crop_id text not null references crop_reference(id),name_en text not null,description_en text not null,humidity_min numeric,temperature_min numeric,temperature_max numeric,created_at timestamptz not null default now());
create table public.treatments(id uuid primary key default gen_random_uuid(),disease_id text not null references diseases(id),kind text not null check(kind in('organic','low_cost','chemical')),active_ingredient text,dose_per_acre numeric,dose_unit text,advice_en text not null,safety_en text not null,preharvest_days integer,reference_source text not null,created_at timestamptz not null default now());
create table public.diagnoses(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),field_id uuid references fields(id),crop_id text references crop_reference(id),image_path text,predictions jsonb not null,model_version text not null,mock boolean not null default true,expert_label text,feedback text,created_at timestamptz not null default now());
create table public.products(id uuid primary key default gen_random_uuid(),name_en text not null,category text not null check(category in('protection','seed','fertiliser','manure')),manufacturer text,registration_no text,govt_mrp numeric,mrp_source text,mrp_effective_date date,created_at timestamptz not null default now(),check(govt_mrp is null or(mrp_source is not null and mrp_effective_date is not null)));
create table public.sellers(id uuid primary key default gen_random_uuid(),owner_id uuid not null references profiles(id),name text not null,licence_path text,verified_status verification_status not null default 'pending',location extensions.geography(point,4326),created_at timestamptz not null default now());
create table public.seller_listings(id uuid primary key default gen_random_uuid(),seller_id uuid not null references sellers(id),product_id uuid not null references products(id),price numeric not null check(price>0),pack_quantity numeric not null check(pack_quantity>0),pack_unit text not null,stock numeric not null check(stock>=0),delivery_hours integer,rating numeric,commission numeric not null default 0,created_at timestamptz not null default now());
create table public.verified_batches(id uuid primary key default gen_random_uuid(),product_id uuid not null references products(id),batch_no text not null unique,status text not null check(status in('verified','reported_fake')),created_at timestamptz not null default now());
create table public.fake_reports(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),product_id uuid references products(id),batch_no text,photo_path text,note text,created_at timestamptz not null default now());
create table public.orders(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),seller_id uuid not null references sellers(id),status text not null default 'placed' check(status in('placed','confirmed','shipped','ready','delivered','reviewed')),payment_method text not null check(payment_method in('cod','pickup','test_upi')),commission numeric not null default 0,created_at timestamptz not null default now());
create table public.order_items(id uuid primary key default gen_random_uuid(),order_id uuid not null references orders(id),listing_id uuid not null references seller_listings(id),quantity numeric not null check(quantity>0),unit_price numeric not null check(unit_price>0),created_at timestamptz not null default now());
create table public.reviews(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),order_id uuid not null references orders(id),effect text not null check(effect in('yes','partly','no')),voice_path text,created_at timestamptz not null default now());
create table public.irrigation_logs(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),field_id uuid not null references fields(id),water_mm numeric,run_minutes numeric,source text not null check(source in('advice','manual','iot')),created_at timestamptz not null default now());
create table public.iot_devices(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),field_id uuid not null references fields(id),type text not null check(type in('sensor','controller')),status text not null default 'offline',firmware text,last_seen timestamptz,created_at timestamptz not null default now());
create table public.sensor_readings(id uuid primary key default gen_random_uuid(),device_id uuid not null references iot_devices(id),moisture numeric not null check(moisture between 0 and 100),temperature numeric,humidity numeric check(humidity between 0 and 100),battery numeric,observed_at timestamptz not null,created_at timestamptz not null default now());
create index sensor_readings_device_time on sensor_readings(device_id,observed_at desc);
create table public.irrigation_commands(id uuid primary key default gen_random_uuid(),device_id uuid not null references iot_devices(id),farmer_id uuid not null references profiles(id),command text not null check(command in('ON','OFF')),issued_by text not null check(issued_by in('rule','manual')),expires_at timestamptz not null,ack_at timestamptz,result text,created_at timestamptz not null default now());
create table public.iot_packages(id uuid primary key default gen_random_uuid(),name text not null,sensors_per_acre integer not null,installation_fee numeric not null,monthly_fee numeric not null,created_at timestamptz not null default now());
create table public.iot_subscriptions(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),field_id uuid not null references fields(id),package_id uuid not null references iot_packages(id),status text not null default 'installation_pending',created_at timestamptz not null default now());
create table public.service_tickets(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),device_id uuid references iot_devices(id),description text not null,status text not null default 'open',created_at timestamptz not null default now());
create table public.technician_tasks(id uuid primary key default gen_random_uuid(),technician_id uuid not null references profiles(id),ticket_id uuid references service_tickets(id),subscription_id uuid references iot_subscriptions(id),status text not null default 'assigned',created_at timestamptz not null default now());
create table public.mandis(id uuid primary key default gen_random_uuid(),name text not null,location extensions.geography(point,4326),fee_per_quintal numeric not null default 0,created_at timestamptz not null default now());
create table public.mandi_prices(id uuid primary key default gen_random_uuid(),mandi_id uuid not null references mandis(id),crop_id text not null references crop_reference(id),price_date date not null,min_price numeric not null,modal_price numeric not null,max_price numeric not null,source text not null,fetched_at timestamptz not null default now(),created_at timestamptz not null default now(),unique(mandi_id,crop_id,price_date),check(min_price<=modal_price and modal_price<=max_price));
create table public.msp_reference(id uuid primary key default gen_random_uuid(),crop_id text not null references crop_reference(id),season text not null,price_per_quintal numeric not null,source text not null,effective_date date not null,created_at timestamptz not null default now());
create table public.buyer_demands(id uuid primary key default gen_random_uuid(),owner_id uuid not null references profiles(id),name text not null,crop_id text not null references crop_reference(id),quantity_quintals numeric not null check(quantity_quintals>0),price_per_quintal numeric not null check(price_per_quintal>0),grade text,pickup boolean not null default false,verified_status verification_status not null default 'pending',location extensions.geography(point,4326),available_date date,created_at timestamptz not null default now());
create table public.farmer_supplies(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),crop_id text not null references crop_reference(id),quantity_quintals numeric not null,minimum_price numeric not null,harvest_date date,photo_path text,created_at timestamptz not null default now());
create table public.offers(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),buyer_id uuid not null references profiles(id),demand_id uuid references buyer_demands(id),price numeric not null,quantity numeric not null,status text not null default 'pending',created_at timestamptz not null default now());
create table public.price_alerts(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),crop_id text not null references crop_reference(id),minimum_price numeric not null,quantity numeric not null,max_distance_km numeric,created_at timestamptz not null default now());
create table public.escrow_transactions(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),buyer_id uuid not null references profiles(id),offer_id uuid not null references offers(id),amount numeric not null,status text not null default 'simulated_pending',test_mode boolean not null default true check(test_mode),created_at timestamptz not null default now());
create table public.cold_storages(id uuid primary key default gen_random_uuid(),owner_id uuid not null references profiles(id),name text not null,location extensions.geography(point,4326),crops text[] not null,capacity_total numeric not null,capacity_available numeric not null,rate numeric not null,govt_rate numeric,rate_authority text,rate_source text,rate_effective_date date,verified_status verification_status not null default 'pending',created_at timestamptz not null default now(),check(capacity_available between 0 and capacity_total),check(govt_rate is null or(rate_authority is not null and rate_source is not null and rate_effective_date is not null)));
create table public.cold_storage_bookings(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),storage_id uuid not null references cold_storages(id),crop_id text not null references crop_reference(id),quantity numeric not null,start_date date not null,end_date date not null,status text not null default 'requested',created_at timestamptz not null default now(),check(end_date>=start_date));
create table public.vehicles(id uuid primary key default gen_random_uuid(),owner_id uuid not null references profiles(id),type text not null,capacity_kg numeric not null check(capacity_kg>0),covered boolean not null default false,rate_per_km numeric not null,minimum_fare numeric not null,vehicle_number text not null,location extensions.geography(point,4326),verified_status verification_status not null default 'pending',created_at timestamptz not null default now());
create table public.trips(id uuid primary key default gen_random_uuid(),vehicle_id uuid not null references vehicles(id),owner_id uuid not null references profiles(id),departure timestamptz not null,origin extensions.geography(point,4326),destination extensions.geography(point,4326),return_trip boolean not null default false,available_kg numeric not null,fare numeric not null,created_at timestamptz not null default now());
create table public.bookings(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),trip_id uuid not null references trips(id),weight_kg numeric not null,status text not null default 'requested',pickup_photo text,delivery_photo text,created_at timestamptz not null default now());
create table public.booking_participants(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),booking_id uuid not null references bookings(id),weight_kg numeric not null,accepted boolean not null default false,created_at timestamptz not null default now(),unique(farmer_id,booking_id));
create table public.trip_locations(id uuid primary key default gen_random_uuid(),trip_id uuid not null references trips(id),location extensions.geography(point,4326) not null,created_at timestamptz not null default now());
create table public.stubble_partners(id uuid primary key default gen_random_uuid(),owner_id uuid not null references profiles(id),name text not null,capacity_quintals numeric not null,accepted_crops text[] not null,location extensions.geography(point,4326),verified_status verification_status not null default 'pending',created_at timestamptz not null default now());
create table public.stubble_estimates(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),season_id uuid not null references seasons(id),quintals numeric not null,harvest_start date not null,harvest_end date not null,confidence numeric not null check(confidence between 0 and 1),created_at timestamptz not null default now());
create table public.stubble_pledges(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),field_id uuid not null references fields(id),crop_id text not null references crop_reference(id),expected_quintals numeric not null check(expected_quintals>0),harvest_date date not null,access_details text,status text not null default 'pledged',created_at timestamptz not null default now());
create table public.stubble_pickups(id uuid primary key default gen_random_uuid(),pledge_id uuid not null references stubble_pledges(id),partner_id uuid not null references stubble_partners(id),booking_id uuid references bookings(id),scheduled_at timestamptz,status text not null default 'scheduled',created_at timestamptz not null default now());
create table public.stubble_collections(id uuid primary key default gen_random_uuid(),pickup_id uuid not null references stubble_pickups(id),farmer_id uuid not null references profiles(id),crop_id text not null references crop_reference(id),weight_quintals numeric not null check(weight_quintals>0),photos text[] not null,location extensions.geography(point,4326),farmer_confirmed_at timestamptz,created_at timestamptz not null default now());
create table public.credit_scheme_rules(id uuid primary key default gen_random_uuid(),name text not null,version integer not null,rate_per_quintal numeric not null check(rate_per_quintal>0),cap_per_collection numeric not null check(cap_per_collection>0),eligible_crops text[] not null,valid_from date not null,valid_until date not null,active boolean not null default false,created_at timestamptz not null default now(),unique(name,version),check(valid_until>=valid_from));
create table public.credit_ledger(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),collection_id uuid unique references stubble_collections(id),scheme_id uuid references credit_scheme_rules(id),amount numeric not null,kind text not null check(kind in('credit','redemption')),request_id uuid not null unique,created_at timestamptz not null default now(),check((kind='credit' and amount>0 and collection_id is not null and scheme_id is not null) or(kind='redemption' and amount<0 and collection_id is null)));
create table public.credit_redemptions(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),ledger_id uuid not null unique references credit_ledger(id),seller_id uuid not null references sellers(id),voucher_hash text not null unique,created_at timestamptz not null default now());
create table public.land_listings(id uuid primary key default gen_random_uuid(),owner_id uuid not null references profiles(id),title text not null,location extensions.geography(point,4326),area_acres numeric not null check(area_acres>0),rent_per_acre numeric not null check(rent_per_acre>0),season text not null,soil text,water_source text,photos text[],ownership_document_path text,verified_status verification_status not null default 'pending',created_at timestamptz not null default now());
create table public.land_interests(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),listing_id uuid not null references land_listings(id),status text not null default 'requested',created_at timestamptz not null default now(),unique(farmer_id,listing_id));
create table public.land_reviews(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),listing_id uuid not null references land_listings(id),rating integer not null check(rating between 1 and 5),note text,created_at timestamptz not null default now());
create table public.translations(text_hash text not null,lang text not null,text text not null,needs_review boolean not null default true,created_at timestamptz not null default now(),primary key(text_hash,lang));
create table public.disputes(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),module text not null,record_id uuid not null,description text not null,status text not null default 'open',created_at timestamptz not null default now());
create table public.notifications(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),message_en text not null,read_at timestamptz,created_at timestamptz not null default now());

-- Deny by default, then explicit policies per surface. All tables have RLS.
do $$declare r record;begin
 for r in select tablename from pg_tables where schemaname='public' loop
 execute format('alter table public.%I enable row level security',r.tablename);
 execute format('create policy admin_manage on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',r.tablename);
 end loop;
end$$;
create policy profile_self_read on profiles for select to authenticated using(id=auth.uid());
create policy profile_self_update on profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
-- Remove broad client UPDATE permission to prevent role/verification escalation.
revoke update on profiles from anon,authenticated;
grant update(name,language,village,location,benchmark_opt_in) on profiles to authenticated;
do $$declare name text;begin
 foreach name in array array['fields','seasons','diary_entries','diagnoses','fake_reports','orders','reviews','irrigation_logs','iot_subscriptions','service_tickets','farmer_supplies','offers','price_alerts','cold_storage_bookings','bookings','booking_participants','stubble_estimates','stubble_pledges','land_interests','land_reviews','disputes','notifications'] loop
 execute format('create policy own_records on public.%I for all to authenticated using (farmer_id=auth.uid()) with check (farmer_id=auth.uid())',name);
 end loop;
 foreach name in array array['crop_reference','diseases','treatments','products','verified_batches','mandis','mandi_prices','msp_reference','iot_packages','credit_scheme_rules','translations'] loop
 execute format('create policy reference_read on public.%I for select to authenticated using (true)',name);
 end loop;
 foreach name in array array['sellers','buyer_demands','cold_storages','vehicles','stubble_partners','land_listings'] loop
 execute format('create policy verified_read on public.%I for select to authenticated using (verified_status=''approved'' or owner_id=auth.uid())',name);
 execute format('create policy owner_insert on public.%I for insert to authenticated with check (owner_id=auth.uid() and verified_status=''pending'')',name);
 execute format('create policy owner_update on public.%I for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid())',name);
 execute format('create trigger protect_verification before update on public.%I for each row execute function public.protect_verification()',name);
 end loop;
end$$;
create policy visible_seller_listing on seller_listings for select to authenticated using(exists(select 1 from sellers s where s.id=seller_id and s.verified_status='approved'));
create policy own_order_items on order_items for select to authenticated using(exists(select 1 from orders o where o.id=order_id and o.farmer_id=auth.uid()));
create policy own_devices on iot_devices for select to authenticated using(farmer_id=auth.uid());
create policy own_readings on sensor_readings for select to authenticated using(exists(select 1 from iot_devices d where d.id=device_id and d.farmer_id=auth.uid()));
create policy own_commands on irrigation_commands for select to authenticated using(farmer_id=auth.uid());
create policy own_ledger on credit_ledger for select to authenticated using(farmer_id=auth.uid());
create policy own_redemptions on credit_redemptions for select to authenticated using(farmer_id=auth.uid());
create policy own_collections on stubble_collections for select to authenticated using(farmer_id=auth.uid());
create policy assigned_tasks on technician_tasks for select to authenticated using(technician_id=auth.uid());
create policy verified_trips on trips for select to authenticated using(exists(select 1 from vehicles v where v.id=vehicle_id and v.verified_status='approved'));
create policy own_escrow on escrow_transactions for select to authenticated using(farmer_id=auth.uid() or buyer_id=auth.uid());
-- Trips' precise tracking locations, documents and pickups remain server-only until participant policies are added.
revoke insert,update,delete on credit_ledger,credit_redemptions,credit_scheme_rules,irrigation_commands,sensor_readings,stubble_collections,escrow_transactions from anon,authenticated;
create function public.immutable_ledger() returns trigger language plpgsql as $$begin raise exception 'Credit ledger is append-only';end$$;
create trigger ledger_append_only before update or delete on credit_ledger for each row execute function public.immutable_ledger();
create trigger scheme_versions_immutable before update or delete on credit_scheme_rules for each row execute function public.immutable_ledger();

create function public.confirm_collection(collection uuid,request uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare c stubble_collections; s credit_scheme_rules;result uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 select * into c from stubble_collections where id=collection and farmer_id=auth.uid() for update;
 if c.id is null then raise exception 'Collection not found';end if;
 if not exists(select 1 from stubble_pickups p join stubble_pledges pledge on pledge.id=p.pledge_id join stubble_partners partner on partner.id=p.partner_id where p.id=c.pickup_id and pledge.farmer_id=c.farmer_id and pledge.crop_id=c.crop_id and partner.verified_status='approved') then raise exception 'Verified eligible collection partner required';end if;
 select id into result from credit_ledger where collection_id=c.id;
 if result is not null then return result;end if;
 select * into s from credit_scheme_rules where active and current_date between valid_from and valid_until and c.crop_id=any(eligible_crops) order by version desc limit 1;
 if s.id is null then raise exception 'No active eligible scheme';end if;
 update stubble_collections set farmer_confirmed_at=now() where id=c.id;
 insert into credit_ledger(farmer_id,collection_id,scheme_id,amount,kind,request_id) values(c.farmer_id,c.id,s.id,least(c.weight_quintals*s.rate_per_quintal,s.cap_per_collection),'credit',request) returning id into result;
 return result;
end$$;
create function public.redeem_credits(amount_requested numeric,seller uuid,request uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare total numeric;result uuid;
begin
 if auth.uid() is null or amount_requested<=0 then raise exception 'Invalid redemption';end if;
 perform 1 from profiles where id=auth.uid() for update; -- serialises simultaneous wallet spends
 select id into result from credit_ledger where request_id=request and farmer_id=auth.uid();
 if result is not null then return result;end if;
 if not exists(select 1 from sellers where id=seller and verified_status='approved') then raise exception 'Verified seller required';end if;
 select coalesce(sum(amount),0) into total from credit_ledger where farmer_id=auth.uid();
 if total<amount_requested then raise exception 'Insufficient credit';end if;
 insert into credit_ledger(farmer_id,amount,kind,request_id) values(auth.uid(),-amount_requested,'redemption',request) returning id into result;
 insert into credit_redemptions(farmer_id,ledger_id,seller_id,voucher_hash) values(auth.uid(),result,seller,encode(extensions.digest(request::text,'sha256'),'hex'));
 return result;
end$$;
create function public.nearby_benchmark(crop text,requested_season text) returns jsonb language plpgsql stable security definer set search_path=public,extensions as $$
declare me profiles;radius integer;n integer;answer jsonb;
begin
 select * into me from profiles where id=auth.uid();if not coalesce(me.benchmark_opt_in,false) or me.location is null then return null;end if;
 foreach radius in array array[5000,10000,25000] loop
 select count(distinct s.farmer_id) into n from seasons s join profiles p on p.id=s.farmer_id where s.crop_id=crop and s.season=requested_season and s.farmer_id<>me.id and p.benchmark_opt_in and s.yield_per_acre is not null and st_dwithin(me.location,p.location,radius);
 exit when n>=10;end loop;
 if n<5 then return null;end if;
 -- First reduce to one row per farmer. Repeated field records cannot inflate peer counts.
 with peers as (select s.farmer_id,avg(s.yield_per_acre) as y,avg(s.sowing_offset_days) as sowing,avg(s.fertiliser_splits) as splits from seasons s join profiles p on p.id=s.farmer_id where s.crop_id=crop and s.season=requested_season and s.farmer_id<>me.id and p.benchmark_opt_in and s.yield_per_acre is not null and st_dwithin(me.location,p.location,radius) group by s.farmer_id), ranked as(select *,ntile(4) over(order by y desc) as quartile from peers)
 select jsonb_build_object('count',n,'radius_km',radius/1000,'median_yield',percentile_cont(.5) within group(order by y),'top_yield',avg(y) filter(where quartile=1),'top_sowing_offset',avg(sowing) filter(where quartile=1),'top_fertiliser_splits',avg(splits) filter(where quartile=1),'notice','Anonymous associations, not guarantees') into answer from ranked;
 return answer;
end$$;
revoke all on function confirm_collection(uuid,uuid),redeem_credits(numeric,uuid,uuid),nearby_benchmark(text,text) from public,anon;
grant execute on function confirm_collection(uuid,uuid),redeem_credits(numeric,uuid,uuid),nearby_benchmark(text,text) to authenticated;
insert into storage.buckets(id,name,public) values('farm-private','farm-private',false) on conflict do nothing;
create policy own_private_upload on storage.objects for insert to authenticated with check(bucket_id='farm-private' and (storage.foldername(name))[1]=auth.uid()::text);
create policy own_private_read on storage.objects for select to authenticated using(bucket_id='farm-private' and (storage.foldername(name))[1]=auth.uid()::text);
