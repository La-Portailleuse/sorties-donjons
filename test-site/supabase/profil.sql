alter table public.profiles
  add column if not exists niveau integer not null default 1
    check (niveau between 1 and 200),
  add column if not exists pseudo_discord text,
  add column if not exists classe_image integer not null default 1
    check (classe_image between 1 and 19);