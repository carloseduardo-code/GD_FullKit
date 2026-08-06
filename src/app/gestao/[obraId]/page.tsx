"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { AlertTriangle, ChevronRight, Clock } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import {
  etapaAtrasada,
  etapaLiberada,
  janelaDatasServicos,
  predecessorasPendentes,
  progressoEtapa,
  servicosDoSubtree,
  type ProgressoEtapa,
} from "@/lib/planejamento";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function PainelGestorPage() {
  const { obraId } = useParams<{ obraId: string }>();
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

  let prontoTotal = 0;
  let totalGeral = 0;
  progressoPorEtapaId.forEach((p) => {
    prontoTotal += p.pronto;
    totalGeral += p.total;
  });
  const percentualGeral = totalGeral > 0 ? Math.round((prontoTotal / totalGeral) * 100) : 0;

  const etapasComStatus = etapasRaiz.map((etapa) => {
    const progresso = progressoPorEtapaId.get(etapa.id)!;
    const janela = janelaDatasServicos(servicosDoSubtree(etapa.id, etapas, servicos));
    const liberada = etapaLiberada(etapa, progressoPorEtapaId);
    const atrasada = etapaAtrasada(janela, progresso);
    const pendentes = predecessorasPendentes(etapa, etapas, progressoPorEtapaId);
    return { etapa, progresso, janela, liberada, atrasada, pendentes };
  });

  const nLiberadas = etapasComStatus.filter((e) => e.liberada).length;
  const nBloqueadas = etapasComStatus.length - nLiberadas;
  const totalPendencias = etapasComStatus.reduce((acc, e) => acc + e.progresso.pendencias, 0);

  const gargalos = etapasComStatus.filter((e) => e.atrasada || (e.liberada && e.progresso.pendencias > 0));

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
            prontidão
            <br />
            geral
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {nLiberadas} liberada{nLiberadas === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium">
          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
          {nBloqueadas} bloqueada{nBloqueadas === 1 ? "" : "s"}
        </span>
        {totalPendencias > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
            <span className="size-1.5 rounded-full bg-red-500" />
            {totalPendencias} pendência{totalPendencias === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {gargalos.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-red-600" />
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
        <h2 className="font-medium">Fluxo executivo</h2>
        <div className="space-y-2">
          {etapasComStatus.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada nesta obra.</p>
          )}
          {etapasComStatus.map(({ etapa, liberada, atrasada, pendentes }) => {
            const servicosDaEtapa = servicosDoSubtree(etapa.id, etapas, servicos);
            return (
              <Link key={etapa.id} href={`/gestao/${obraId}/etapa/${etapa.id}`}>
                <Card className="transition-all hover:border-primary hover:bg-accent/40 hover:shadow-md cursor-pointer">
                  <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">{etapa.nome}</CardTitle>
                        {liberada ? (
                          <Badge className="bg-emerald-600 text-white">Liberada</Badge>
                        ) : (
                          <Badge variant="secondary">Bloqueada</Badge>
                        )}
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
                            const status = getStatusServico(servico.id).status;
                            return (
                              <span
                                key={servico.id}
                                className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground"
                              >
                                <span
                                  className={cn(
                                    "size-1.5 shrink-0 rounded-full",
                                    status === "pronto" && "bg-emerald-500",
                                    status === "bloqueado" && "bg-red-500",
                                    status === "nao_iniciado" && "bg-muted-foreground/40"
                                  )}
                                />
                                {servico.nome}
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
