"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { nomeDuplicado } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Obra } from "@/lib/types";

export default function ObrasPage() {
  const obras = useFullKitStore((s) => s.obras);
  const etapas = useFullKitStore((s) => s.etapas);
  const servicos = useFullKitStore((s) => s.servicos);
  const perguntas = useFullKitStore((s) => s.perguntas);
  const apontamentos = useFullKitStore((s) => s.apontamentos);
  const addObra = useFullKitStore((s) => s.addObra);
  const updateObra = useFullKitStore((s) => s.updateObra);
  const removeObra = useFullKitStore((s) => s.removeObra);

  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [erroNome, setErroNome] = useState<string | null>(null);

  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEndereco, setEditEndereco] = useState("");
  const [editErro, setEditErro] = useState<string | null>(null);

  const [obraParaExcluir, setObraParaExcluir] = useState<Obra | null>(null);

  async function handleCriar() {
    const trimmed = nome.trim();
    if (!trimmed) {
      setErroNome("Informe um nome para a obra.");
      return;
    }
    if (nomeDuplicado(trimmed, obras.map((o) => o.nome))) {
      setErroNome("Já existe uma obra com esse nome.");
      return;
    }
    try {
      await addObra(trimmed, endereco.trim());
      setNome("");
      setEndereco("");
      setErroNome(null);
      toast.success("Obra cadastrada");
    } catch {
      // erro já mostrado pelo store
    }
  }

  function abrirEdicao(e: MouseEvent, obra: Obra) {
    e.preventDefault();
    e.stopPropagation();
    setEditingObra(obra);
    setEditNome(obra.nome);
    setEditEndereco(obra.endereco);
    setEditErro(null);
  }

  async function salvarEdicao() {
    if (!editingObra) return;
    const trimmed = editNome.trim();
    if (!trimmed) {
      setEditErro("Informe um nome para a obra.");
      return;
    }
    if (nomeDuplicado(trimmed, obras.filter((o) => o.id !== editingObra.id).map((o) => o.nome))) {
      setEditErro("Já existe uma obra com esse nome.");
      return;
    }
    try {
      await updateObra(editingObra.id, { nome: trimmed, endereco: editEndereco.trim() });
      setEditingObra(null);
      toast.success("Obra atualizada");
    } catch {
      // erro já mostrado pelo store
    }
  }

  function abrirExclusao(e: MouseEvent, obra: Obra) {
    e.preventDefault();
    e.stopPropagation();
    setObraParaExcluir(obra);
  }

  function descreverExclusao(obra: Obra) {
    const etapaIds = new Set(etapas.filter((et) => et.obraId === obra.id).map((et) => et.id));
    const nEtapas = etapaIds.size;
    const servicosDaObra = servicos.filter((sv) => etapaIds.has(sv.etapaId));
    const servicoIds = new Set(servicosDaObra.map((sv) => sv.id));
    const nServicos = servicosDaObra.length;
    const nPerguntas = perguntas.filter((p) => servicoIds.has(p.servicoId)).length;
    const nApontamentos = apontamentos.filter((a) => servicoIds.has(a.servicoId)).length;

    const partes = [
      nEtapas > 0 && `${nEtapas} etapa${nEtapas === 1 ? "" : "s"}`,
      nServicos > 0 && `${nServicos} serviço${nServicos === 1 ? "" : "s"}`,
      nPerguntas > 0 && `${nPerguntas} pergunta${nPerguntas === 1 ? "" : "s"}`,
      nApontamentos > 0 && `${nApontamentos} apontamento${nApontamentos === 1 ? "" : "s"}`,
    ].filter(Boolean) as string[];

    if (partes.length === 0) {
      return `Tem certeza que deseja excluir a obra "${obra.nome}"? Essa ação não pode ser desfeita.`;
    }
    return `Excluir a obra "${obra.nome}" também vai excluir ${partes.join(", ")} registrados nela. Essa ação não pode ser desfeita.`;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Obras</h1>
        <p className="text-muted-foreground">Selecione uma obra para configurar ou cadastre uma nova.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {obras.map((obra) => (
          <Link key={obra.id} href={`/config/${obra.id}`}>
            <Card className="h-full transition-all hover:border-primary hover:bg-accent/40 hover:shadow-md cursor-pointer">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="space-y-1.5">
                  <Building2 className="size-5 text-primary" />
                  <CardTitle>{obra.nome}</CardTitle>
                  <CardDescription>{obra.endereco || "Sem endereço cadastrado"}</CardDescription>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon-sm" onClick={(e) => abrirEdicao(e, obra)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-red-600"
                    onClick={(e) => abrirExclusao(e, obra)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Nova obra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Input
              placeholder="Nome da obra"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setErroNome(null);
              }}
            />
            {erroNome && <p className="text-xs text-red-600">{erroNome}</p>}
          </div>
          <Input placeholder="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          <Button onClick={handleCriar} disabled={!nome.trim()}>
            <Plus data-icon="inline-start" />
            Cadastrar obra
          </Button>
        </CardContent>
      </Card>

      <Dialog open={editingObra !== null} onOpenChange={(open) => !open && setEditingObra(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar obra</DialogTitle>
            <DialogDescription>Atualize o nome e o endereço da obra.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Nome</Label>
              <Input
                value={editNome}
                onChange={(e) => {
                  setEditNome(e.target.value);
                  setEditErro(null);
                }}
              />
              {editErro && <p className="text-xs text-red-600">{editErro}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Endereço</Label>
              <Input value={editEndereco} onChange={(e) => setEditEndereco(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingObra(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarEdicao}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {obraParaExcluir && (
        <ConfirmDialog
          open={obraParaExcluir !== null}
          onOpenChange={(open) => !open && setObraParaExcluir(null)}
          title="Excluir obra"
          description={descreverExclusao(obraParaExcluir)}
          onConfirm={async () => {
            try {
              await removeObra(obraParaExcluir.id);
              toast.success("Obra excluída");
            } catch {
              // erro já mostrado pelo store
            }
          }}
        />
      )}
    </div>
  );
}
