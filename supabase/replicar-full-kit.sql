-- REPLICAR FULL KIT — copia as perguntas de serviços notáveis já configurados
-- para os serviços de mesmo nome de uma obra nova (que já tem o fluxo montado).
--
-- Caso de uso que originou o script: AS_027_TR-2012KS-11 (EXTERNA) e (INTERNA),
-- criadas com o fluxo executivo pronto mas com os FULL KITs vazios.
--
-- Como usar (SQL Editor do Supabase, um bloco por vez):
--   BLOCO 0  confira o nome exato das obras
--   BLOCO 1  crie as funções auxiliares (rode uma vez; pode rodar de novo sem problema)
--   BLOCO 2  PRÉVIA — mostra o que seria copiado, sem gravar nada
--   BLOCO 3  o que não achou modelo + catálogo de nomes disponíveis
--   BLOCO 4  APLICA (só depois de conferir a prévia)
--   BLOCO 5  conferência final
--   BLOCO 6  (opcional) remove as funções auxiliares
--
-- Regras da cópia:
--   * casa serviço com serviço pelo NOME, ignorando maiúsculas, acentos, espaços
--     repetidos e ³/² (então "Concreto Magro (m³)" casa com "concreto magro (m3)");
--   * só preenche serviço VAZIO — serviço que já tem qualquer pergunta fica intacto;
--   * copia texto, tipo, obrigatoriedade e ordem das perguntas do modelo;
--   * nunca lê modelo de dentro das próprias obras alvo;
--   * é idempotente: rodar o BLOCO 4 duas vezes não duplica nada (na segunda vez
--     os serviços já preenchidos aparecem como "ja_preenchido").
--
-- Atenção ao padrão das obras: ele é ILIKE, então "%" vale por qualquer trecho e
-- "_" vale por um caractere qualquer (o "_" de AS_027 casa com o underline literal,
-- mas também casaria com "AS-027"). A primeira consulta do BLOCO 2 mostra exatamente
-- quais obras o padrão pegou — confira antes de aplicar.


-- ============================================================
-- BLOCO 0 — Confira o nome exato das obras
-- ============================================================
select o.id,
       o.nome,
       count(distinct sv.id)                                     as servicos,
       count(distinct sv.id) filter (where pg.id is not null)     as servicos_com_full_kit,
       count(pg.id)                                               as perguntas
  from obras o
  left join etapas e on e.obra_id = o.id
  left join servicos sv on sv.etapa_id = e.id
  left join perguntas pg on pg.servico_id = sv.id
 group by o.id, o.nome
 order by o.nome;


-- ============================================================
-- BLOCO 1 — Funções auxiliares
-- ============================================================

-- Normaliza nome para comparação: minúsculas, sem acento, sem espaço sobrando, ³→3 e ²→2.
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

-- Caminho completo da etapa ("Sapata S103@S107 > Sapata S103 > Serviços Preliminares"),
-- só para a prévia ficar legível.
create or replace function public.fk_caminho_etapa(p_etapa_id uuid)
returns text
language sql
stable
as $fn$
  with recursive sobe as (
    select e.id, e.etapa_pai_id, e.nome, 0 as nivel
      from etapas e
     where e.id = p_etapa_id
    union all
    select pai.id, pai.etapa_pai_id, pai.nome, s.nivel + 1
      from etapas pai
      join sobe s on pai.id = s.etapa_pai_id
  )
  select string_agg(nome, ' > ' order by nivel desc) from sobe;
$fn$;

-- Motor da replicação.
--   p_obra_alvo   : padrão ILIKE das obras a preencher (ex: 'AS_027_TR-2012KS-11%')
--   p_obra_modelo : padrão ILIKE das obras que servem de modelo (null = qualquer outra obra)
--   p_aplicar     : false = só simula (prévia); true = grava as perguntas
--   p_mapa        : de/para opcional para nomes que não batem
--                   (ex: '{"Armação (kg)": "Armação"}'::jsonb — chave = nome na obra alvo)
create or replace function public.fk_replicar_full_kit(
  p_obra_alvo   text,
  p_obra_modelo text    default null,
  p_aplicar     boolean default false,
  p_mapa        jsonb   default '{}'::jsonb
)
returns table (
  acao           text,
  obra_alvo      text,
  etapa_alvo     text,
  servico_alvo   text,
  qtd_atual      integer,
  obra_modelo    text,
  servico_modelo text,
  qtd_modelo     integer
)
language sql
as $fn$
  with alvos as (
    select sv.id                                  as alvo_id,
           sv.nome                                as alvo_nome,
           sv.ordem                               as alvo_ordem,
           o.nome                                 as alvo_obra,
           public.fk_caminho_etapa(e.id)          as alvo_etapa,
           (select count(*) from perguntas p where p.servico_id = sv.id)::integer as alvo_qtd,
           public.fk_normalizar_nome(
             coalesce(
               p_mapa ->> sv.nome,
               p_mapa ->> public.fk_normalizar_nome(sv.nome),
               sv.nome
             )
           )                                      as chave
      from servicos sv
      join etapas e on e.id = sv.etapa_id
      join obras  o on o.id = e.obra_id
     where o.nome ilike p_obra_alvo
  ),
  modelos as (
    select sv.id                          as modelo_id,
           sv.nome                        as modelo_nome,
           o.nome                         as modelo_obra,
           sv.created_at                  as modelo_criado_em,
           public.fk_normalizar_nome(sv.nome) as chave,
           count(p.id)::integer           as modelo_qtd
      from servicos sv
      join etapas   e on e.id = sv.etapa_id
      join obras    o on o.id = e.obra_id
      join perguntas p on p.servico_id = sv.id
     where o.nome not ilike p_obra_alvo
       and (p_obra_modelo is null or o.nome ilike p_obra_modelo)
     group by sv.id, sv.nome, o.nome, sv.created_at
  ),
  -- Quando o mesmo nome existe em várias obras, vence o FULL KIT mais completo;
  -- empatou, vence o serviço criado mais recentemente.
  melhor_modelo as (
    select distinct on (chave) *
      from modelos
     order by chave, modelo_qtd desc, modelo_criado_em desc, modelo_id
  ),
  plano as (
    select a.alvo_id,
           a.alvo_nome,
           a.alvo_ordem,
           a.alvo_obra,
           a.alvo_etapa,
           a.alvo_qtd,
           m.modelo_id,
           m.modelo_nome,
           m.modelo_obra,
           m.modelo_qtd,
           case
             when a.alvo_qtd > 0    then 'ja_preenchido'
             when m.modelo_id is null then 'sem_modelo'
             else 'copiar'
           end as acao
      from alvos a
      left join melhor_modelo m on m.chave = a.chave
  ),
  inseridas as (
    insert into perguntas (servico_id, texto, tipo, obrigatoria, ordem)
    select pl.alvo_id, p.texto, p.tipo, p.obrigatoria, p.ordem
      from plano pl
      join perguntas p on p.servico_id = pl.modelo_id
     where p_aplicar and pl.acao = 'copiar'
    returning 1
  )
  select case when p_aplicar and pl.acao = 'copiar' then 'copiado' else pl.acao end,
         pl.alvo_obra,
         pl.alvo_etapa,
         pl.alvo_nome,
         pl.alvo_qtd,
         pl.modelo_obra,
         pl.modelo_nome,
         coalesce(pl.modelo_qtd, 0)
    from plano pl
   order by pl.alvo_obra, pl.alvo_etapa, pl.alvo_ordem, pl.alvo_nome;
$fn$;


-- ============================================================
-- BLOCO 2 — PRÉVIA (não grava nada)
-- ============================================================
-- Quais obras o padrão alvo pega? Devem ser só a EXTERNA e a INTERNA.
select nome as obra_que_sera_preenchida
  from obras
 where nome ilike 'AS_027_TR-2012KS-11%'
 order by nome;

-- Ajuste o padrão se o nome das obras no BLOCO 0 vier diferente.
-- Para fixar a obra modelo, troque o null pelo padrão dela, ex: 'AS_026%'.
select *
  from public.fk_replicar_full_kit('AS_027_TR-2012KS-11%', null, false)
 order by acao, obra_alvo, etapa_alvo;

-- Resumo da prévia:
select acao, count(*) as servicos, sum(qtd_modelo) as perguntas_a_copiar
  from public.fk_replicar_full_kit('AS_027_TR-2012KS-11%', null, false)
 group by acao
 order by acao;


-- ============================================================
-- BLOCO 3 — O que não achou modelo, e o que existe para casar
-- ============================================================
select obra_alvo, etapa_alvo, servico_alvo
  from public.fk_replicar_full_kit('AS_027_TR-2012KS-11%', null, false)
 where acao = 'sem_modelo'
 order by obra_alvo, etapa_alvo, servico_alvo;

-- Catálogo de FULL KITs disponíveis nas outras obras (nomes para o de/para):
select o.nome as obra, sv.nome as servico, count(p.id) as perguntas
  from servicos sv
  join etapas    e on e.id = sv.etapa_id
  join obras     o on o.id = e.obra_id
  join perguntas p on p.servico_id = sv.id
 where o.nome not ilike 'AS_027_TR-2012KS-11%'
 group by o.nome, sv.nome
 order by sv.nome, o.nome;

-- Se algum nome não bateu, rode a prévia de novo com o de/para
-- (chave = nome como está na obra nova, valor = nome na obra modelo):
-- select * from public.fk_replicar_full_kit(
--   'AS_027_TR-2012KS-11%', null, false,
--   '{"Armação (kg)": "Armação", "Concretagem": "Concreto (m³)"}'::jsonb
-- );


-- ============================================================
-- BLOCO 4 — APLICAR (só depois de conferir a prévia)
-- ============================================================
-- Passe o MESMO de/para que você usou na prévia, se tiver usado.
select *
  from public.fk_replicar_full_kit('AS_027_TR-2012KS-11%', null, true)
 order by acao, obra_alvo, etapa_alvo;


-- ============================================================
-- BLOCO 5 — Conferência final
-- ============================================================
select o.nome as obra,
       public.fk_caminho_etapa(e.id) as etapa,
       sv.nome as servico,
       count(p.id) as perguntas
  from servicos sv
  join etapas e on e.id = sv.etapa_id
  join obras  o on o.id = e.obra_id
  left join perguntas p on p.servico_id = sv.id
 where o.nome ilike 'AS_027_TR-2012KS-11%'
 group by o.nome, e.id, sv.id, sv.nome, sv.ordem
 order by o.nome, etapa, sv.ordem;


-- ============================================================
-- BLOCO 6 — (opcional) remover as funções auxiliares
-- ============================================================
-- drop function if exists public.fk_replicar_full_kit(text, text, boolean, jsonb);
-- drop function if exists public.fk_caminho_etapa(uuid);
-- drop function if exists public.fk_normalizar_nome(text);
