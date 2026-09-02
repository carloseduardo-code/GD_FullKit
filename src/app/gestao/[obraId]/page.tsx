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
} from "@/lib/planejamento";
import { SituacaoEtapaBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ServicoNotavel, StatusServico } from "@/lib/types";

type SituacaoServicoFiltro = "liberado" | "em_andamento" | "nao_iniciado" | "concluido";
type FiltroServico = "todos" | SituacaoServicoFiltro;

const ROTULOS_SERVICO: Record<SituacaoServicoFiltro, (total: number) => string> = {
  liberado: (n) => (n === 1 ? "liberado" : "liberados"),
  em_andamento: () => "em andamento",
  nao_iniciado: (n) => (n === 1 ? "não iniciado" : "não iniciados"),
  concluido: (n) => (n === 1 ? "concluído" : "concluídos"),
};

const CORES_SERVICO: Record<SituacaoServicoFiltro, string> = {
  liberado: "bg-primary",
  em_andamento: "bg-destructive",
  nao_iniciado: "bg-muted-foreground/40",
  concluido: "bg-foreground",
};

const ORDEM_FILTROS: SituacaoServicoFiltro[] = ["liberado", "em_andamento", "nao_iniciado", "concluido"];

function situacaoDoServico(servico: ServicoNotavel, status: StatusServico): SituacaoServicoFiltro {
  if (servico.concluidoEm) return "concluido";
  if (status === "liberado") return "liberado";
  if (status === "nao_liberado") return "em_andamento";
  return "nao_iniciado";
}

export default function PainelGestorPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const [filtroServico, setFiltroServico] = useState<FiltroServico>("todos");
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
    const servicosDaEtapa = servicosDoSubtree(etapa.id, etapas, servicos);
    return { etapa, progresso, janela, liberada, situacao, atrasada, pendentes, servicosDaEtapa };
  });

  const servicosDaObra = Array.from(
    new Map(etapasComStatus.flatMap((item) => item.servicosDaEtapa).map((servico) => [servico.id, servico])).values()
  );
  const statusPorServicoId = new Map(
    servicosDaObra.map((servico) => {
      const status = getStatusServico(servico.id).status;
      return [servico.id, { status, situacao: situacaoDoServico(servico, status) }] as const;
    })
  );
  const contagem = (situacao: SituacaoServicoFiltro) =>
    servicosDaObra.filter((servico) => statusPorServicoId.get(servico.id)?.situacao === situacao).length;
  const resumo = ORDEM_FILTROS.map((situacao) => ({ situacao, total: contagem(situacao) }));
  const nBloqueadas = etapasComStatus.filter((e) => !e.liberada).length;
  const totalPendencias = etapasComStatus.reduce((acc, e) => acc + e.progresso.pendencias, 0);

  const etapasFiltradas = etapasComStatus
    .map((item) => ({
      ...item,
      servicosDaEtapa:
        filtroServico === "todos"
          ? item.servicosDaEtapa
          : item.servicosDaEtapa.filter(
              (servico) => statusPorServicoId.get(servico.id)?.situacao === filtroServico
            ),
    }))
    .filter((item) => filtroServico === "todos" || item.servicosDaEtapa.length > 0);
  const totalServicosFiltrados =
    filtroServico === "todos" ? servicosDaObra.length : contagem(filtroServico);
  const gargalos =
    filtroServico === "todos"
      ? etapasComStatus.filter((e) => e.atrasada || e.progresso.pendencias > 0)
      : [];

  function selecionarFiltro(filtro: FiltroServico) {
    setFiltroServico((atual) => (atual === filtro && filtro !== "todos" ? "todos" : filtro));
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
          aria-pressed={filtroServico === "todos"}
          onClick={() => selecionarFiltro("todos")}
          className={cn(
            "h-auto rounded-full px-3 py-1.5",
            filtroServico === "todos" && "border-foreground bg-foreground text-background hover:bg-foreground/90"
          )}
        >
          <ListFilter data-icon="inline-start" />
          Todos
          <span className="tabular-nums opacity-70">{servicosDaObra.length}</span>
        </Button>
        {resumo.map(({ situacao, total }) => (
          <Button
            key={situacao}
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={filtroServico === situacao}
            onClick={() => selecionarFiltro(situacao)}
            className={cn(
              "h-auto rounded-full px-3 py-1.5",
              situacao === "liberado" &&
                "border-primary/50 bg-primary-tint text-primary-tint-foreground hover:border-primary hover:bg-primary-tint",
              filtroServico === situacao &&
                situacao !== "liberado" &&
                "border-foreground bg-foreground text-background hover:bg-foreground/90",
              filtroServico === "liberado" &&
                situacao === "liberado" &&
                "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            )}
          >
            {situacao === "liberado" ? (
              <CheckCircle2 data-icon="inline-start" />
            ) : (
              <span className={cn("size-1.5 rounded-full", CORES_SERVICO[situacao])} />
            )}
            {total} {ROTULOS_SERVICO[situacao](total)}
          </Button>
        ))}
        {nBloqueadas > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium">
            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
            {nBloqueadas} etapa{nBloqueadas === 1 ? "" : "s"} bloqueada{nBloqueadas === 1 ? "" : "s"}
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
            Exibindo {totalServicosFiltrados} de {servicosDaObra.length} serviço
            {servicosDaObra.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="space-y-2">
          {etapasComStatus.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada nesta obra.</p>
          )}
          {servicosDaObra.length > 0 && etapasFiltradas.length === 0 && (
            <div className="rounded-xl border border-dashed bg-card px-5 py-8 text-center">
              <p className="text-sm font-medium">Nenhum serviço encontrado neste status.</p>
              <p className="mt-1 text-xs text-muted-foreground">Selecione outro indicador para continuar.</p>
              <Button className="mt-4" size="sm" variant="outline" onClick={() => selecionarFiltro("todos")}>
                Mostrar todos
              </Button>
            </div>
          )}
          {etapasFiltradas.map(({ etapa, situacao, liberada, atrasada, pendentes, servicosDaEtapa }) => {
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
                            const statusOperacional = statusPorServicoId.get(servico.id);
                            const status = statusOperacional?.status ?? "nao_iniciado";
                            const situacaoServico = statusOperacional?.situacao ?? "nao_iniciado";
                            const servicoLiberado = situacaoServico === "liberado";
                            const servicoEmAndamento = situacaoServico === "em_andamento";
                            return (
                              <span
                                key={servico.id}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground",
                                  servicoLiberado &&
                                    "border-primary/50 bg-primary-tint text-primary-tint-foreground shadow-sm",
                                  servicoEmAndamento &&
                                    "border-destructive-tint-border bg-destructive-tint text-destructive-tint-foreground"
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
                                <span
                                  className={cn(
                                    "text-[10px] font-semibold uppercase tracking-wide",
                                    servicoLiberado &&
                                      "rounded-full bg-primary px-1.5 py-0.5 text-primary-foreground",
                                    situacaoServico === "nao_iniciado" && "text-muted-foreground",
                                    situacaoServico === "concluido" && "text-foreground"
                                  )}
                                >
                                  {situacaoServico === "liberado" && "Liberado"}
                                  {situacaoServico === "em_andamento" && "Em andamento"}
                                  {situacaoServico === "nao_iniciado" && "Não iniciado"}
                                  {situacaoServico === "concluido" && "Concluído"}
                                </span>
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
