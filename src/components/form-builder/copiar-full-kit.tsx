"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CopyPlus, Loader2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useFullKitStore } from "@/lib/store";
import { modelosDeFullKit } from "@/lib/replicacao";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Aparece só enquanto o serviço está sem perguntas: um atalho para trazer o mesmo
// checklist já montado em outra obra, em vez de digitar tudo de novo.
export function CopiarFullKit({
  servicoId,
  servicoNome,
  obraId,
}: {
  servicoId: string;
  servicoNome: string;
  obraId: string;
}) {
  const dados = useFullKitStore(
    useShallow((s) => ({ obras: s.obras, etapas: s.etapas, servicos: s.servicos, perguntas: s.perguntas }))
  );
  const copiarFullKit = useFullKitStore((s) => s.copiarFullKit);

  const modelos = modelosDeFullKit(servicoNome, obraId, dados);
  const [escolhido, setEscolhido] = useState(modelos[0]?.servico.id ?? "");
  const [copiando, setCopiando] = useState(false);

  if (modelos.length === 0) return null;

  const selecionado = modelos.find((m) => m.servico.id === escolhido) ?? modelos[0];

  async function handleCopiar() {
    setCopiando(true);
    try {
      const qtd = await copiarFullKit(servicoId, selecionado.servico.id);
      toast.success(`${qtd} pergunta${qtd === 1 ? "" : "s"} copiada${qtd === 1 ? "" : "s"} de ${selecionado.obra.nome}`);
    } catch {
      // erro já mostrado pelo store
    } finally {
      setCopiando(false);
    }
  }

  return (
    <div className="rounded-md border border-dashed p-3 space-y-3">
      <p className="text-sm">
        Este serviço já está montado em outra obra. Quer trazer o mesmo FULL KIT para cá?
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={selecionado.servico.id} onValueChange={(v) => setEscolhido(v ?? "")}>
          <SelectTrigger className="w-72">
            <SelectValue>
              {(v: string) => {
                const m = modelos.find((op) => op.servico.id === v) ?? selecionado;
                return `${m.obra.nome} (${m.qtdPerguntas} pergunta${m.qtdPerguntas === 1 ? "" : "s"})`;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {modelos.map((m) => (
              <SelectItem key={m.servico.id} value={m.servico.id}>
                {m.obra.nome} ({m.qtdPerguntas} pergunta{m.qtdPerguntas === 1 ? "" : "s"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="secondary" onClick={handleCopiar} disabled={copiando}>
          {copiando ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <CopyPlus data-icon="inline-start" />}
          Copiar FULL KIT
        </Button>
      </div>
    </div>
  );
}
