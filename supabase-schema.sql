-- ─────────────────────────────────────────────
--  OPEN CLASE · Supabase Schema
--  Pega esto en el SQL Editor de Supabase
-- ─────────────────────────────────────────────

-- Estado global del torneo (fase, config)
create table if not exists tournament (
  id        text primary key default 'main',
  phase     text not null default 'registro',  -- registro | sorteo | torneo
  revealed_rounds integer[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Jugadores inscritos
create table if not exists players (
  id         text primary key,
  name       text not null,
  nickname   text,                    -- mote opcional para las risas
  created_at timestamptz default now()
);

-- Partidos generados tras el sorteo
create table if not exists matches (
  id       integer primary key,
  round    integer not null,
  p1       text references players(id) on delete cascade,
  p2       text references players(id) on delete cascade,
  s1       integer,
  s2       integer,
  winner   text references players(id),
  updated_at timestamptz default now()
);

-- Insertar fila de torneo por defecto
insert into tournament (id, phase) values ('main', 'registro')
on conflict (id) do nothing;

-- ── Realtime ──────────────────────────────────
-- Habilita realtime en las tres tablas
alter publication supabase_realtime add table tournament;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table matches;

-- ── RLS (Row Level Security) ──────────────────
-- Lectura pública para todos
alter table tournament enable row level security;
alter table players    enable row level security;
alter table matches    enable row level security;

create policy "public read tournament" on tournament for select using (true);
create policy "public read players"    on players    for select using (true);
create policy "public read matches"    on matches    for select using (true);

-- Escritura pública (el admin lo controla la app con contraseña)
create policy "public write tournament" on tournament for all using (true) with check (true);
create policy "public write players"    on players    for all using (true) with check (true);
create policy "public write matches"    on matches    for all using (true) with check (true);
