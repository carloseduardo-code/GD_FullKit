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
  const nAtrasadas = etapasComStatus.filter((e) => e.atrasada).length;

  const gargalos = etapasComStatus.filter((e) => e.atrasada || (e.liberada && e.progresso.pendencias > 0));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{obra.nome}</h1>
        <p className="text-muted-foreground">Painel do Gestor — fluxo executivo da obra.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Evolução geral</CardDescription>
            <CardTitle className="text-2xl">{percentualGeral}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Etapas liberadas</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{nLiberadas}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Etapas bloqueadas</CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">{nBloqueadas}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Etapas atrasadas</CardDescription>
            <CardTitle className="text-2xl text-red-600">{nAtrasadas}</CardTitle>
          </CardHeader>
        </Card>
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
          {etapasComStatus.map(({ etapa, progresso, liberada, atrasada, pendentes }) => (
            <Link key={etapa.id} href={`/gestao/${obraId}/etapa/${etapa.id}`}>
              <Card className="transition-colors hover:border-primary hover:bg-accent/40 cursor-pointer">
                <CardHeader className="flex-row items-center gap-3 space-y-0">
                  <div className="flex-1 space-y-1.5">
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
                    <div className="flex flex-wrap gap-3 pt-0.5 text-xs text-muted-foreground">
                      <span>{progresso.percentual}% concluído</span>
                      <span>{progresso.emAndamento} em andamento</span>
                      <span>{progresso.pronto} concluídas</span>
                      {progresso.pendencias > 0 && (
                        <span className="text-red-600">
                          {progresso.pendencias} pendência{progresso.pendencias === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
