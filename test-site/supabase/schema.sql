create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pseudo text not null check (char_length(trim(pseudo)) between 3 and 30),
  created_at timestamptz not null default now()
);

create unique index profiles_pseudo_unique
on public.profiles (lower(trim(pseudo)));

alter table public.profiles enable row level security;

create policy "Chaque utilisateur peut lire son profil"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Chaque utilisateur peut créer son profil"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Chaque utilisateur peut modifier son profil"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.creer_profil_utilisateur()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, pseudo)
  values (new.id, new.raw_user_meta_data ->> 'pseudo');
  return new;
end;
$$;

create trigger apres_creation_utilisateur
  after insert on auth.users
  for each row execute procedure public.creer_profil_utilisateur();
