"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { caminhoEtapa } from "@/lib/planejamento";
import { formatarDataHora } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PendenciasList } from "@/components/pendencias-list";
import { FullKitForm } from "@/components/full-kit-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { RespostaBooleana } from "@/lib/types";

export default function ServicoGestaoPage() {
  const { obraId, servicoId } = useParams<{ obraId: string; servicoId: string }>();
  const obra = useFullKitStore((s) => s.obras.find((o) => o.id === obraId));
  const servico = useFullKitStore((s) => s.servicos.find((sv) => sv.id === servicoId));
  const etapasDaObra = useFullKitStore(useShallow((s) => s.etapas.filter((e) => e.obraId === obraId)));
  const perguntas = useFullKitStore(useShallow((s) => s.perguntas.filter((p) => p.servicoId === servicoId)));
  const getStatusServico = useFullKitStore((s) => s.getStatusServico);
  const getUltimoApontamento = useFullKitStore((s) => s.getUltimoApontamento);

  if (!obra || !servico) return notFound();

  const resultado = getStatusServico(servicoId);
  const ultimo = getUltimoApontamento(servicoId);
  const caminho = caminhoEtapa(servico.etapaId, etapasDaObra);
  const respostas: Record<string, RespostaBooleana | string | number | null> = {};
  ultimo?.respostas.forEach((r) => {
    respostas[r.perguntaId] = r.valor;
  });

  return (
    <div className="space-y-8">
      <Link
        href={`/gestao/${obraId}/etapa/${servico.etapaId}`}
        className="flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronLeft className="size-4" />
        Voltar
      </Link>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{caminho.map((e) => e.nome).join(" › ")}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{servico.nome}</h1>
        <p className="text-muted-foreground">{obra.nome}</p>
        {(servico.dataInicioPrevista || servico.dataFimPrevista) && (
          <p className="text-sm text-muted-foreground">
            Previsto: {servico.dataInicioPrevista ?? "—"} até {servico.dataFimPrevista ?? "—"}
          </p>
        )}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <StatusBadge status={resultado.status} />
          {ultimo && (
            <p className="text-xs text-muted-foreground">
              Atualizado por {ultimo.autor} em {formatarDataHora(ultimo.criadoEm)}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!ultimo ? (
            <p className="text-sm text-muted-foreground">Nenhum apontamento registrado ainda.</p>
          ) : (
            <>
              <FullKitForm perguntas={perguntas} mode="consulta" respostas={respostas} fotos={ultimo.fotos} />
              {resultado.status === "bloqueado" && <PendenciasList pendencias={resultado.pendencias} />}
              {ultimo.observacoes && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Observações</p>
                  <p className="text-sm">{ultimo.observacoes}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
