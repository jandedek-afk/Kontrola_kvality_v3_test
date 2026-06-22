-- ============================================================
--  Kontrola kvality v3 – nastavení Supabase
--  Spusťte celé v Supabase: SQL Editor → New query → vložit → Run
-- ============================================================

-- 1) Tabulka záznamů -----------------------------------------
create table if not exists public.entries (
  id          text primary key,          -- ID z aplikace (Date.now())
  time        bigint not null,            -- časové razítko (ms)
  time_text   text,                       -- čas zobrazený uživateli
  coords      jsonb,                      -- {lat, lon} nebo null
  long_note   text,                       -- podélné měření
  cross_note  text,                       -- příčné měření
  note        text,                       -- poznámka
  folder      text,                       -- složka
  photo_path  text,                       -- cesta k fotce v úložišti (např. "169...jpg")
  owner       uuid references auth.users(id),
  created_at  timestamptz default now()
);

-- 2) Zabezpečení tabulky (RLS) -------------------------------
-- Sdílený týmový nástroj: každý PŘIHLÁŠENÝ uživatel vidí a spravuje vše.
-- Nepřihlášený se nedostane k ničemu.
alter table public.entries enable row level security;

drop policy if exists "entries_select" on public.entries;
drop policy if exists "entries_insert" on public.entries;
drop policy if exists "entries_update" on public.entries;
drop policy if exists "entries_delete" on public.entries;

create policy "entries_select" on public.entries for select to authenticated using (true);
create policy "entries_insert" on public.entries for insert to authenticated with check (true);
create policy "entries_update" on public.entries for update to authenticated using (true) with check (true);
create policy "entries_delete" on public.entries for delete to authenticated using (true);

-- 3) Úložiště fotek ------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "photos_select" on storage.objects;
drop policy if exists "photos_insert" on storage.objects;
drop policy if exists "photos_update" on storage.objects;
drop policy if exists "photos_delete" on storage.objects;

create policy "photos_select" on storage.objects for select to authenticated using (bucket_id = 'photos');
create policy "photos_insert" on storage.objects for insert to authenticated with check (bucket_id = 'photos');
create policy "photos_update" on storage.objects for update to authenticated using (bucket_id = 'photos') with check (bucket_id = 'photos');
create policy "photos_delete" on storage.objects for delete to authenticated using (bucket_id = 'photos');
