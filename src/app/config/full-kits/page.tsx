"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, ClipboardList, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { nomeDuplicado } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
        <h1 className="text-[26px] font-bold tracking-tight text-foreground">Catálogo FULL KIT</h1>
        <p className="max-w-[620px] text-sm text-muted-foreground">
          Checklists padrão cadastrados uma vez. Ao montar o fluxo de uma obra, o serviço notável
          nasce com as perguntas prontas.
        </p>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {ordenados.length === 0 && (
          <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            Nenhum FULL KIT cadastrado ainda. Cadastre o primeiro no quadro abaixo.
          </p>
        )}
        {ordenados.map((fullKit) => {
          const nPerguntas = qtdPerguntas(fullKit.id);
          const nServicos = qtdServicos(fullKit.id);
          return (
            <Link
              key={fullKit.id}
              href={`/config/full-kits/${fullKit.id}`}
              className="flex flex-col gap-4 rounded-[14px] border border-border bg-card p-5.5 hover:bg-[oklch(0.985_0.004_155)]"
            >
              <div className="flex items-start justify-between gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary-tint text-primary-tint-foreground">
                  <ClipboardList className="size-[17px]" />
                </span>
                <div className="flex shrink-0 items-center gap-0.5 text-muted-foreground">
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
                    className="hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setParaExcluir(fullKit);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[15px] font-bold tracking-tight text-foreground">{fullKit.nome}</span>
                {fullKit.descricao && (
                  <span className="text-[12.5px] leading-relaxed text-muted-foreground">{fullKit.descricao}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex h-[22px] items-center rounded-full bg-[oklch(0.96_0.004_155)] px-2.5 text-[11.5px] font-semibold text-foreground/70">
                  {nPerguntas} pergunta{nPerguntas === 1 ? "" : "s"}
                </span>
                {nServicos > 0 && (
                  <span className="inline-flex h-[22px] items-center rounded-full bg-[oklch(0.96_0.004_155)] px-2.5 text-[11.5px] font-semibold text-foreground/70">
                    usado em {nServicos} serviço{nServicos === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </Link>
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
