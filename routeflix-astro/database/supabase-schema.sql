create table if not exists destinations (
  id          bigserial primary key,
  title       text not null,
  category    text not null check (category in ('Destinos Populares', 'Aventuras', 'Escapadas')),
  image       text,
  link        text,
  rating      numeric(3,1) check (rating >= 0 and rating <= 5),
  reviews     integer default 0,
  price       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

alter table destinations enable row level security;

create policy "destinations_public_read"
  on destinations for select
  using (true);

create policy "destinations_auth_insert"
  on destinations for insert
  with check (auth.role() = 'authenticated');

create policy "destinations_owner_update"
  on destinations for update
  using (auth.uid() = created_by);

create policy "destinations_owner_delete"
  on destinations for delete
  using (auth.uid() = created_by);


create table if not exists user_trips (
  id           bigserial primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  destinations jsonb not null default '[]',
  start_date   date,
  end_date     date,
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table user_trips enable row level security;

create policy "trips_owner_all"
  on user_trips for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
