"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ListTree } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { caminhoEtapa, progressoEtapa } from "@/lib/planejamento";
import { ServicoStatusBadge } from "@/components/status-badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function EtapaApontadorPage() {
  const { obraId, etapaId } = useParams<{ obraId: string; etapaId: string }>();
  const obra = useFullKitStore((s) => s.obras.find((o) => o.id === obraId));
  const etapa = useFullKitStore((s) => s.etapas.find((e) => e.id === etapaId));
  const etapasDaObra = useFullKitStore(useShallow((s) => s.etapas.filter((e) => e.obraId === obraId)));
  const servicos = useFullKitStore((s) => s.servicos);
  const getStatusServico = useFullKitStore((s) => s.getStatusServico);

  if (!obra || !etapa) return notFound();

  const caminho = caminhoEtapa(etapaId, etapasDaObra);
  const paiId = caminho.length >= 2 ? caminho[caminho.length - 2].id : undefined;
  const voltarHref = paiId ? `/apontador/${obraId}/etapa/${paiId}` : `/apontador/${obraId}`;

  const filhas = etapasDaObra.filter((e) => e.etapaPaiId === etapaId).sort((a, b) => a.ordem - b.ordem);
  const servicosDiretos = servicos
    .filter((sv) => sv.etapaId === etapaId)
    .sort((a, b) => Number(!!a.concluidoEm) - Number(!!b.concluidoEm) || a.ordem - b.ordem);

  return (
    <div className="space-y-5">
      <Link href={voltarHref} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" />
        Voltar
      </Link>

      <div>
        <p className="text-xs text-muted-foreground">{caminho.map((e) => e.nome).join(" › ")}</p>
        <h1 className="text-xl font-semibold tracking-tight">{etapa.nome}</h1>
        <p className="text-sm text-muted-foreground">{obra.nome}</p>
      </div>

      {filhas.length > 0 && (
        <div className="space-y-2">
          {filhas.map((filha) => {
            const progresso = progressoEtapa(filha.id, etapasDaObra, servicos, getStatusServico);
            return (
              <Link key={filha.id} href={`/apontador/${obraId}/etapa/${filha.id}`}>
                <Card className="transition-colors active:bg-accent">
                  <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-tint">
                      <ListTree className="size-4 text-primary-tint-foreground" />
                    </span>
                    <div className="flex-1">
                      <CardTitle className="text-base">{filha.nome}</CardTitle>
                      <CardDescription>{progresso.percentual}% concluído</CardDescription>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {servicosDiretos.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Serviços notáveis</h2>
          {servicosDiretos.map((servico) => {
            const resultado = getStatusServico(servico.id);
            return (
              <Link key={servico.id} href={`/apontador/${obraId}/servico/${servico.id}`}>
                <Card className="transition-colors active:bg-accent">
                  <CardHeader className="flex-row items-center gap-3 space-y-0 py-3">
                    <div className="flex-1 space-y-1.5">
                      <CardTitle className="text-sm font-medium">{servico.nome}</CardTitle>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <ServicoStatusBadge status={resultado.status} concluido={!!servico.concluidoEm} />
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {filhas.length === 0 && servicosDiretos.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">Nada cadastrado nesta etapa ainda.</p>
      )}
    </div>
  );
}

