-- Run against the local seeded database as postgres. Entire transaction is rolled back.
begin;
do $$begin
 if exists(select 1 from pg_tables where schemaname='public' and not rowsecurity) then raise exception 'Missing RLS';end if;
 if (select count(*) from profiles where role='farmer')<>40 then raise exception 'Expected 40 demo farmers';end if;
 if (select count(*) from crop_reference)<>10 then raise exception 'Expected 10 crops';end if;
 if (select count(*) from diseases)<>30 then raise exception 'Expected 30 diseases';end if;
 if (select count(*) from products)<>25 then raise exception 'Expected 25 products';end if;
 begin update credit_ledger set amount=amount+1;raise exception 'Ledger was editable';exception when raise_exception then if sqlerrm='Ledger was editable' then raise;end if;end;
end$$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$begin
 if exists(select 1 from fields where farmer_id<>auth.uid()) then raise exception 'Other farmer field exposed';end if;
 if exists(select 1 from seasons where farmer_id<>auth.uid()) then raise exception 'Peer records exposed';end if;
 if exists(select 1 from sellers where verified_status<>'approved' and owner_id<>auth.uid()) then raise exception 'Unverified seller exposed';end if;
 if (select nearby_benchmark('wheat','rabi-2025')) is null then raise exception 'Benchmark absent';end if;
 begin update profiles set role='admin' where id=auth.uid();raise exception 'Privilege escalation succeeded';exception when insufficient_privilege then null;end;
end$$;
rollback;
