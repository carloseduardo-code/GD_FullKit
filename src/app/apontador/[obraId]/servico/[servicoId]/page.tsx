"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { calcularStatus } from "@/lib/status";
import { caminhoEtapa } from "@/lib/planejamento";
import { formatarDataHora } from "@/lib/utils";
import { FullKitForm } from "@/components/full-kit-form";
import { StatusBadge } from "@/components/status-badge";
import { PendenciasList } from "@/components/pendencias-list";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Resposta, RespostaBooleana } from "@/lib/types";

export default function ResponderFullKitPage() {
  const { obraId, servicoId } = useParams<{ obraId: string; servicoId: string }>();
  const router = useRouter();

  const servico = useFullKitStore((s) => s.servicos.find((sv) => sv.id === servicoId));
  const etapasDaObra = useFullKitStore(useShallow((s) => s.etapas.filter((e) => e.obraId === obraId)));
  const perguntas = useFullKitStore(useShallow((s) => s.perguntas.filter((p) => p.servicoId === servicoId)));
  const ultimoApontamento = useFullKitStore((s) => s.getUltimoApontamento(servicoId));
  const salvarApontamento = useFullKitStore((s) => s.salvarApontamento);

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

  function handleVoltar() {
    if (isDirty) {
      setConfirmSairAberto(true);
    } else {
      router.push(voltarHref);
    }
  }

  function handleSalvar() {
    const listaRespostas: Resposta[] = perguntasOrdenadas.map((p) => ({
      perguntaId: p.id,
      valor: respostas[p.id] ?? null,
    }));

    salvarApontamento({
      servicoId,
      respostas: listaRespostas,
      fotos,
      observacoes,
      autor: "Apontador (protótipo)",
    });

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
    toast.success("Apontamento salvo");
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={handleVoltar}
        className="flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronLeft className="size-4" />
        Voltar
      </button>

      <div>
        <p className="text-xs text-muted-foreground">{caminho.map((e) => e.nome).join(" › ")}</p>
        <h1 className="text-xl font-semibold tracking-tight">{servico.nome}</h1>
        {ultimoApontamento && (
          <p className="text-xs text-muted-foreground pt-1">
            Atualizado por {ultimoApontamento.autor} em {formatarDataHora(ultimoApontamento.criadoEm)}
          </p>
        )}
      </div>

      {resultadoSalvo ? (
        <div className="space-y-4 rounded-lg border p-4">
          <StatusBadge status={resultadoSalvo.status} />
          {resultadoSalvo.status === "bloqueado" ? (
            <PendenciasList pendencias={resultadoSalvo.pendencias} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Todos os requisitos foram atendidos. Serviço liberado para execução.
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setResultadoSalvo(null)}>
              Editar novamente
            </Button>
            <Button onClick={() => router.push(voltarHref)}>Concluir</Button>
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
    </div>
  );
}
