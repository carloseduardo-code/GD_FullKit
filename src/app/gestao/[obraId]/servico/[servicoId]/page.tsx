"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { caminhoEtapa } from "@/lib/planejamento";
import { formatarDataHora } from "@/lib/utils";
import { ConcluidaBadge, StatusBadge } from "@/components/status-badge";
import { PendenciasList } from "@/components/pendencias-list";
import { FullKitForm } from "@/components/full-kit-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
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
  const resetFullKit = useFullKitStore((s) => s.resetFullKit);

  const [confirmResetAberto, setConfirmResetAberto] = useState(false);

  if (!obra || !servico) return notFound();

  const resultado = getStatusServico(servicoId);
  const ultimo = getUltimoApontamento(servicoId);
  const caminho = caminhoEtapa(servico.etapaId, etapasDaObra);
  const respostas: Record<string, RespostaBooleana | string | number | null> = {};
  ultimo?.respostas.forEach((r) => {
    respostas[r.perguntaId] = r.valor;
  });

  async function handleResetar() {
    try {
      await resetFullKit(servicoId);
      toast.success("Full Kit limpo. Serviço voltou para Não Iniciada.");
    } catch {
      // erro já mostrado pelo store
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/gestao/${obraId}/etapa/${servico.etapaId}`}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Voltar
      </Link>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{caminho.map((e) => e.nome).join(" › ")}</p>
        <h1 className="text-xl font-semibold tracking-tight">{servico.nome}</h1>
        <p className="text-sm text-muted-foreground">{obra.nome}</p>
        {(servico.dataInicioPrevista || servico.dataFimPrevista) && (
          <p className="text-sm text-muted-foreground">
            Previsto: {servico.dataInicioPrevista ?? "—"} até {servico.dataFimPrevista ?? "—"}
          </p>
        )}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={resultado.status} />
            {servico.concluidoEm && <ConcluidaBadge />}
            {ultimo && (
              <p className="text-xs text-muted-foreground">
                Atualizado por {ultimo.autor} em {formatarDataHora(ultimo.criadoEm)}
              </p>
            )}
          </div>
          {(resultado.status !== "nao_iniciado" || servico.concluidoEm) && (
            <Button
              size="sm"
              variant="outline"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmResetAberto(true)}
            >
              <RotateCcw data-icon="inline-start" className="size-3.5" />
              Resetar Full Kit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!ultimo ? (
            <p className="text-sm text-muted-foreground">Nenhum apontamento registrado ainda.</p>
          ) : (
            <>
              <FullKitForm perguntas={perguntas} mode="consulta" respostas={respostas} fotos={ultimo.fotos} />
              {resultado.status === "nao_liberado" && <PendenciasList pendencias={resultado.pendencias} />}
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

      <ConfirmDialog
        open={confirmResetAberto}
        onOpenChange={setConfirmResetAberto}
        title="Resetar Full Kit"
        description="Isso apaga todas as respostas já registradas para este serviço e o devolve para o estado Não Iniciada. Use quando o Full Kit foi preenchido incorretamente e precisa ser refeito do zero."
        confirmLabel="Resetar"
        onConfirm={handleResetar}
      />
    </div>
  );
}
