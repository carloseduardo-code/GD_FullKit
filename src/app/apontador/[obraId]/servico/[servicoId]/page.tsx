"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, RotateCcw, Undo2 } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store-auth";
import { useShallow } from "zustand/react/shallow";
import { calcularStatus, ConclusaoBloqueadaError } from "@/lib/status";
import { caminhoEtapa } from "@/lib/planejamento";
import { formatarDataHora } from "@/lib/utils";
import { FullKitForm } from "@/components/full-kit-form";
import { ServicoStatusBadge } from "@/components/status-badge";
import { PendenciasList } from "@/components/pendencias-list";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Pendencia, Resposta, RespostaBooleana } from "@/lib/types";

export default function ResponderFullKitPage() {
  const { obraId, servicoId } = useParams<{ obraId: string; servicoId: string }>();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);

  const servico = useFullKitStore((s) => s.servicos.find((sv) => sv.id === servicoId));
  const etapasDaObra = useFullKitStore(useShallow((s) => s.etapas.filter((e) => e.obraId === obraId)));
  const perguntas = useFullKitStore(useShallow((s) => s.perguntas.filter((p) => p.servicoId === servicoId)));
  const ultimoApontamento = useFullKitStore((s) => s.getUltimoApontamento(servicoId));
  const salvarApontamento = useFullKitStore((s) => s.salvarApontamento);
  const getStatusServico = useFullKitStore((s) => s.getStatusServico);
  const marcarConcluido = useFullKitStore((s) => s.marcarConcluido);
  const desmarcarConcluido = useFullKitStore((s) => s.desmarcarConcluido);
  const resetFullKit = useFullKitStore((s) => s.resetFullKit);

  const respostasIniciais = useMemo(() => {
    const map: Record<string, RespostaBooleana | string | number | null> = {};
    ultimoApontamento?.respostas.forEach((r) => {
      map[r.perguntaId] = r.valor;
    });
    return map;
  }, [ultimoApontamento]);

  const [respostas, setRespostas] = useState(respostasIniciais);
  const [fotos, setFotos] = useState<string[]>(ultimoApontamento?.fotos ?? []);
  const [observacoes, setObservacoes] = useState(ultimoApontamento?.observacoes ?? "");
  const [resultadoSalvo, setResultadoSalvo] = useState<ReturnType<typeof calcularStatus> | null>(null);
  const [confirmSairAberto, setConfirmSairAberto] = useState(false);
  const [confirmResetAberto, setConfirmResetAberto] = useState(false);
  const [processandoConclusao, setProcessandoConclusao] = useState(false);
  const [pendenciasConclusao, setPendenciasConclusao] = useState<Pendencia[]>([]);

  const [baseline, setBaseline] = useState(() =>
    JSON.stringify({ respostas: respostasIniciais, fotos: ultimoApontamento?.fotos ?? [], observacoes: ultimoApontamento?.observacoes ?? "" })
  );
  const isDirty = JSON.stringify({ respostas, fotos, observacoes }) !== baseline;

  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  if (!servico) return notFound();

  const caminho = caminhoEtapa(servico.etapaId, etapasDaObra);
  const voltarHref = `/apontador/${obraId}/etapa/${servico.etapaId}`;
  const perguntasOrdenadas = [...perguntas].sort((a, b) => a.ordem - b.ordem);
  const statusAtual = getStatusServico(servicoId);

  function handleVoltar() {
    if (isDirty) {
      setConfirmSairAberto(true);
    } else {
      router.push(voltarHref);
    }
  }

  async function handleSalvar() {
    const listaRespostas: Resposta[] = perguntasOrdenadas.map((p) => ({
      perguntaId: p.id,
      valor: respostas[p.id] ?? null,
    }));

    try {
      await salvarApontamento({
        servicoId,
        respostas: listaRespostas,
        fotos,
        observacoes,
        autor: profile?.nome || profile?.username || "Apontador",
      });
    } catch {
      return; // erro já mostrado pelo store
    }

    setBaseline(JSON.stringify({ respostas, fotos, observacoes }));

    const resultado = calcularStatus(perguntasOrdenadas, {
      id: "preview",
      servicoId,
      respostas: listaRespostas,
      fotos,
      observacoes,
      autor: "",
      criadoEm: new Date().toISOString(),
    });

    setResultadoSalvo(resultado);
    if (resultado.status === "liberado") setPendenciasConclusao([]);
    toast.success("Apontamento salvo");
  }

  async function handleMarcarConcluido() {
    setProcessandoConclusao(true);
    setPendenciasConclusao([]);
    try {
      await marcarConcluido(servicoId);
      toast.success("Serviço concluído. Avanço físico atualizado.");
      router.push(voltarHref);
    } catch (erro) {
      if (erro instanceof ConclusaoBloqueadaError) {
        setPendenciasConclusao(erro.pendencias);
        toast.error(
          erro.pendencias.length > 0
            ? "Não é possível concluir. Responda e salve as perguntas obrigatórias indicadas."
            : "Não é possível concluir. Preencha e salve o Full Kit primeiro."
        );
      }
    } finally {
      setProcessandoConclusao(false);
    }
  }

  async function handleDesmarcarConcluido() {
    setProcessandoConclusao(true);
    try {
      await desmarcarConcluido(servicoId);
      toast.success("Conclusão desfeita");
    } catch {
      // erro já mostrado pelo store
    } finally {
      setProcessandoConclusao(false);
    }
  }

  async function handleResetar() {
    try {
      await resetFullKit(servicoId);
      setRespostas({});
      setFotos([]);
      setObservacoes("");
      setBaseline(JSON.stringify({ respostas: {}, fotos: [], observacoes: "" }));
      setResultadoSalvo(null);
      setPendenciasConclusao([]);
      toast.success("Full Kit limpo. Serviço voltou para Não Iniciada.");
    } catch {
      // erro já mostrado pelo store
    }
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={handleVoltar}
        className="flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronLeft className="size-4" />
        Voltar
      </button>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">{caminho.map((e) => e.nome).join(" › ")}</p>
        <h1 className="text-xl font-semibold tracking-tight">{servico.nome}</h1>
        {ultimoApontamento && (
          <p className="text-xs text-muted-foreground">
            Atualizado por {ultimoApontamento.autor} em {formatarDataHora(ultimoApontamento.criadoEm)}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <ServicoStatusBadge status={statusAtual.status} concluido={!!servico.concluidoEm} />
          {!servico.concluidoEm && (
            <Button size="sm" variant="outline" disabled={processandoConclusao} onClick={handleMarcarConcluido}>
              <CheckCircle2 data-icon="inline-start" className="size-3.5" />
              Marcar como concluído
            </Button>
          )}
          {servico.concluidoEm && (
            <Button size="sm" variant="outline" disabled={processandoConclusao} onClick={handleDesmarcarConcluido}>
              <Undo2 data-icon="inline-start" className="size-3.5" />
              Desfazer conclusão
            </Button>
          )}
          {(statusAtual.status !== "nao_iniciado" || servico.concluidoEm) && (
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
        </div>
        {!servico.concluidoEm && pendenciasConclusao.length > 0 && (
          <div className="mt-3 rounded-lg border border-destructive-tint-border bg-destructive-tint p-3">
            <p className="mb-2 text-sm font-medium text-destructive-tint-foreground">
              Responda e salve estas perguntas antes de concluir:
            </p>
            <PendenciasList pendencias={pendenciasConclusao} />
          </div>
        )}
      </div>

      {resultadoSalvo ? (
        <div className="space-y-4 rounded-lg border p-4">
          <ServicoStatusBadge status={resultadoSalvo.status} concluido={!!servico.concluidoEm} />
          {!servico.concluidoEm && (
            resultadoSalvo.status === "nao_liberado" ? (
              <PendenciasList pendencias={resultadoSalvo.pendencias} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Todos os requisitos foram atendidos. Serviço liberado para execução.
              </p>
            )
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setResultadoSalvo(null)}>
              Editar novamente
            </Button>
            <Button onClick={() => router.push(voltarHref)}>Voltar</Button>
          </div>
        </div>
      ) : (
        <>
          <FullKitForm
            perguntas={perguntasOrdenadas}
            mode="responder"
            respostas={respostas}
            onChangeResposta={(perguntaId, valor) =>
              setRespostas((prev) => ({ ...prev, [perguntaId]: valor }))
            }
            fotos={fotos}
            onFotosChange={setFotos}
          />

          <div className="space-y-2">
            <Label className="text-sm font-normal">Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre a inspeção..."
              rows={3}
            />
          </div>

          <Button className="w-full" size="lg" onClick={handleSalvar}>
            Salvar apontamento
          </Button>
        </>
      )}

      <ConfirmDialog
        open={confirmSairAberto}
        onOpenChange={setConfirmSairAberto}
        title="Descartar alterações?"
        description="Você preencheu o checklist mas ainda não salvou. Se sair agora, as respostas serão perdidas."
        confirmLabel="Sair sem salvar"
        onConfirm={() => router.push(voltarHref)}
      />

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

