"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Building2, ClipboardList, Copy, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { nomeDuplicado } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { Obra } from "@/lib/types";

export default function ObrasPage() {
  const router = useRouter();
  const obras = useFullKitStore((s) => s.obras);
  const etapas = useFullKitStore((s) => s.etapas);
  const servicos = useFullKitStore((s) => s.servicos);
  const perguntas = useFullKitStore((s) => s.perguntas);
  const apontamentos = useFullKitStore((s) => s.apontamentos);
  const addObra = useFullKitStore((s) => s.addObra);
  const updateObra = useFullKitStore((s) => s.updateObra);
  const removeObra = useFullKitStore((s) => s.removeObra);
  const duplicarObra = useFullKitStore((s) => s.duplicarObra);

  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [erroNome, setErroNome] = useState<string | null>(null);

  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEndereco, setEditEndereco] = useState("");
  const [editErro, setEditErro] = useState<string | null>(null);

  const [obraParaExcluir, setObraParaExcluir] = useState<Obra | null>(null);

  const [obraParaDuplicar, setObraParaDuplicar] = useState<Obra | null>(null);
  const [nomeDuplicar, setNomeDuplicar] = useState("");
  const [erroDuplicar, setErroDuplicar] = useState<string | null>(null);
  const [duplicando, setDuplicando] = useState(false);

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

  function abrirDuplicacao(e: MouseEvent, obra: Obra) {
    e.preventDefault();
    e.stopPropagation();
    setObraParaDuplicar(obra);
    setNomeDuplicar(`${obra.nome} (cópia)`);
    setErroDuplicar(null);
  }

  async function confirmarDuplicacao() {
    if (!obraParaDuplicar) return;
    const trimmed = nomeDuplicar.trim();
    if (!trimmed) {
      setErroDuplicar("Informe um nome para a obra nova.");
      return;
    }
    if (nomeDuplicado(trimmed, obras.map((o) => o.nome))) {
      setErroDuplicar("Já existe uma obra com esse nome.");
      return;
    }
    setDuplicando(true);
    try {
      const novaObra = await duplicarObra(obraParaDuplicar.id, trimmed);
      setObraParaDuplicar(null);
      toast.success("Obra duplicada");
      router.push(`/config/${novaObra.id}`);
    } catch {
      // erro já mostrado pelo store
    } finally {
      setDuplicando(false);
    }
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
    <div className="flex flex-col gap-5.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-bold tracking-tight text-foreground">Obras e etapas</h1>
          <p className="text-sm text-muted-foreground">
            Configure o fluxo executivo, os serviços notáveis e os checklists de cada obra.
          </p>
        </div>
      </div>

      <Link
        href="/config/full-kits"
        className={buttonVariants({ variant: "outline", className: "h-auto justify-start p-4" })}
      >
        <ClipboardList className="size-4" />
        <div className="text-left">
          <div className="font-medium">Catálogo de FULL KITs</div>
          <div className="text-xs font-normal text-muted-foreground">
            Checklists padrão, cadastrados uma vez e usados ao montar o fluxo de qualquer obra
          </div>
        </div>
      </Link>

      <div className="grid gap-4 sm:grid-cols-2">
        {obras.map((obra) => {
          const etapasDaObra = etapas.filter((e) => e.obraId === obra.id);
          const idsEtapas = new Set(etapasDaObra.map((e) => e.id));
          const totalServicos = servicos.filter((sv) => idsEtapas.has(sv.etapaId)).length;
          const totalConcluidos = servicos.filter(
            (sv) => idsEtapas.has(sv.etapaId) && sv.concluidoEm
          ).length;
          const avancoObra = totalServicos > 0 ? Math.round((totalConcluidos / totalServicos) * 100) : 0;

          return (
            <div key={obra.id} className="overflow-hidden rounded-[14px] border border-border bg-card">
              <Link href={`/config/${obra.id}`} className="flex items-start gap-3.5 p-5.5 hover:bg-[oklch(0.985_0.004_155)]">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-tint">
                  <Building2 className="size-[18px] text-primary-tint-foreground" />
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <span className="block text-[15.5px] font-bold tracking-tight text-foreground">{obra.nome}</span>
                  <span className="block text-[12.5px] text-muted-foreground">
                    {obra.endereco || "Sem endereço cadastrado"}
                  </span>
                </div>
                <div className="flex shrink-0 gap-0.5 text-muted-foreground">
                  <Button variant="ghost" size="icon-sm" onClick={(e) => abrirEdicao(e, obra)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={(e) => abrirDuplicacao(e, obra)} title="Duplicar">
                    <Copy className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="hover:text-destructive"
                    onClick={(e) => abrirExclusao(e, obra)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </Link>
              <div className="flex border-t border-border bg-[oklch(0.985_0.003_155)]">
                <div className="flex flex-1 flex-col gap-0.5 px-5 py-3">
                  <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground/90 uppercase">
                    Etapas
                  </span>
                  <span className="text-[17px] font-bold tabular-nums text-foreground">{etapasDaObra.length}</span>
                </div>
                <div className="flex flex-1 flex-col gap-0.5 border-l border-border px-5 py-3">
                  <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground/90 uppercase">
                    Serviços
                  </span>
                  <span className="text-[17px] font-bold tabular-nums text-foreground">{totalServicos}</span>
                </div>
                <div className="flex flex-1 flex-col gap-0.5 border-l border-border px-5 py-3">
                  <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground/90 uppercase">
                    Avanço
                  </span>
                  <span className="text-[17px] font-bold tabular-nums text-primary">{avancoObra}%</span>
                </div>
                <Link
                  href={`/config/${obra.id}`}
                  className="flex items-center px-5 text-[12.5px] font-semibold text-foreground/80 hover:text-foreground"
                >
                  Configurar
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
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
            {erroNome && <p className="text-xs text-destructive">{erroNome}</p>}
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
              {editErro && <p className="text-xs text-destructive">{editErro}</p>}
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

      <Dialog open={obraParaDuplicar !== null} onOpenChange={(open) => !open && setObraParaDuplicar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar obra</DialogTitle>
            <DialogDescription>
              Cria uma obra nova com a mesma árvore de etapas, serviços e checklists de{" "}
              {obraParaDuplicar ? `"${obraParaDuplicar.nome}"` : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-sm font-normal">Nome da obra nova</Label>
            <Input
              value={nomeDuplicar}
              onChange={(e) => {
                setNomeDuplicar(e.target.value);
                setErroDuplicar(null);
              }}
            />
            {erroDuplicar && <p className="text-xs text-destructive">{erroDuplicar}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setObraParaDuplicar(null)} disabled={duplicando}>
              Cancelar
            </Button>
            <Button onClick={confirmarDuplicacao} disabled={duplicando}>
              {duplicando && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Duplicar
            </Button>
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
