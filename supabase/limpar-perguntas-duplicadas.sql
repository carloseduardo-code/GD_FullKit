-- LIMPAR PERGUNTAS DUPLICADAS
--
-- Rode este arquivo inteiro de uma vez no SQL Editor do Supabase (New query → colar → Run).
-- Pode rodar mais de uma vez: na segunda vez não encontra nada para remover.
--
-- De onde vieram as duplicatas: o app carregava no máximo 1000 perguntas por vez, então
-- serviços que já tinham checklist apareciam vazios na tela e o botão de preencher
-- copiava por cima. Cada tentativa deixou mais uma cópia. O catálogo, que foi montado a
-- partir do checklist "mais completo" de cada serviço, herdou as cópias.
--
-- O que este script faz, dentro de cada serviço e de cada FULL KIT do catálogo:
--   * considera duplicada a pergunta com mesmo texto, mesmo tipo e mesma obrigatoriedade;
--   * mantém a primeira (a mais antiga) e remove as repetições;
--   * antes de remover, guarda tudo em perguntas_removidas_backup, para dar para voltar atrás;
--   * aponta os apontamentos já respondidos para a pergunta que ficou, para não perder histórico;
--   * renumera a ordem das perguntas que sobraram (1, 2, 3...).

-- ---------- Backup do que for removido ----------

create table if not exists perguntas_removidas_backup (
  id uuid,
  origem text,
  dono_id uuid,
  texto text,
  tipo text,
  obrigatoria boolean,
  ordem integer,
  removido_em timestamptz not null default now()
);

-- ---------- 1. Perguntas dos serviços das obras ----------

drop table if exists tmp_mapa_perguntas;
create table tmp_mapa_perguntas as
with ranked as (
  select p.id,
         p.servico_id,
         p.texto,
         p.tipo,
         p.obrigatoria,
         p.ordem,
         row_number() over w  as posicao,
         first_value(p.id) over w as id_mantido
    from perguntas p
  window w as (
    partition by p.servico_id, btrim(lower(p.texto)), p.tipo, p.obrigatoria
    order by p.created_at, p.id
  )
)
select id as id_removido, id_mantido, servico_id, texto, tipo, obrigatoria, ordem
  from ranked
 where posicao > 1;

insert into perguntas_removidas_backup (id, origem, dono_id, texto, tipo, obrigatoria, ordem)
select id_removido, 'servico', servico_id, texto, tipo, obrigatoria, ordem from tmp_mapa_perguntas;

-- Respostas já dadas a uma cópia passam a apontar para a pergunta que ficou.
update apontamentos a
   set respostas = (
     select jsonb_agg(
              case
                when m.id_mantido is not null
                  then jsonb_set(item, '{perguntaId}', to_jsonb(m.id_mantido::text))
                else item
              end
            )
       from jsonb_array_elements(a.respostas) as item
       left join tmp_mapa_perguntas m on m.id_removido::text = item ->> 'perguntaId'
   )
 where exists (
   select 1
     from jsonb_array_elements(a.respostas) as item
     join tmp_mapa_perguntas m on m.id_removido::text = item ->> 'perguntaId'
 );

delete from perguntas p using tmp_mapa_perguntas m where p.id = m.id_removido;

-- ---------- 2. Perguntas dos FULL KITs do catálogo ----------

drop table if exists tmp_mapa_modelo;
create table tmp_mapa_modelo as
with ranked as (
  select p.id,
         p.full_kit_id,
         p.texto,
         p.tipo,
         p.obrigatoria,
         p.ordem,
         row_number() over (
           partition by p.full_kit_id, btrim(lower(p.texto)), p.tipo, p.obrigatoria
           order by p.created_at, p.id
         ) as posicao
    from full_kit_perguntas p
)
select id as id_removido, full_kit_id, texto, tipo, obrigatoria, ordem
  from ranked
 where posicao > 1;

insert into perguntas_removidas_backup (id, origem, dono_id, texto, tipo, obrigatoria, ordem)
select id_removido, 'catalogo', full_kit_id, texto, tipo, obrigatoria, ordem from tmp_mapa_modelo;

delete from full_kit_perguntas p using tmp_mapa_modelo m where p.id = m.id_removido;

-- ---------- 3. Renumerar a ordem do que sobrou ----------

with nova_ordem as (
  select id, row_number() over (partition by servico_id order by ordem, created_at, id) as nova
    from perguntas
)
update perguntas p
   set ordem = n.nova
  from nova_ordem n
 where n.id = p.id and p.ordem <> n.nova;

with nova_ordem as (
  select id, row_number() over (partition by full_kit_id order by ordem, created_at, id) as nova
    from full_kit_perguntas
)
update full_kit_perguntas p
   set ordem = n.nova
  from nova_ordem n
 where n.id = p.id and p.ordem <> n.nova;

-- ---------- 4. Resultado desta execução ----------

drop table if exists tmp_resumo;
create table tmp_resumo as
select 'perguntas duplicadas removidas dos serviços' as o_que,
       (select count(*) from tmp_mapa_perguntas)     as quantidade
union all
select 'perguntas duplicadas removidas do catálogo',
       (select count(*) from tmp_mapa_modelo);

drop table tmp_mapa_perguntas;
drop table tmp_mapa_modelo;

select * from tmp_resumo;
