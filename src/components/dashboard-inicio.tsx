"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store-auth";
import { etapaAtrasada, janelaDatasServicos, resumoObra, servicosDoSubtree, situacaoEtapa } from "@/lib/planejamento";
import { cn, formatarRelativo } from "@/lib/utils";
import type { SituacaoEtapa } from "@/lib/planejamento";

const CORES_SITUACAO: Record<SituacaoEtapa, string> = {
  nao_iniciada: "bg-muted-foreground/40",
  em_andamento: "bg-primary/40",
  nao_liberada: "bg-destructive",
  liberada: "bg-primary/70",
  concluida: "bg-primary",
};

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function ehHoje(iso: string): boolean {
  const data = new Date(iso);
  const agora = new Date();
  return (
    data.getFullYear() === agora.getFullYear() &&
    data.getMonth() === agora.getMonth() &&
    data.getDate() === agora.getDate()
  );
}

function iniciaisDe(nome: string): string {
  return (
    nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join("") || "?"
  );
}

const dataHoje = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(
  new Date()
);

export function DashboardInicio() {
  const profile = useAuthStore((s) => s.profile);
  const obras = useFullKitStore((s) => s.obras);
  const etapas = useFullKitStore((s) => s.etapas);
  const servicos = useFullKitStore((s) => s.servicos);
  const apontamentos = useFullKitStore((s) => s.apontamentos);
  const getStatusServico = useFullKitStore((s) => s.getStatusServico);

  const resumos = obras.map((obra) => ({
    obra,
    resumo: resumoObra(obra.id, etapas.filter((e) => e.obraId === obra.id), servicos, getStatusServico),
  }));

  let concluidaGeral = 0;
  let totalGeral = 0;
  let pendenciasGeral = 0;
  let etapasNaoLiberadas = 0;
  resumos.forEach(({ resumo }) => {
    resumo.etapasRaiz.forEach((etapa) => {
      const p = resumo.progressoPorEtapaId.get(etapa.id)!;
      concluidaGeral += p.concluida;
      totalGeral += p.total;
      if (situacaoEtapa(p) === "nao_liberada") etapasNaoLiberadas++;
    });
    pendenciasGeral += resumo.pendencias;
  });
  const percentualGeral = totalGeral > 0 ? Math.round((concluidaGeral / totalGeral) * 100) : 0;

  // Etapa (nível folha, o serviço em si) que mais concentra pendências — pra
  // apontar onde o gestor deve olhar primeiro.
  const pendenciasPorEtapa = new Map<string, { nome: string; total: number }>();
  etapas.forEach((etapa) => {
    const servicosDaEtapa = servicos.filter((sv) => sv.etapaId === etapa.id && !sv.concluidoEm);
    const n = servicosDaEtapa.reduce((acc, sv) => acc + getStatusServico(sv.id).pendencias.length, 0);
    if (n > 0) pendenciasPorEtapa.set(etapa.id, { nome: etapa.nome, total: n });
  });
  const etapaComMaisPendencias = [...pendenciasPorEtapa.values()].sort((a, b) => b.total - a.total)[0];

  const apontamentosHoje = apontamentos.filter((a) => ehHoje(a.criadoEm));
  const servicosApontadosHojeIds = new Set(apontamentosHoje.map((a) => a.servicoId));
  const liberadosHoje = [...servicosApontadosHojeIds].filter(
    (id) => getStatusServico(id).status === "liberado"
  ).length;

  const gargalos = resumos.flatMap(({ obra, resumo }) =>
    resumo.etapasRaiz
      .map((etapa) => {
        const progresso = resumo.progressoPorEtapaId.get(etapa.id)!;
        const janela = janelaDatasServicos(servicosDoSubtree(etapa.id, etapas.filter((e) => e.obraId === obra.id), servicos));
        const atrasada = etapaAtrasada(janela, progresso);
        return { obra, etapa, progresso, atrasada };
      })
      .filter((item) => item.atrasada || item.progresso.pendencias > 0)
  );

  const ultimosApontamentos = [...apontamentos]
    .sort((a, b) => (a.criadoEm > b.criadoEm ? -1 : 1))
    .slice(0, 6)
    .map((a) => ({ apontamento: a, servico: servicos.find((sv) => sv.id === a.servicoId) }))
    .filter((item): item is { apontamento: (typeof apontamentos)[number]; servico: NonNullable<(typeof item)["servico"]> } => !!item.servico);

  const primeiroNome = profile?.nome?.split(" ")[0] ?? "";

  return (
    <div className="flex max-w-[1180px] flex-col gap-5.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
            Visão geral · {dataHoje}
          </span>
          <h1 className="text-[26px] font-bold tracking-tight text-foreground">
            {saudacao()}
            {primeiroNome ? `, ${primeiroNome}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {obras.length} obra{obras.length === 1 ? "" : "s"} ativa{obras.length === 1 ? "" : "s"}
            {pendenciasGeral > 0 && ` · ${pendenciasGeral} pendência${pendenciasGeral === 1 ? "" : "s"} aguardando tratativa.`}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-[14px] border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-muted-foreground">Avanço físico</span>
            <span className="flex size-[30px] items-center justify-center rounded-lg bg-primary-tint text-primary-tint-foreground">
              <TrendingUp className="size-[15px]" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[34px] leading-none font-bold tracking-tight tabular-nums text-foreground">
              {percentualGeral}
              <span className="text-xl font-bold">%</span>
            </span>
            {percentualGeral > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary">
                <ArrowUpRight className="size-3.5" />
              </span>
            )}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${percentualGeral}%` }} />
          </div>
          <span className="text-[11.5px] text-muted-foreground">
            {concluidaGeral} de {totalGeral} serviços concluídos
          </span>
        </div>

        <div className="flex flex-col gap-4 rounded-[14px] border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-muted-foreground">Pendências abertas</span>
            <span className="flex size-[30px] items-center justify-center rounded-lg bg-destructive-tint text-destructive-tint-foreground">
              <AlertTriangle className="size-[15px]" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[34px] leading-none font-bold tracking-tight tabular-nums text-foreground">
              {pendenciasGeral}
            </span>
            {etapasNaoLiberadas > 0 && (
              <span className="inline-flex h-5 items-center rounded-full bg-destructive-tint px-2 text-[11.5px] font-semibold text-destructive-tint-foreground">
                {etapasNaoLiberadas} etapa{etapasNaoLiberadas === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <span className="text-[11.5px] text-muted-foreground">
            {etapaComMaisPendencias
              ? `${etapaComMaisPendencias.nome} concentra ${etapaComMaisPendencias.total}`
              : "Nenhuma pendência em aberto"}
          </span>
        </div>

        <div className="flex flex-col gap-4 rounded-[14px] border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-muted-foreground">Serviços liberados hoje</span>
            <span className="flex size-[30px] items-center justify-center rounded-lg bg-primary-tint text-primary-tint-foreground">
              <CheckCircle2 className="size-[15px]" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[34px] leading-none font-bold tracking-tight tabular-nums text-foreground">
              {liberadosHoje}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              de {servicosApontadosHojeIds.size} apontados
            </span>
          </div>
          <span className="text-[11.5px] text-muted-foreground">Hoje, {dataHoje}</span>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="overflow-hidden rounded-[14px] border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5.5 py-4.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-bold tracking-tight">Prontidão por obra</span>
              <span className="text-xs text-muted-foreground">Avanço físico e situação das etapas</span>
            </div>
            <Link href="/gestao" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary">
              Ver todas
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="flex flex-col">
            {resumos.length === 0 && (
              <p className="px-5.5 py-6 text-sm text-muted-foreground">Nenhuma obra cadastrada ainda.</p>
            )}
            {resumos.map(({ obra, resumo }) => (
              <Link
                key={obra.id}
                href={`/gestao/${obra.id}`}
                className="flex items-center gap-4 border-b border-border px-5.5 py-4.5 last:border-b-0 hover:bg-[oklch(0.985_0.004_155)]"
              >
                <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] bg-primary-tint text-primary-tint-foreground">
                  <Building2 className="size-[17px]" />
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{obra.nome}</span>
                    {resumo.pendencias > 0 && (
                      <span className="inline-flex h-[19px] items-center rounded-full bg-destructive-tint px-2 text-[11px] font-semibold text-destructive-tint-foreground">
                        {resumo.pendencias} pendência{resumo.pendencias === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${resumo.percentual}%` }} />
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-foreground/80">
                      {resumo.percentual}%
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {resumo.resumoSituacoes.map(({ situacao, total }) => (
                    <span
                      key={situacao}
                      className="inline-flex h-[22px] items-center gap-1.5 rounded-full border border-border px-2.5 text-[11.5px] font-semibold text-foreground/70"
                    >
                      <span className={cn("size-1.5 rounded-full", CORES_SITUACAO[situacao])} />
                      {total}
                    </span>
                  ))}
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {gargalos.length > 0 && (
            <div className="overflow-hidden rounded-[14px] border border-destructive-tint-border bg-card">
              <div className="flex items-center gap-2 bg-destructive-tint px-5 py-3.5 text-destructive-tint-foreground">
                <AlertTriangle className="size-4" />
                <span className="text-[13.5px] font-bold">Precisa de ação hoje</span>
                <span className="ml-auto text-xs font-semibold">
                  {gargalos.length} etapa{gargalos.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex flex-col p-1.5">
                {gargalos.slice(0, 4).map(({ obra, etapa, progresso, atrasada }) => (
                  <Link
                    key={etapa.id}
                    href={`/gestao/${obra.id}/etapa/${etapa.id}`}
                    className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 hover:bg-[oklch(0.985_0.004_155)]"
                  >
                    <span className="size-2 shrink-0 rounded-full bg-destructive" />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-foreground">
                        {etapa.nome}
                      </span>
                      <span className="text-[11.5px] text-muted-foreground">
                        {progresso.pendencias > 0
                          ? `${progresso.pendencias} pendência${progresso.pendencias === 1 ? "" : "s"}`
                          : "atrasada"}
                        {atrasada && progresso.pendencias > 0 ? " · atrasada" : ""}
                      </span>
                    </div>
                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-[14px] border border-border bg-card">
            <div className="border-b border-border px-5 py-4 text-[13.5px] font-bold text-foreground">
              Últimos apontamentos
            </div>
            <div className="flex flex-col p-1.5">
              {ultimosApontamentos.length === 0 && (
                <p className="px-3.5 py-4 text-sm text-muted-foreground">Nenhum apontamento registrado ainda.</p>
              )}
              {ultimosApontamentos.map(({ apontamento, servico }) => {
                const status = getStatusServico(servico.id).status;
                return (
                  <Link
                    key={apontamento.id}
                    href={`/gestao/${etapas.find((e) => e.id === servico.etapaId)?.obraId ?? ""}/servico/${servico.id}`}
                    className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2.5 hover:bg-[oklch(0.985_0.004_155)]"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-tint text-[10.5px] font-semibold text-primary-tint-foreground">
                      {iniciaisDe(apontamento.autor)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold text-foreground">
                        {servico.nome}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-3" />
                        {apontamento.autor} · {formatarRelativo(apontamento.criadoEm)}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "inline-flex h-[19px] shrink-0 items-center rounded-full px-2 text-[11px] font-semibold",
                        status === "liberado" && "bg-primary-tint text-primary-tint-foreground",
                        status === "nao_liberado" && "bg-destructive-tint text-destructive-tint-foreground",
                        status === "nao_iniciado" && "bg-surface-2 text-muted-foreground"
                      )}
                    >
                      {status === "liberado" ? "Liberado" : status === "nao_liberado" ? "Não liberado" : "Não iniciado"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
