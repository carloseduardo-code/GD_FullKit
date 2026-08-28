-- CATÁLOGO DE FULL KITs — cria as tabelas do catálogo e já o enche com os FULL KITs
-- que hoje existem soltos dentro das obras.
--
-- Rode este arquivo inteiro de uma vez no SQL Editor do Supabase (New query → colar → Run).
-- Pode rodar mais de uma vez: nada é duplicado.
--
-- O que ele faz:
--   1. cria as tabelas full_kits e full_kit_perguntas (e a coluna servicos.full_kit_id);
--   2. varre os serviços das obras e transforma cada checklist já montado em um item
--      do catálogo — quando o mesmo serviço existe em várias obras, entra o checklist
--      mais completo;
--   3. mostra no fim o catálogo que ficou.
--
-- Nada nas obras é alterado: os checklists que já existem continuam exatamente como estão.

-- ---------- 1. Tabelas ----------

create extension if not exists pgcrypto;

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

alter table servicos add column if not exists full_kit_id uuid references full_kits (id) on delete set null;

create index if not exists idx_full_kit_perguntas_full_kit_id on full_kit_perguntas (full_kit_id);
create index if not exists idx_servicos_full_kit_id on servicos (full_kit_id);

alter table full_kits enable row level security;
alter table full_kit_perguntas enable row level security;

-- create policy não aceita "if not exists", então só cria o que ainda falta.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'full_kits' and policyname = 'temp_allow_all_full_kits') then
    create policy "temp_allow_all_full_kits" on full_kits for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'full_kit_perguntas' and policyname = 'temp_allow_all_full_kit_perguntas') then
    create policy "temp_allow_all_full_kit_perguntas" on full_kit_perguntas for all using (true) with check (true);
  end if;
end $$;

-- ---------- 2. Encher o catálogo com o que já existe ----------

-- Compara nomes ignorando caixa, acento, espaço repetido e ³/², para "Concreto Magro (m³)"
-- e "concreto magro (m3)" não virarem dois itens diferentes no catálogo.
create or replace function public.fk_normalizar_nome(p_nome text)
returns text
language sql
immutable
as $fn$
  select btrim(
           regexp_replace(
             translate(
               lower(coalesce(p_nome, '')),
               'áàâãäéèêëíìîïóòôõöúùûüçñ³²',
               'aaaaaeeeeiiiiooooouuuucn32'
             ),
             '\s+', ' ', 'g'
           )
         );
$fn$;

with candidatos as (
  select sv.id,
         sv.nome,
         sv.created_at,
         public.fk_normalizar_nome(sv.nome) as chave,
         count(p.id)::integer               as qtd
    from servicos sv
    join perguntas p on p.servico_id = sv.id
   group by sv.id, sv.nome, sv.created_at
),
-- Mesmo nome em várias obras: fica o checklist mais completo; empatou, o mais recente.
melhor as (
  select distinct on (chave) *
    from candidatos
   order by chave, qtd desc, created_at desc, id
),
-- Não recria o que o catálogo já tem — é isso que deixa o script repetível.
novos as (
  select m.*
    from melhor m
   where not exists (
     select 1 from full_kits fk
      where public.fk_normalizar_nome(fk.nome) = m.chave
   )
),
kits as (
  insert into full_kits (nome, descricao)
  select n.nome, '' from novos n
  returning id, nome
)
insert into full_kit_perguntas (full_kit_id, texto, tipo, obrigatoria, ordem)
select k.id, p.texto, p.tipo, p.obrigatoria, p.ordem
  from kits k
  join novos n on n.nome = k.nome
  join perguntas p on p.servico_id = n.id;

-- ---------- 3. Conferência ----------

select fk.nome                as full_kit_do_catalogo,
       count(fkp.id)          as perguntas
  from full_kits fk
  left join full_kit_perguntas fkp on fkp.full_kit_id = fk.id
 group by fk.id, fk.nome
 order by fk.nome;
