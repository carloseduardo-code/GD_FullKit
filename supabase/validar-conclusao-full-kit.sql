-- Garante no banco que um serviço só seja concluído quando o último
-- apontamento atender todas as perguntas obrigatórias do Full Kit.

create index if not exists idx_apontamentos_servico_criado
  on public.apontamentos (servico_id, criado_em desc, id desc);

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

-- Corrige estados inconsistentes que tenham sido gravados antes desta proteção.
update public.servicos s
set concluido_em = null
where s.concluido_em is not null
  and cardinality(public.full_kit_pendencias_servico(s.id)) > 0;

