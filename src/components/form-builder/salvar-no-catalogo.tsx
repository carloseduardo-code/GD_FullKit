"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ClipboardList, Loader2 } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { nomeDuplicado } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Promove um checklist já montado numa obra a modelo do catálogo, para as próximas
// obras poderem escolhê-lo na hora de adicionar o serviço.
export function SalvarNoCatalogo({ servicoId, servicoNome }: { servicoId: string; servicoNome: string }) {
  const fullKits = useFullKitStore((s) => s.fullKits);
  const salvarServicoNoCatalogo = useFullKitStore((s) => s.salvarServicoNoCatalogo);

  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState(servicoNome);
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function abrir() {
    setNome(servicoNome);
    setDescricao("");
    setErro(null);
    setAberto(true);
  }

  async function salvar() {
    const trimmed = nome.trim();
    if (!trimmed) {
      setErro("Informe um nome para o FULL KIT.");
      return;
    }
    if (nomeDuplicado(trimmed, fullKits.map((fk) => fk.nome))) {
      setErro("Já existe um FULL KIT com esse nome no catálogo.");
      return;
    }
    setSalvando(true);
    try {
      await salvarServicoNoCatalogo(servicoId, trimmed, descricao.trim());
      setAberto(false);
      toast.success("FULL KIT salvo no catálogo");
    } catch {
      // erro já mostrado pelo store
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={abrir}>
        <ClipboardList data-icon="inline-start" />
        Salvar no catálogo
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar no catálogo</DialogTitle>
            <DialogDescription>
              Guarda este checklist como modelo para as próximas obras. Este serviço não é alterado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Nome no catálogo</Label>
              <Input
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setErro(null);
                }}
              />
              {erro && <p className="text-xs text-destructive">{erro}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Descrição (opcional)</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
