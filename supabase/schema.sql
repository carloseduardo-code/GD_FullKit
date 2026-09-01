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

-- Catálogo de FULL KITs: modelos de checklist cadastrados uma vez e reaproveitados
-- na hora de montar o fluxo de qualquer obra.
create table if not exists full_kits (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists full_kit_perguntas (
  id uuid primary key default gen_random_uuid(),
  full_kit_id uuid not null references full_kits (id) on delete cascade,
  texto text not null,
  tipo text not null check (tipo in ('boolean', 'texto', 'numero', 'foto')),
  obrigatoria boolean not null default true,
  ordem integer not null,
  created_at timestamptz not null default now()
);

-- Guarda de qual modelo o serviço nasceu (informativo). Como o modelo é copiado
-- e não vinculado, apagar o modelo não altera o checklist já montado na obra.
alter table servicos add column if not exists full_kit_id uuid references full_kits (id) on delete set null;

create table if not exists apontamentos (
  id uuid primary key default gen_random_uuid(),
  servico_id uuid not null references servicos (id) on delete cascade,
  respostas jsonb not null default '[]',
  fotos text[] not null default '{}',
  observacoes text not null default '',
  autor text not null,
  criado_em timestamptz not null default now()
);

-- Regra de integridade: concluir um serviço exige que o último apontamento
-- atenda todas as perguntas obrigatórias do Full Kit. A validação também fica
-- no banco para impedir gravações inválidas fora da interface web.
create or replace function public.full_kit_pendencias_servico(p_servico_id uuid)
returns text[]
language sql
stable
security invoker
set search_path = public
as $$
  with ultimo_apontamento as (
    select a.id, a.respostas, a.fotos
    from public.apontamentos a
    where a.servico_id = p_servico_id
    order by a.criado_em desc, a.id desc
    limit 1
  )
  select coalesce(array_agg(p.texto order by p.ordem, p.id), '{}'::text[])
  from public.perguntas p
  left join ultimo_apontamento u on true
  where p.servico_id = p_servico_id
    and p.obrigatoria
    and (
      u.id is null
      or case p.tipo
        when 'foto' then coalesce(cardinality(u.fotos), 0) = 0
        when 'boolean' then not exists (
          select 1
          from jsonb_array_elements(
            case when jsonb_typeof(u.respostas) = 'array' then u.respostas else '[]'::jsonb end
          ) r
          where r ->> 'perguntaId' = p.id::text
            and r ->> 'valor' in ('sim', 'nao_aplica')
        )
        when 'texto' then not exists (
          select 1
          from jsonb_array_elements(
            case when jsonb_typeof(u.respostas) = 'array' then u.respostas else '[]'::jsonb end
          ) r
          where r ->> 'perguntaId' = p.id::text
            and jsonb_typeof(r -> 'valor') = 'string'
            and btrim(r ->> 'valor') <> ''
        )
        when 'numero' then not exists (
          select 1
          from jsonb_array_elements(
            case when jsonb_typeof(u.respostas) = 'array' then u.respostas else '[]'::jsonb end
          ) r
          where r ->> 'perguntaId' = p.id::text
            and jsonb_typeof(r -> 'valor') = 'number'
        )
        else true
      end
    );
$$;

create or replace function public.validar_conclusao_servico()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pendencias text[];
begin
  if new.concluido_em is not null and old.concluido_em is null then
    v_pendencias := public.full_kit_pendencias_servico(new.id);

    if cardinality(v_pendencias) > 0 then
      raise exception using
        errcode = '23514',
        message = 'O serviço não pode ser concluído enquanto houver pendências no Full Kit.',
        detail = array_to_string(v_pendencias, ' | ');
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validar_conclusao_servico on public.servicos;
create trigger trg_validar_conclusao_servico
before update of concluido_em on public.servicos
for each row
execute function public.validar_conclusao_servico();

create index if not exists idx_etapas_obra_id on etapas (obra_id);
create index if not exists idx_etapas_etapa_pai_id on etapas (etapa_pai_id);
create index if not exists idx_servicos_etapa_id on servicos (etapa_id);
create index if not exists idx_perguntas_servico_id on perguntas (servico_id);
create index if not exists idx_apontamentos_servico_id on apontamentos (servico_id);
create index if not exists idx_apontamentos_servico_criado
  on apontamentos (servico_id, criado_em desc, id desc);
create index if not exists idx_full_kit_perguntas_full_kit_id on full_kit_perguntas (full_kit_id);
create index if not exists idx_servicos_full_kit_id on servicos (full_kit_id);

-- RLS: ligado em todas as tabelas, mas com política permissiva TEMPORÁRIA.
-- A Fase 2 (login + papéis GOD/Administrador/Apontador) troca isso por
-- políticas de verdade baseadas em quem está autenticado e em qual papel.
alter table obras enable row level security;
alter table etapas enable row level security;
alter table servicos enable row level security;
alter table perguntas enable row level security;
alter table apontamentos enable row level security;
alter table full_kits enable row level security;
alter table full_kit_perguntas enable row level security;

create policy "temp_allow_all_obras" on obras for all using (true) with check (true);
create policy "temp_allow_all_etapas" on etapas for all using (true) with check (true);
create policy "temp_allow_all_servicos" on servicos for all using (true) with check (true);
create policy "temp_allow_all_perguntas" on perguntas for all using (true) with check (true);
create policy "temp_allow_all_apontamentos" on apontamentos for all using (true) with check (true);
create policy "temp_allow_all_full_kits" on full_kits for all using (true) with check (true);
create policy "temp_allow_all_full_kit_perguntas" on full_kit_perguntas for all using (true) with check (true);

