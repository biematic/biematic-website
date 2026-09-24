-- Biematic acquisitie-tracking: click_events
-- Voer dit één keer uit in de Supabase SQL editor (Dashboard -> SQL Editor -> New query -> Run).

create table if not exists click_events (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  event_type text not null check (event_type in ('broker', 'metacopier')),
  broker text,
  page text,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists click_events_visitor_id_idx on click_events (visitor_id);
create index if not exists click_events_event_type_idx on click_events (event_type);
create index if not exists click_events_created_at_idx on click_events (created_at);

-- Row Level Security aan: standaard mag niemand rechtstreeks vanuit de browser
-- lezen of schrijven. Alle toegang loopt via de Netlify Functions, die de
-- service role key gebruiken (die negeert RLS sowieso, maar dit is de
-- veilige default mocht de anon key ooit per ongeluk gebruikt worden).
alter table click_events enable row level security;
