"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import {
  caminhoEtapa,
  etapaAtrasada,
  etapaLiberada,
  janelaDatasServicos,
  predecessorasPendentes,
  progressoEtapa,
  servicosDoSubtree,
  sucessorasDe,
  type ProgressoEtapa,
} from "@/lib/planejamento";
import { StatusBadge } from "@/components/status-badge";
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
  const atrasada = etapaAtrasada(janela, progresso);
  const pendentes = predecessorasPendentes(etapa, etapasDaObra, progressoPorEtapaId);
  const sucessoras = sucessorasDe(etapaId, etapasDaObra);

  const filhas = etapasDaObra.filter((e) => e.etapaPaiId === etapaId).sort((a, b) => a.ordem - b.ordem);
  const servicosDiretos = servicos.filter((sv) => sv.etapaId === etapaId).sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="space-y-8">
      <Link href={voltarHref} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" />
        Voltar
      </Link>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">{caminho.map((e) => e.nome).join(" › ")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{etapa.nome}</h1>
          {liberada ? (
            <Badge className="bg-emerald-600 text-white">Liberada</Badge>
          ) : (
            <Badge variant="secondary">Bloqueada</Badge>
          )}
          {atrasada && <Badge variant="destructive">Atrasada</Badge>}
        </div>
        <p className="text-muted-foreground">{obra.nome}</p>
        {!liberada && pendentes.length > 0 && (
          <p className="text-sm text-muted-foreground">Aguardando: {pendentes.map((p) => p.nome).join(", ")}</p>
        )}
        {(janela.inicio || janela.fim) && (
          <p className="text-sm text-muted-foreground">
            Previsto: {janela.inicio ?? "—"} até {janela.fim ?? "—"}
          </p>
        )}
        {sucessoras.length > 0 && (
          <p className="text-sm text-muted-foreground">Libera: {sucessoras.map((s) => s.nome).join(", ")}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Concluído</CardDescription>
            <CardTitle className="text-2xl">{progresso.percentual}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Em andamento</CardDescription>
            <CardTitle className="text-2xl">{progresso.emAndamento}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Concluídas</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{progresso.pronto}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pendências</CardDescription>
            <CardTitle className="text-2xl text-red-600">{progresso.pendencias}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {filhas.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-medium">Sub-etapas</h2>
          <div className="space-y-2">
            {filhas.map((filha) => {
              const progFilha = progressoPorEtapaId.get(filha.id)!;
              const liberadaFilha = etapaLiberada(filha, progressoPorEtapaId);
              return (
                <Link key={filha.id} href={`/gestao/${obraId}/etapa/${filha.id}`}>
                  <Card className="transition-colors hover:border-primary hover:bg-accent/40 cursor-pointer">
                    <CardHeader className="flex-row items-center gap-3 space-y-0 py-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-sm font-medium">{filha.nome}</CardTitle>
                          {liberadaFilha ? (
                            <Badge className="bg-emerald-600 text-white text-xs">Liberada</Badge>
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
          <h2 className="font-medium">Serviços notáveis</h2>
          <div className="space-y-2">
            {servicosDiretos.map((servico) => {
              const resultado = getStatusServico(servico.id);
              return (
                <Link key={servico.id} href={`/gestao/${obraId}/servico/${servico.id}`}>
                  <Card className="transition-colors hover:border-primary hover:bg-accent/40 cursor-pointer">
                    <CardHeader className="flex-row items-center gap-3 space-y-0 py-3">
                      <div className="flex-1 space-y-1">
                        <CardTitle className="text-sm font-medium">{servico.nome}</CardTitle>
                        <StatusBadge status={resultado.status} />
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
