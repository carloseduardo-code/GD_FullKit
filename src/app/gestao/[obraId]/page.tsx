"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronRight, Clock, ListFilter } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import {
  etapaAtrasada,
  etapaLiberada,
  janelaDatasServicos,
  predecessorasPendentes,
  progressoEtapa,
  servicosDoSubtree,
  situacaoEtapa,
  type ProgressoEtapa,
  type SituacaoEtapa,
} from "@/lib/planejamento";
import { SituacaoEtapaBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CORES_SITUACAO: Record<SituacaoEtapa, string> = {
  nao_iniciada: "bg-muted-foreground/40",
  em_andamento: "bg-primary/40",
  nao_liberada: "bg-destructive",
  liberada: "bg-primary/70",
  concluida: "bg-primary",
};

const ROTULOS_SITUACAO: Record<SituacaoEtapa, (total: number) => string> = {
  nao_iniciada: (n) => (n === 1 ? "não iniciada" : "não iniciadas"),
  em_andamento: () => "em andamento",
  nao_liberada: (n) => (n === 1 ? "não liberada" : "não liberadas"),
  liberada: (n) => (n === 1 ? "liberada" : "liberadas"),
  concluida: (n) => (n === 1 ? "concluída" : "concluídas"),
};

type FiltroSituacao = "todas" | SituacaoEtapa;

const ORDEM_FILTROS: SituacaoEtapa[] = [
  "liberada",
  "em_andamento",
  "nao_iniciada",
  "nao_liberada",
  "concluida",
];

export default function PainelGestorPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const [filtroSituacao, setFiltroSituacao] = useState<FiltroSituacao>("todas");
  const obra = useFullKitStore((s) => s.obras.find((o) => o.id === obraId));
  const etapas = useFullKitStore(useShallow((s) => s.etapas.filter((e) => e.obraId === obraId)));
  const servicos = useFullKitStore((s) => s.servicos);
  const getStatusServico = useFullKitStore((s) => s.getStatusServico);

  if (!obra) return notFound();

  const etapasRaiz = etapas.filter((e) => !e.etapaPaiId).sort((a, b) => a.ordem - b.ordem);

  const progressoPorEtapaId = new Map<string, ProgressoEtapa>();
  etapas.forEach((etapa) => {
    progressoPorEtapaId.set(etapa.id, progressoEtapa(etapa.id, etapas, servicos, getStatusServico));
  });

  let concluidaTotal = 0;
  let totalGeral = 0;
  progressoPorEtapaId.forEach((p) => {
    concluidaTotal += p.concluida;
    totalGeral += p.total;
  });
  const percentualGeral = totalGeral > 0 ? Math.round((concluidaTotal / totalGeral) * 100) : 0;

  const etapasComStatus = etapasRaiz.map((etapa) => {
    const progresso = progressoPorEtapaId.get(etapa.id)!;
    const janela = janelaDatasServicos(servicosDoSubtree(etapa.id, etapas, servicos));
    // `liberada` aqui é só o gate de planejamento (predecessoras concluídas);
    // a situação mostrada ao gestor vem do Full Kit dos serviços.
    const liberada = etapaLiberada(etapa, progressoPorEtapaId);
    const situacao = situacaoEtapa(progresso);
    const atrasada = etapaAtrasada(janela, progresso);
    const pendentes = predecessorasPendentes(etapa, etapas, progressoPorEtapaId);
    return { etapa, progresso, janela, liberada, situacao, atrasada, pendentes };
  });

  const contagem = (situacao: SituacaoEtapa) =>
    etapasComStatus.filter((e) => e.situacao === situacao).length;
  const resumo: { situacao: SituacaoEtapa; total: number }[] = ORDEM_FILTROS
    .map((situacao) => ({ situacao, total: contagem(situacao) }))
    .filter((item) => item.total > 0 || item.situacao === "liberada" || item.situacao === "em_andamento");
  const nBloqueadas = etapasComStatus.filter((e) => !e.liberada).length;
  const totalPendencias = etapasComStatus.reduce((acc, e) => acc + e.progresso.pendencias, 0);

  const etapasFiltradas =
    filtroSituacao === "todas"
      ? etapasComStatus
      : etapasComStatus.filter((item) => item.situacao === filtroSituacao);
  const idsEtapasFiltradas = new Set(etapasFiltradas.map((item) => item.etapa.id));
  const gargalos = etapasComStatus.filter(
    (e) => idsEtapasFiltradas.has(e.etapa.id) && (e.atrasada || e.progresso.pendencias > 0)
  );

  function selecionarFiltro(filtro: FiltroSituacao) {
    setFiltroSituacao((atual) => (atual === filtro && filtro !== "todas" ? "todas" : filtro));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Painel do Gestor</p>
          <h1 className="text-3xl font-semibold tracking-tight">{obra.nome}</h1>
          <p className="text-sm text-muted-foreground">Fluxo executivo e prontidão operacional da obra.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-2.5 shadow-sm">
          <span className="text-3xl font-semibold tabular-nums text-primary">{percentualGeral}%</span>
          <span className="text-xs leading-tight text-muted-foreground">
            avanço
            <br />
            físico
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5" aria-label="Filtros do fluxo executivo">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={filtroSituacao === "todas"}
          onClick={() => selecionarFiltro("todas")}
          className={cn(
            "h-auto rounded-full px-3 py-1.5",
            filtroSituacao === "todas" && "border-foreground bg-foreground text-background hover:bg-foreground/90"
          )}
        >
          <ListFilter data-icon="inline-start" />
          Todas
          <span className="tabular-nums opacity-70">{etapasComStatus.length}</span>
        </Button>
        {resumo.map(({ situacao, total }) => (
          <Button
            key={situacao}
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={filtroSituacao === situacao}
            onClick={() => selecionarFiltro(situacao)}
            className={cn(
              "h-auto rounded-full px-3 py-1.5",
              situacao === "liberada" &&
                "border-primary/50 bg-primary-tint text-primary-tint-foreground hover:border-primary hover:bg-primary-tint",
              filtroSituacao === situacao &&
                situacao !== "liberada" &&
                "border-foreground bg-foreground text-background hover:bg-foreground/90",
              filtroSituacao === "liberada" &&
                situacao === "liberada" &&
                "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            )}
          >
            {situacao === "liberada" ? (
              <CheckCircle2 data-icon="inline-start" />
            ) : (
              <span className={cn("size-1.5 rounded-full", CORES_SITUACAO[situacao])} />
            )}
            {total} {ROTULOS_SITUACAO[situacao](total)}
          </Button>
        ))}
        {nBloqueadas > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium">
            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
            {nBloqueadas} bloqueada{nBloqueadas === 1 ? "" : "s"} por predecessora
          </span>
        )}
        {totalPendencias > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive-tint-border bg-destructive-tint px-3 py-1.5 text-xs font-medium text-destructive-tint-foreground">
            <span className="size-1.5 rounded-full bg-destructive" />
            {totalPendencias} pendência{totalPendencias === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {gargalos.length > 0 && (
        <Card className="border-destructive-tint-border bg-destructive-tint">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-destructive" />
              Atenção
            </CardTitle>
            <CardDescription>Etapas que precisam de ação agora.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {gargalos.map(({ etapa, progresso, atrasada }) => (
              <Link
                key={etapa.id}
                href={`/gestao/${obraId}/etapa/${etapa.id}`}
                className="flex items-center justify-between rounded-md border bg-background p-2.5 text-sm hover:border-primary"
              >
                <span className="font-medium">{etapa.nome}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {atrasada && (
                    <Badge variant="destructive">
                      <Clock data-icon="inline-start" className="size-3" />
                      Atrasada
                    </Badge>
                  )}
                  {progresso.pendencias > 0 &&
                    `${progresso.pendencias} pendência${progresso.pendencias === 1 ? "" : "s"}`}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">Fluxo executivo</h2>
          <p className="text-xs text-muted-foreground">
            Exibindo {etapasFiltradas.length} de {etapasComStatus.length} etapa
            {etapasComStatus.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="space-y-2">
          {etapasComStatus.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada nesta obra.</p>
          )}
          {etapasComStatus.length > 0 && etapasFiltradas.length === 0 && (
            <div className="rounded-xl border border-dashed bg-card px-5 py-8 text-center">
              <p className="text-sm font-medium">Nenhuma etapa encontrada neste status.</p>
              <p className="mt-1 text-xs text-muted-foreground">Selecione outro indicador para continuar.</p>
              <Button className="mt-4" size="sm" variant="outline" onClick={() => selecionarFiltro("todas")}>
                Mostrar todas
              </Button>
            </div>
          )}
          {etapasFiltradas.map(({ etapa, situacao, liberada, atrasada, pendentes }) => {
            const servicosDaEtapa = servicosDoSubtree(etapa.id, etapas, servicos);
            return (
              <Link key={etapa.id} href={`/gestao/${obraId}/etapa/${etapa.id}`}>
                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary hover:bg-accent/40 hover:shadow-md",
                    situacao === "liberada" && "border-primary/50 bg-primary-tint/30 shadow-sm"
                  )}
                >
                  <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">{etapa.nome}</CardTitle>
                        <SituacaoEtapaBadge situacao={situacao} />
                        {!liberada && <Badge variant="secondary">Bloqueada</Badge>}
                        {atrasada && <Badge variant="destructive">Atrasada</Badge>}
                      </div>
                      {!liberada && pendentes.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Aguardando: {pendentes.map((p) => p.nome).join(", ")}
                        </p>
                      )}
                      {servicosDaEtapa.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {servicosDaEtapa.map((servico) => {
                            const concluida = !!servico.concluidoEm;
                            const status = getStatusServico(servico.id).status;
                            const servicoLiberado = !concluida && status === "liberado";
                            return (
                              <span
                                key={servico.id}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground",
                                  servicoLiberado &&
                                    "border-primary/40 bg-primary-tint text-primary-tint-foreground shadow-sm"
                                )}
                              >
                                <span
                                  className={cn(
                                    "size-1.5 shrink-0 rounded-full",
                                    concluida && "bg-primary",
                                    servicoLiberado && "bg-primary",
                                    !concluida && status === "nao_liberado" && "bg-destructive",
                                    !concluida && status === "nao_iniciado" && "bg-muted-foreground/40"
                                  )}
                                />
                                {servico.nome}
                                {servicoLiberado && (
                                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                                    Liberado
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground pt-0.5">Nenhum serviço notável cadastrado.</p>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
