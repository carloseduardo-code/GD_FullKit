"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Clock, ListTree } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import {
  caminhoEtapa,
  etapaLiberada,
  janelaDatasServicos,
  predecessorasPendentes,
  progressoEtapa,
  servicosDoSubtree,
  sucessorasDe,
  type ProgressoEtapa,
} from "@/lib/planejamento";
import { ConcluidaBadge, StatusBadge } from "@/components/status-badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function EtapaGestaoPage() {
  const { obraId, etapaId } = useParams<{ obraId: string; etapaId: string }>();
  const obra = useFullKitStore((s) => s.obras.find((o) => o.id === obraId));
  const etapa = useFullKitStore((s) => s.etapas.find((e) => e.id === etapaId));
  const etapasDaObra = useFullKitStore(useShallow((s) => s.etapas.filter((e) => e.obraId === obraId)));
  const servicos = useFullKitStore((s) => s.servicos);
  const getStatusServico = useFullKitStore((s) => s.getStatusServico);

  if (!obra || !etapa) return notFound();

  const caminho = caminhoEtapa(etapaId, etapasDaObra);
  const paiId = caminho.length >= 2 ? caminho[caminho.length - 2].id : undefined;
  const voltarHref = paiId ? `/gestao/${obraId}/etapa/${paiId}` : `/gestao/${obraId}`;

  const progressoPorEtapaId = new Map<string, ProgressoEtapa>();
  etapasDaObra.forEach((e) => {
    progressoPorEtapaId.set(e.id, progressoEtapa(e.id, etapasDaObra, servicos, getStatusServico));
  });

  const progresso = progressoPorEtapaId.get(etapaId)!;
  const janela = janelaDatasServicos(servicosDoSubtree(etapaId, etapasDaObra, servicos));
  const liberada = etapaLiberada(etapa, progressoPorEtapaId);
  const pendentes = predecessorasPendentes(etapa, etapasDaObra, progressoPorEtapaId);
  const sucessoras = sucessorasDe(etapaId, etapasDaObra);

  const filhas = etapasDaObra.filter((e) => e.etapaPaiId === etapaId).sort((a, b) => a.ordem - b.ordem);
  const servicosDiretos = servicos
    .filter((sv) => sv.etapaId === etapaId)
    .sort((a, b) => Number(!!a.concluidoEm) - Number(!!b.concluidoEm) || a.ordem - b.ordem);
  const temDetalhesExtras = janela.inicio || janela.fim || (!liberada && pendentes.length > 0) || sucessoras.length > 0;

  return (
    <div className="space-y-6">
      <Link href={voltarHref} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" />
        Voltar
      </Link>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="space-y-1.5">
            {caminho.length > 1 && (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {caminho.slice(0, -1).map((e) => e.nome).join(" / ")}
              </p>
            )}
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-tint">
                <ListTree className="size-5 text-primary-tint-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">{etapa.nome}</h1>
                <p className="text-sm text-muted-foreground">{obra.nome}</p>
              </div>
            </div>
          </div>
          {liberada ? (
            <Badge className="bg-primary text-primary-foreground">Liberada</Badge>
          ) : (
            <Badge variant="secondary">Bloqueada</Badge>
          )}
        </div>

        {temDetalhesExtras && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t bg-muted/30 px-5 py-3 text-sm text-muted-foreground">
            {(janela.inicio || janela.fim) && (
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {janela.inicio ?? "—"} até {janela.fim ?? "—"}
              </span>
            )}
            {!liberada && pendentes.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                Aguardando {pendentes.map((p) => p.nome).join(", ")}
              </span>
            )}
            {sucessoras.length > 0 && (
              <span className="flex items-center gap-1.5">
                <ArrowRight className="size-3.5" />
                Libera {sucessoras.map((s) => s.nome).join(", ")}
              </span>
            )}
          </div>
        )}
      </div>

      {filhas.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Avanço físico</CardDescription>
              <CardTitle className="text-2xl">{progresso.percentual}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Em andamento</CardDescription>
              <CardTitle className="text-2xl">{progresso.liberado}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Concluídas</CardDescription>
              <CardTitle className="text-2xl text-primary">{progresso.concluida}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Pendências</CardDescription>
              <CardTitle className="text-2xl text-destructive">{progresso.pendencias}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {filhas.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-medium">Sub-etapas</h2>
          <div className="space-y-2">
            {filhas.map((filha) => {
              const progFilha = progressoPorEtapaId.get(filha.id)!;
              const liberadaFilha = etapaLiberada(filha, progressoPorEtapaId);
              return (
                <Link key={filha.id} href={`/gestao/${obraId}/etapa/${filha.id}`}>
                  <Card className="transition-all hover:border-primary hover:bg-accent/40 hover:shadow-md cursor-pointer">
                    <CardHeader className="flex-row items-center gap-3 space-y-0 py-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-sm font-medium">{filha.nome}</CardTitle>
                          {liberadaFilha ? (
                            <Badge className="bg-primary text-primary-foreground text-xs">Liberada</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Bloqueada</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{progFilha.percentual}% concluído</span>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {servicosDiretos.length > 0 && (
        <div className="space-y-3">
          {filhas.length > 0 && <h2 className="font-medium">Serviços notáveis</h2>}
          <div className="space-y-2">
            {servicosDiretos.map((servico) => {
              const resultado = getStatusServico(servico.id);
              return (
                <Link key={servico.id} href={`/gestao/${obraId}/servico/${servico.id}`}>
                  <Card className="transition-all hover:border-primary hover:bg-accent/40 hover:shadow-md cursor-pointer">
                    <CardHeader className="flex-row items-center gap-3 space-y-0 py-3">
                      <div className="flex-1 space-y-1">
                        <CardTitle className="text-sm font-medium">{servico.nome}</CardTitle>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={resultado.status} />
                          {servico.concluidoEm && <ConcluidaBadge />}
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {filhas.length === 0 && servicosDiretos.length === 0 && (
        <p className="text-sm text-muted-foreground">Nada cadastrado nesta etapa ainda.</p>
      )}
    </div>
  );
}
