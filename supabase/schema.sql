-- FULL KIT — schema inicial (Fase 1: banco real, sem login ainda)
-- Rode este arquivo inteiro no SQL Editor do painel do Supabase (Project > SQL Editor > New query).

create extension if not exists pgcrypto;

create table if not exists obras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  endereco text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists etapas (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras (id) on delete cascade,
  etapa_pai_id uuid references etapas (id) on delete cascade,
  nome text not null,
  ordem integer not null,
  predecessoras_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists servicos (
  id uuid primary key default gen_random_uuid(),
  etapa_id uuid not null references etapas (id) on delete cascade,
  nome text not null,
  ordem integer not null,
  data_inicio_prevista date,
  data_fim_prevista date,
  concluido_em timestamptz,
  created_at timestamptz not null default now()
);

-- Migração: se a tabela servicos já existia sem a coluna (schema rodado antes da Fase 1.1,
-- status "Concluída"), adiciona a coluna sem perder dados.
alter table servicos add column if not exists concluido_em timestamptz;

create table if not exists perguntas (
  id uuid primary key default gen_random_uuid(),
  servico_id uuid not null references servicos (id) on delete cascade,
  texto text not null,
  tipo text not null check (tipo in ('boolean', 'texto', 'numero', 'foto')),
  obrigatoria boolean not null default true,
  ordem integer not null,
  created_at timestamptz not null default now()
);

create table if not exists apontamentos (
  id uuid primary key default gen_random_uuid(),
  servico_id uuid not null references servicos (id) on delete cascade,
  respostas jsonb not null default '[]',
  fotos text[] not null default '{}',
  observacoes text not null default '',
  autor text not null,
  criado_em timestamptz not null default now()
);

create index if not exists idx_etapas_obra_id on etapas (obra_id);
create index if not exists idx_etapas_etapa_pai_id on etapas (etapa_pai_id);
create index if not exists idx_servicos_etapa_id on servicos (etapa_id);
create index if not exists idx_perguntas_servico_id on perguntas (servico_id);
create index if not exists idx_apontamentos_servico_id on apontamentos (servico_id);

-- RLS: ligado em todas as tabelas, mas com política permissiva TEMPORÁRIA.
-- A Fase 2 (login + papéis GOD/Administrador/Apontador) troca isso por
-- políticas de verdade baseadas em quem está autenticado e em qual papel.
alter table obras enable row level security;
alter table etapas enable row level security;
alter table servicos enable row level security;
alter table perguntas enable row level security;
alter table apontamentos enable row level security;

create policy "temp_allow_all_obras" on obras for all using (true) with check (true);
create policy "temp_allow_all_etapas" on etapas for all using (true) with check (true);
create policy "temp_allow_all_servicos" on servicos for all using (true) with check (true);
create policy "temp_allow_all_perguntas" on perguntas for all using (true) with check (true);
create policy "temp_allow_all_apontamentos" on apontamentos for all using (true) with check (true);
