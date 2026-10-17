create table public.whatsapp_inbound_jobs(id uuid primary key default gen_random_uuid(),farmer_id uuid not null references profiles(id),message_id text not null unique,type text not null check(type in('text','image','audio')),text text,media_id text,status text not null default 'queued' check(status in('queued','processing','done','failed')),created_at timestamptz not null default now());
alter table public.whatsapp_inbound_jobs enable row level security;
-- Server workers only. Media IDs and private transcripts never become public data.
revoke all on whatsapp_inbound_jobs from anon,authenticated;
create policy inbound_admin on whatsapp_inbound_jobs for select to authenticated using(public.is_admin());
