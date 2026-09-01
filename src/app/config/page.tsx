"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, ClipboardList, Copy, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { nomeDuplicado } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { PageHeader } from "@/components/page-header";
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
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        eyebrow="Administração"
        title="Obras"
        description="Configure a estrutura das obras ou cadastre um novo ambiente operacional."
        actions={
          <Link href="/config/full-kits" className={buttonVariants({ variant: "outline" })}>
            <ClipboardList className="size-4" />
            Catálogo de FULL KITs
          </Link>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="min-w-0 space-y-4" aria-labelledby="obras-cadastradas">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="obras-cadastradas" className="font-semibold tracking-tight">Obras cadastradas</h2>
              <p className="text-xs text-muted-foreground">
                {obras.length} obra{obras.length === 1 ? " disponível" : "s disponíveis"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {obras.length === 0 && (
              <div className="rounded-xl border border-dashed bg-card p-8 text-center sm:col-span-2">
                <Building2 className="mx-auto mb-3 size-6 text-muted-foreground" />
                <p className="text-sm font-medium">Nenhuma obra cadastrada</p>
                <p className="mt-1 text-xs text-muted-foreground">Use o formulário ao lado para começar.</p>
              </div>
            )}
            {obras.map((obra) => (
              <Link key={obra.id} href={`/config/${obra.id}`} className="group">
                <Card className="h-full cursor-pointer transition-all hover:border-primary/60 hover:shadow-card">
                  <CardHeader className="flex-row items-start justify-between space-y-0">
                    <div className="min-w-0 space-y-2">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-primary-tint">
                        <Building2 className="size-[18px] text-primary-tint-foreground" />
                      </span>
                      <div className="space-y-1">
                        <CardTitle className="truncate">{obra.nome}</CardTitle>
                        <CardDescription className="line-clamp-2 text-xs">
                          {obra.endereco || "Endereço não cadastrado"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => abrirEdicao(e, obra)}
                        title="Editar obra"
                        aria-label={`Editar ${obra.nome}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => abrirDuplicacao(e, obra)}
                        title="Duplicar obra"
                        aria-label={`Duplicar ${obra.nome}`}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => abrirExclusao(e, obra)}
                        title="Excluir obra"
                        aria-label={`Excluir ${obra.nome}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <Card className="lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle className="text-base">Nova obra</CardTitle>
            <CardDescription>Cadastre o ambiente antes de montar etapas e serviços.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nova-obra-nome">Nome da obra</Label>
              <Input
                id="nova-obra-nome"
                placeholder="Ex.: Torre Norte"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setErroNome(null);
                }}
              />
              {erroNome && <p className="text-xs text-destructive">{erroNome}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nova-obra-endereco">Endereço</Label>
              <Input
                id="nova-obra-endereco"
                placeholder="Endereço da obra"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleCriar} disabled={!nome.trim()}>
              <Plus data-icon="inline-start" />
              Cadastrar obra
            </Button>
          </CardContent>
        </Card>
      </div>

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
