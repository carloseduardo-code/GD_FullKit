"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { calcularStatus } from "@/lib/status";
import { FullKitForm } from "@/components/full-kit-form";
import { StatusBadge } from "@/components/status-badge";
import { PendenciasList } from "@/components/pendencias-list";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Resposta } from "@/lib/types";

export default function ResponderFullKitPage() {
  const { obraId, elementoId, servicoId } = useParams<{
    obraId: string;
    elementoId: string;
    servicoId: string;
  }>();
  const router = useRouter();

  const elemento = useFullKitStore((s) => s.elementos.find((e) => e.id === elementoId));
  const servico = useFullKitStore((s) => s.servicos.find((sv) => sv.id === servicoId));
  const perguntas = useFullKitStore(useShallow((s) => s.perguntas.filter((p) => p.servicoId === servicoId)));
  const ultimoApontamento = useFullKitStore((s) => s.getUltimoApontamento(elementoId, servicoId));
  const salvarApontamento = useFullKitStore((s) => s.salvarApontamento);

  const respostasIniciais = useMemo(() => {
    const map: Record<string, boolean | string | number | null> = {};
    ultimoApontamento?.respostas.forEach((r) => {
      map[r.perguntaId] = r.valor;
    });
    return map;
  }, [ultimoApontamento]);

  const [respostas, setRespostas] = useState(respostasIniciais);
  const [fotos, setFotos] = useState<string[]>(ultimoApontamento?.fotos ?? []);
  const [observacoes, setObservacoes] = useState(ultimoApontamento?.observacoes ?? "");
  const [resultadoSalvo, setResultadoSalvo] = useState<ReturnType<typeof calcularStatus> | null>(null);

  if (!elemento || !servico) return notFound();

  const perguntasOrdenadas = [...perguntas].sort((a, b) => a.ordem - b.ordem);

  function handleSalvar() {
    const listaRespostas: Resposta[] = perguntasOrdenadas.map((p) => ({
      perguntaId: p.id,
      valor: respostas[p.id] ?? null,
    }));

    salvarApontamento({
      elementoId,
      servicoId,
      respostas: listaRespostas,
      fotos,
      observacoes,
      autor: "Apontador (protótipo)",
    });

    const resultado = calcularStatus(perguntasOrdenadas, {
      id: "preview",
      elementoId,
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
      <Link
        href={`/apontador/${obraId}/${elementoId}`}
        className="flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronLeft className="size-4" />
        Voltar aos serviços
      </Link>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">{servico.nome}</h1>
        <p className="text-sm text-muted-foreground">{elemento.nome}</p>
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
            <Button onClick={() => router.push(`/apontador/${obraId}/${elementoId}`)}>
              Concluir
            </Button>
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
    </div>
  );
}
