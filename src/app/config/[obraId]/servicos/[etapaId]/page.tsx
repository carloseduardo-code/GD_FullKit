"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, ChevronUp, ListChecks, Plus, Trash2 } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { nomeDuplicado } from "@/lib/utils";
import { caminhoEtapa } from "@/lib/planejamento";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { ServicoNotavel } from "@/lib/types";

function ServicoRow({
  servico,
  obraId,
  isFirst,
  isLast,
  qtdPerguntas,
  outrosNomes,
  onMoveUp,
  onMoveDown,
  onRename,
  onAskRemove,
  onChangeDataInicio,
  onChangeDataFim,
}: {
  servico: ServicoNotavel;
  obraId: string;
  isFirst: boolean;
  isLast: boolean;
  qtdPerguntas: number;
  outrosNomes: string[];
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRename: (nome: string) => void;
  onAskRemove: () => void;
  onChangeDataInicio: (data: string) => void;
  onChangeDataFim: (data: string) => void;
}) {
  const [nome, setNome] = useState(servico.nome);
  const [erro, setErro] = useState<string | null>(null);

  function handleBlur() {
    const trimmed = nome.trim();
    if (!trimmed) {
      setErro("Nome não pode ficar vazio.");
      return;
    }
    if (nomeDuplicado(trimmed, outrosNomes)) {
      setErro("Já existe um serviço com esse nome nesta etapa.");
      return;
    }
    setErro(null);
    if (trimmed !== servico.nome) onRename(trimmed);
  }

  return (
    <div className="rounded-md border p-2.5">
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <Button variant="ghost" size="icon" className="size-6" disabled={isFirst} onClick={onMoveUp}>
            <ChevronUp className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-6" disabled={isLast} onClick={onMoveDown}>
            <ChevronDown className="size-3.5" />
          </Button>
        </div>
        <Input className="flex-1" value={nome} onChange={(e) => setNome(e.target.value)} onBlur={handleBlur} />
        <span className="text-xs text-muted-foreground whitespace-nowrap px-1">
          {qtdPerguntas} pergunta{qtdPerguntas === 1 ? "" : "s"}
        </span>
        <Link
          href={`/config/${obraId}/form-builder/${servico.id}`}
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          <ListChecks data-icon="inline-start" />
          FULL KIT
          <ChevronRight data-icon="inline-end" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-red-600"
          onClick={onAskRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {erro && <p className="text-xs text-red-600 pt-1 pl-9">{erro}</p>}
      <div className="flex flex-wrap items-center gap-3 pl-9 pt-2">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Início previsto
          <Input
            type="date"
            className="h-7 w-auto text-xs"
            value={servico.dataInicioPrevista ?? ""}
            onChange={(e) => onChangeDataInicio(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Fim previsto
          <Input
            type="date"
            className="h-7 w-auto text-xs"
            value={servico.dataFimPrevista ?? ""}
            onChange={(e) => onChangeDataFim(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

export default function ServicosPage() {
  const { obraId, etapaId } = useParams<{ obraId: string; etapaId: string }>();
  const obra = useFullKitStore((s) => s.obras.find((o) => o.id === obraId));
  const etapa = useFullKitStore((s) => s.etapas.find((e) => e.id === etapaId));
  const etapasDaObra = useFullKitStore(useShallow((s) => s.etapas.filter((e) => e.obraId === obraId)));
  const servicos = useFullKitStore(useShallow((s) => s.servicos.filter((sv) => sv.etapaId === etapaId)));
  const perguntas = useFullKitStore((s) => s.perguntas);
  const apontamentos = useFullKitStore((s) => s.apontamentos);
  const addServico = useFullKitStore((s) => s.addServico);
  const updateServico = useFullKitStore((s) => s.updateServico);
  const removeServico = useFullKitStore((s) => s.removeServico);
  const reorderServico = useFullKitStore((s) => s.reorderServico);

  const [nome, setNome] = useState("");
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [servicoParaExcluir, setServicoParaExcluir] = useState<ServicoNotavel | null>(null);

  if (!obra || !etapa) return notFound();

  const servicosOrdenados = [...servicos].sort((a, b) => a.ordem - b.ordem);

  async function handleCriar() {
    const trimmed = nome.trim();
    if (!trimmed) {
      setErroNome("Nome não pode ficar vazio.");
      return;
    }
    if (nomeDuplicado(trimmed, servicos.map((sv) => sv.nome))) {
      setErroNome("Já existe um serviço com esse nome nesta etapa.");
      return;
    }
    try {
      await addServico(etapaId, trimmed);
      setNome("");
      setErroNome(null);
      toast.success("Serviço criado");
    } catch {
      // erro já mostrado pelo store
    }
  }

  function descreverExclusao(servico: ServicoNotavel) {
    const nPerguntas = perguntas.filter((p) => p.servicoId === servico.id).length;
    const nApontamentos = apontamentos.filter((a) => a.servicoId === servico.id).length;

    const partes = [
      nPerguntas > 0 && `${nPerguntas} pergunta${nPerguntas === 1 ? "" : "s"} do FULL KIT`,
      nApontamentos > 0 && `${nApontamentos} apontamento${nApontamentos === 1 ? "" : "s"}`,
    ].filter(Boolean) as string[];

    if (partes.length === 0) {
      return `Tem certeza que deseja excluir o serviço "${servico.nome}"? Essa ação não pode ser desfeita.`;
    }
    return `Excluir o serviço "${servico.nome}" também vai excluir ${partes.join(" e ")}. Essa ação não pode ser desfeita.`;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-muted-foreground">
          {caminhoEtapa(etapaId, etapasDaObra).map((e) => e.nome).join(" › ")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Serviços — {etapa.nome}
        </h1>
        <p className="text-muted-foreground">
          {obra.nome} · Cada serviço notável tem seu próprio FULL KIT (checklist).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Serviços notáveis desta etapa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {servicosOrdenados.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">Nenhum serviço cadastrado ainda.</p>
          )}
          {servicosOrdenados.map((servico, i) => (
            <ServicoRow
              key={servico.id}
              servico={servico}
              obraId={obraId}
              isFirst={i === 0}
              isLast={i === servicosOrdenados.length - 1}
              qtdPerguntas={perguntas.filter((p) => p.servicoId === servico.id).length}
              outrosNomes={servicosOrdenados.filter((sv) => sv.id !== servico.id).map((sv) => sv.nome)}
              onMoveUp={() => reorderServico(servico.id, "subir")}
              onMoveDown={() => reorderServico(servico.id, "descer")}
              onRename={(novoNome) => updateServico(servico.id, { nome: novoNome })}
              onAskRemove={() => setServicoParaExcluir(servico)}
              onChangeDataInicio={(data) => updateServico(servico.id, { dataInicioPrevista: data || undefined })}
              onChangeDataFim={(data) => updateServico(servico.id, { dataFimPrevista: data || undefined })}
            />
          ))}

          <div className="flex gap-2 pt-2">
            <div className="flex-1 space-y-1.5">
              <Input
                placeholder="Nome do novo serviço (ex: Armação)"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setErroNome(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleCriar()}
              />
              {erroNome && <p className="text-xs text-red-600">{erroNome}</p>}
            </div>
            <Button onClick={handleCriar} disabled={!nome.trim()}>
              <Plus data-icon="inline-start" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {servicoParaExcluir && (
        <ConfirmDialog
          open={servicoParaExcluir !== null}
          onOpenChange={(open) => !open && setServicoParaExcluir(null)}
          title="Excluir serviço"
          description={descreverExclusao(servicoParaExcluir)}
          onConfirm={async () => {
            try {
              await removeServico(servicoParaExcluir.id);
              toast.success("Serviço excluído");
            } catch {
              // erro já mostrado pelo store
            }
          }}
        />
      )}
    </div>
  );
}
