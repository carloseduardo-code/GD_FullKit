"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronRight, Copy, ClipboardList, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { nomeDuplicado } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { FullKitModelo } from "@/lib/types";

export default function CatalogoPage() {
  const fullKits = useFullKitStore((s) => s.fullKits);
  const perguntasModelo = useFullKitStore((s) => s.perguntasModelo);
  const servicos = useFullKitStore((s) => s.servicos);
  const addFullKit = useFullKitStore((s) => s.addFullKit);
  const updateFullKit = useFullKitStore((s) => s.updateFullKit);
  const removeFullKit = useFullKitStore((s) => s.removeFullKit);
  const duplicarFullKit = useFullKitStore((s) => s.duplicarFullKit);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erroNome, setErroNome] = useState<string | null>(null);

  const [emEdicao, setEmEdicao] = useState<FullKitModelo | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editErro, setEditErro] = useState<string | null>(null);

  const [paraExcluir, setParaExcluir] = useState<FullKitModelo | null>(null);
  const [duplicando, setDuplicando] = useState<string | null>(null);

  const ordenados = [...fullKits].sort((a, b) => a.nome.localeCompare(b.nome));

  function qtdPerguntas(fullKitId: string) {
    return perguntasModelo.filter((p) => p.fullKitId === fullKitId).length;
  }

  function qtdServicos(fullKitId: string) {
    return servicos.filter((sv) => sv.fullKitId === fullKitId).length;
  }

  async function handleCriar() {
    const trimmed = nome.trim();
    if (!trimmed) {
      setErroNome("Informe um nome para o FULL KIT.");
      return;
    }
    if (nomeDuplicado(trimmed, fullKits.map((fk) => fk.nome))) {
      setErroNome("Já existe um FULL KIT com esse nome no catálogo.");
      return;
    }
    try {
      await addFullKit(trimmed, descricao.trim());
      setNome("");
      setDescricao("");
      setErroNome(null);
      toast.success("FULL KIT cadastrado");
    } catch {
      // erro já mostrado pelo store
    }
  }

  function abrirEdicao(e: MouseEvent, fullKit: FullKitModelo) {
    e.preventDefault();
    e.stopPropagation();
    setEmEdicao(fullKit);
    setEditNome(fullKit.nome);
    setEditDescricao(fullKit.descricao);
    setEditErro(null);
  }

  async function salvarEdicao() {
    if (!emEdicao) return;
    const trimmed = editNome.trim();
    if (!trimmed) {
      setEditErro("Informe um nome para o FULL KIT.");
      return;
    }
    if (nomeDuplicado(trimmed, fullKits.filter((fk) => fk.id !== emEdicao.id).map((fk) => fk.nome))) {
      setEditErro("Já existe um FULL KIT com esse nome no catálogo.");
      return;
    }
    try {
      await updateFullKit(emEdicao.id, { nome: trimmed, descricao: editDescricao.trim() });
      setEmEdicao(null);
      toast.success("FULL KIT atualizado");
    } catch {
      // erro já mostrado pelo store
    }
  }

  async function handleDuplicar(e: MouseEvent, fullKit: FullKitModelo) {
    e.preventDefault();
    e.stopPropagation();
    setDuplicando(fullKit.id);
    try {
      await duplicarFullKit(fullKit.id);
      toast.success("FULL KIT duplicado");
    } catch {
      // erro já mostrado pelo store
    } finally {
      setDuplicando(null);
    }
  }

  function descreverExclusao(fullKit: FullKitModelo) {
    const nServicos = qtdServicos(fullKit.id);
    const base = `Excluir "${fullKit.nome}" do catálogo. Essa ação não pode ser desfeita.`;
    if (nServicos === 0) return base;
    return `${base} Os ${nServicos} serviço${nServicos === 1 ? "" : "s"} que já foram criados a partir dele não são alterados — o checklist deles é uma cópia e continua na obra.`;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Catálogo de FULL KITs</h1>
        <p className="text-muted-foreground">
          Cadastre aqui os checklists padrão. Ao montar o fluxo de uma obra, o serviço notável é
          escolhido deste catálogo e já nasce com as perguntas prontas.
        </p>
      </div>

      <div className="space-y-2">
        {ordenados.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum FULL KIT cadastrado ainda. Cadastre o primeiro no quadro abaixo.
          </p>
        )}
        {ordenados.map((fullKit) => {
          const nPerguntas = qtdPerguntas(fullKit.id);
          const nServicos = qtdServicos(fullKit.id);
          return (
            <Card key={fullKit.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0 gap-3">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-base">{fullKit.nome}</CardTitle>
                  <CardDescription>
                    {nPerguntas} pergunta{nPerguntas === 1 ? "" : "s"}
                    {nServicos > 0 &&
                      ` · usado em ${nServicos} serviço${nServicos === 1 ? "" : "s"}`}
                    {fullKit.descricao && ` · ${fullKit.descricao}`}
                  </CardDescription>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/config/full-kits/${fullKit.id}`}
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    <ClipboardList data-icon="inline-start" />
                    Perguntas
                    <ChevronRight data-icon="inline-end" />
                  </Link>
                  <Button variant="ghost" size="icon-sm" onClick={(e) => abrirEdicao(e, fullKit)} title="Renomear">
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => handleDuplicar(e, fullKit)}
                    disabled={duplicando === fullKit.id}
                    title="Duplicar"
                  >
                    {duplicando === fullKit.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setParaExcluir(fullKit)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Novo FULL KIT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Input
              placeholder="Nome do serviço notável (ex: Escavação (m³))"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setErroNome(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCriar()}
            />
            {erroNome && <p className="text-xs text-destructive">{erroNome}</p>}
          </div>
          <Input
            placeholder="Descrição (opcional)"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
          <Button onClick={handleCriar} disabled={!nome.trim()}>
            <Plus data-icon="inline-start" />
            Cadastrar
          </Button>
        </CardContent>
      </Card>

      <Dialog open={emEdicao !== null} onOpenChange={(open) => !open && setEmEdicao(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar FULL KIT</DialogTitle>
            <DialogDescription>
              Renomear aqui não altera os serviços já criados a partir deste modelo.
            </DialogDescription>
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
              <Label className="text-sm font-normal">Descrição</Label>
              <Input value={editDescricao} onChange={(e) => setEditDescricao(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmEdicao(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarEdicao}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {paraExcluir && (
        <ConfirmDialog
          open={paraExcluir !== null}
          onOpenChange={(open) => !open && setParaExcluir(null)}
          title="Excluir do catálogo"
          description={descreverExclusao(paraExcluir)}
          onConfirm={async () => {
            try {
              await removeFullKit(paraExcluir.id);
              toast.success("FULL KIT excluído do catálogo");
            } catch {
              // erro já mostrado pelo store
            }
          }}
        />
      )}
    </div>
  );
}
