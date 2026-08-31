"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, ChevronUp, Copy, Link2, ListChecks, Loader2, Plus, Trash2 } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { nomeDuplicado } from "@/lib/utils";
import { descendentes, servicosDoSubtree } from "@/lib/planejamento";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Etapa } from "@/lib/types";

function EtapaNode({
  etapa,
  todasEtapas,
  nivel,
  onEditarPredecessoras,
  onAskRemove,
}: {
  etapa: Etapa;
  todasEtapas: Etapa[];
  nivel: number;
  onEditarPredecessoras: (etapa: Etapa) => void;
  onAskRemove: (etapa: Etapa) => void;
}) {
  const servicos = useFullKitStore((s) => s.servicos);
  const updateEtapa = useFullKitStore((s) => s.updateEtapa);
  const addEtapa = useFullKitStore((s) => s.addEtapa);
  const reorderEtapa = useFullKitStore((s) => s.reorderEtapa);
  const duplicarEtapa = useFullKitStore((s) => s.duplicarEtapa);

  const [nome, setNome] = useState(etapa.nome);
  const [erro, setErro] = useState<string | null>(null);
  const [expandido, setExpandido] = useState(true);
  const [mostrarNovaSub, setMostrarNovaSub] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [erroNovo, setErroNovo] = useState<string | null>(null);
  const [duplicando, setDuplicando] = useState(false);

  const irmas = todasEtapas
    .filter((e) => e.etapaPaiId === etapa.etapaPaiId && e.obraId === etapa.obraId)
    .sort((a, b) => a.ordem - b.ordem);
  const index = irmas.findIndex((e) => e.id === etapa.id);
  const filhas = todasEtapas.filter((e) => e.etapaPaiId === etapa.id).sort((a, b) => a.ordem - b.ordem);
  const servicosDiretos = servicos.filter((sv) => sv.etapaId === etapa.id);
  const totalServicosSubtree = servicosDoSubtree(etapa.id, todasEtapas, servicos).length;

  async function handleBlur() {
    const trimmed = nome.trim();
    if (!trimmed) {
      setErro("Nome não pode ficar vazio.");
      return;
    }
    if (nomeDuplicado(trimmed, irmas.filter((e) => e.id !== etapa.id).map((e) => e.nome))) {
      setErro("Já existe uma etapa com esse nome neste nível.");
      return;
    }
    setErro(null);
    if (trimmed !== etapa.nome) {
      try {
        await updateEtapa(etapa.id, { nome: trimmed });
      } catch {
        // erro já mostrado pelo store
      }
    }
  }

  async function handleDuplicar() {
    setDuplicando(true);
    try {
      await duplicarEtapa(etapa.id);
      toast.success("Etapa duplicada");
    } catch {
      // erro já mostrado pelo store
    } finally {
      setDuplicando(false);
    }
  }

  async function handleCriarSub() {
    const trimmed = novoNome.trim();
    if (!trimmed) {
      setErroNovo("Nome não pode ficar vazio.");
      return;
    }
    if (nomeDuplicado(trimmed, filhas.map((e) => e.nome))) {
      setErroNovo("Já existe uma sub-etapa com esse nome aqui.");
      return;
    }
    try {
      await addEtapa(etapa.obraId, trimmed, etapa.id);
      setNovoNome("");
      setErroNovo(null);
      setMostrarNovaSub(false);
      setExpandido(true);
      toast.success("Sub-etapa criada");
    } catch {
      // erro já mostrado pelo store
    }
  }

  return (
    <div style={{ marginLeft: nivel > 0 ? 24 : 0 }} className="space-y-2">
      <div className="rounded-[10px] border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          {filhas.length > 0 ? (
            <Button variant="ghost" size="icon" className="size-6" onClick={() => setExpandido((v) => !v)}>
              {expandido ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            </Button>
          ) : (
            <span className="size-6" />
          )}
          <div className="flex flex-col gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              disabled={index === 0}
              onClick={() => reorderEtapa(etapa.id, "subir")}
            >
              <ChevronUp className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              disabled={index === irmas.length - 1}
              onClick={() => reorderEtapa(etapa.id, "descer")}
            >
              <ChevronDown className="size-3.5" />
            </Button>
          </div>
          <Input className="flex-1" value={nome} onChange={(e) => setNome(e.target.value)} onBlur={handleBlur} />
          <span className="text-xs text-muted-foreground whitespace-nowrap px-1">
            {totalServicosSubtree} serviço{totalServicosSubtree === 1 ? "" : "s"}
          </span>
          <Button variant="secondary" size="sm" onClick={() => onEditarPredecessoras(etapa)}>
            <Link2 data-icon="inline-start" className="size-3.5" />
            Predecessoras ({etapa.predecessorasIds.length})
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMostrarNovaSub((v) => !v)}>
            <Plus data-icon="inline-start" className="size-3.5" />
            Sub-etapa
          </Button>
          {servicosDiretos.length > 0 || filhas.length === 0 ? (
            <Link
              href={`/config/${etapa.obraId}/servicos/${etapa.id}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap"
            >
              <ListChecks className="size-3.5" />
              Serviços
            </Link>
          ) : null}
          <Button variant="ghost" size="icon" onClick={handleDuplicar} disabled={duplicando} title="Duplicar">
            {duplicando ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onAskRemove(etapa)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
        {erro && <p className="text-xs text-destructive pl-9 pt-1">{erro}</p>}

        {mostrarNovaSub && (
          <div className="flex gap-2 pt-2 pl-9">
            <div className="flex-1 space-y-1.5">
              <Input
                placeholder="Nome da sub-etapa"
                value={novoNome}
                onChange={(e) => {
                  setNovoNome(e.target.value);
                  setErroNovo(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleCriarSub()}
                autoFocus
              />
              {erroNovo && <p className="text-xs text-destructive">{erroNovo}</p>}
            </div>
            <Button size="sm" onClick={handleCriarSub} disabled={!novoNome.trim()}>
              Adicionar
            </Button>
          </div>
        )}
      </div>

      {expandido && filhas.length > 0 && (
        <div className="space-y-2 border-l pl-2">
          {filhas.map((filha) => (
            <EtapaNode
              key={filha.id}
              etapa={filha}
              todasEtapas={todasEtapas}
              nivel={nivel + 1}
              onEditarPredecessoras={onEditarPredecessoras}
              onAskRemove={onAskRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function EtapasPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = useFullKitStore((s) => s.obras.find((o) => o.id === obraId));
  const etapas = useFullKitStore(useShallow((s) => s.etapas.filter((e) => e.obraId === obraId)));
  const servicos = useFullKitStore((s) => s.servicos);
  const perguntas = useFullKitStore((s) => s.perguntas);
  const apontamentos = useFullKitStore((s) => s.apontamentos);
  const addEtapa = useFullKitStore((s) => s.addEtapa);
  const updateEtapa = useFullKitStore((s) => s.updateEtapa);
  const removeEtapa = useFullKitStore((s) => s.removeEtapa);

  const [nome, setNome] = useState("");
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [etapaParaExcluir, setEtapaParaExcluir] = useState<Etapa | null>(null);
  const [editandoPredecessoras, setEditandoPredecessoras] = useState<Etapa | null>(null);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());

  if (!obra) return notFound();

  const etapasRaiz = etapas.filter((e) => !e.etapaPaiId).sort((a, b) => a.ordem - b.ordem);

  async function handleCriarRaiz() {
    const trimmed = nome.trim();
    if (!trimmed) {
      setErroNome("Nome não pode ficar vazio.");
      return;
    }
    if (nomeDuplicado(trimmed, etapasRaiz.map((e) => e.nome))) {
      setErroNome("Já existe uma etapa com esse nome na raiz.");
      return;
    }
    try {
      await addEtapa(obraId, trimmed);
      setNome("");
      setErroNome(null);
      toast.success("Etapa criada");
    } catch {
      // erro já mostrado pelo store
    }
  }

  function abrirPredecessoras(etapa: Etapa) {
    setEditandoPredecessoras(etapa);
    setSelecionadas(new Set(etapa.predecessorasIds));
  }

  async function salvarPredecessoras() {
    if (!editandoPredecessoras) return;
    try {
      await updateEtapa(editandoPredecessoras.id, { predecessorasIds: Array.from(selecionadas) });
      setEditandoPredecessoras(null);
      toast.success("Predecessoras atualizadas");
    } catch {
      // erro já mostrado pelo store
    }
  }

  function descreverExclusao(etapa: Etapa) {
    const subEtapas = descendentes(etapa.id, etapas);
    const servicosSubtree = servicosDoSubtree(etapa.id, etapas, servicos);
    const servicoIds = new Set(servicosSubtree.map((sv) => sv.id));
    const nPerguntas = perguntas.filter((p) => servicoIds.has(p.servicoId)).length;
    const nApontamentos = apontamentos.filter((a) => servicoIds.has(a.servicoId)).length;

    const partes = [
      subEtapas.length > 0 && `${subEtapas.length} sub-etapa${subEtapas.length === 1 ? "" : "s"}`,
      servicosSubtree.length > 0 && `${servicosSubtree.length} serviço${servicosSubtree.length === 1 ? "" : "s"}`,
      nPerguntas > 0 && `${nPerguntas} pergunta${nPerguntas === 1 ? "" : "s"}`,
      nApontamentos > 0 && `${nApontamentos} apontamento${nApontamentos === 1 ? "" : "s"}`,
    ].filter(Boolean) as string[];

    if (partes.length === 0) {
      return `Tem certeza que deseja excluir a etapa "${etapa.nome}"? Essa ação não pode ser desfeita.`;
    }
    return `Excluir a etapa "${etapa.nome}" também vai excluir ${partes.join(", ")}. Essa ação não pode ser desfeita.`;
  }

  const candidatasPredecessora = editandoPredecessoras
    ? etapas.filter((e) => {
        if (e.id === editandoPredecessoras.id) return false;
        const idsDescendentes = new Set(descendentes(editandoPredecessoras.id, etapas).map((d) => d.id));
        return !idsDescendentes.has(e.id);
      })
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-foreground">Etapas — {obra.nome}</h1>
        <p className="text-sm text-muted-foreground">
          Fluxo executivo em árvore: uma etapa pode ter sub-etapas, e só é liberada quando suas
          predecessoras estiverem 100% concluídas.
        </p>
      </div>

      <Card className="rounded-[14px]">
        <CardHeader>
          <CardTitle className="text-base">Fluxo executivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {etapasRaiz.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">Nenhuma etapa cadastrada ainda.</p>
          )}
          {etapasRaiz.map((etapa) => (
            <EtapaNode
              key={etapa.id}
              etapa={etapa}
              todasEtapas={etapas}
              nivel={0}
              onEditarPredecessoras={abrirPredecessoras}
              onAskRemove={setEtapaParaExcluir}
            />
          ))}

          <div className="flex gap-2 pt-2">
            <div className="flex-1 space-y-1.5">
              <Input
                placeholder="Nome da nova etapa raiz (ex: Sapata S103@S107)"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setErroNome(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleCriarRaiz()}
              />
              {erroNome && <p className="text-xs text-destructive">{erroNome}</p>}
            </div>
            <Button onClick={handleCriarRaiz} disabled={!nome.trim()}>
              <Plus data-icon="inline-start" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editandoPredecessoras !== null} onOpenChange={(open) => !open && setEditandoPredecessoras(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Predecessoras — {editandoPredecessoras?.nome}</DialogTitle>
            <DialogDescription>
              Essa etapa só fica liberada quando as etapas marcadas abaixo estiverem 100% concluídas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {candidatasPredecessora.map((e) => (
              <label key={e.id} className="flex items-center gap-2 rounded-md border p-2.5 text-sm">
                <Checkbox
                  checked={selecionadas.has(e.id)}
                  onCheckedChange={(checked) =>
                    setSelecionadas((prev) => {
                      const novo = new Set(prev);
                      if (checked) novo.add(e.id);
                      else novo.delete(e.id);
                      return novo;
                    })
                  }
                />
                {e.nome}
              </label>
            ))}
            {candidatasPredecessora.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">Não há outras etapas disponíveis.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditandoPredecessoras(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarPredecessoras}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {etapaParaExcluir && (
        <ConfirmDialog
          open={etapaParaExcluir !== null}
          onOpenChange={(open) => !open && setEtapaParaExcluir(null)}
          title="Excluir etapa"
          description={descreverExclusao(etapaParaExcluir)}
          onConfirm={async () => {
            try {
              await removeEtapa(etapaParaExcluir.id);
              toast.success("Etapa excluída");
            } catch {
              // erro já mostrado pelo store
            }
          }}
        />
      )}
    </div>
  );
}
