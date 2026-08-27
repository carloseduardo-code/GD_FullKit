"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CopyPlus, Loader2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useFullKitStore } from "@/lib/store";
import { obrasModelo, planejarReplicacao } from "@/lib/replicacao";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const QUALQUER = "qualquer";

export function ReplicarFullKitObra({ obraId }: { obraId: string }) {
  const dados = useFullKitStore(
    useShallow((s) => ({ obras: s.obras, etapas: s.etapas, servicos: s.servicos, perguntas: s.perguntas }))
  );
  const replicarFullKitsDaObra = useFullKitStore((s) => s.replicarFullKitsDaObra);

  const [obraModeloId, setObraModeloId] = useState(QUALQUER);
  const [replicando, setReplicando] = useState(false);

  const modelos = obrasModelo(obraId, dados);
  if (modelos.length === 0) return null;

  const modeloEscolhido = obraModeloId === QUALQUER ? undefined : obraModeloId;
  const plano = planejarReplicacao(obraId, dados, modeloEscolhido);

  async function handleReplicar() {
    setReplicando(true);
    try {
      const { servicos, perguntas } = await replicarFullKitsDaObra(obraId, modeloEscolhido);
      toast.success(
        `${servicos} serviço${servicos === 1 ? "" : "s"} preenchido${servicos === 1 ? "" : "s"} · ${perguntas} pergunta${perguntas === 1 ? "" : "s"} copiada${perguntas === 1 ? "" : "s"}`
      );
    } catch {
      // erro já mostrado pelo store
    } finally {
      setReplicando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preencher FULL KITs a partir de outra obra</CardTitle>
        <CardDescription>
          Copia o checklist dos serviços de mesmo nome de uma obra já configurada. Serviço que já tem
          perguntas não é alterado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={obraModeloId} onValueChange={(v) => setObraModeloId(v ?? QUALQUER)}>
            <SelectTrigger className="w-72">
              <SelectValue>
                {(v: string) =>
                  v === QUALQUER
                    ? "Qualquer obra já configurada"
                    : modelos.find((m) => m.obra.id === v)?.obra.nome ?? v
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={QUALQUER}>Qualquer obra já configurada</SelectItem>
              {modelos.map((m) => (
                <SelectItem key={m.obra.id} value={m.obra.id}>
                  {m.obra.nome} ({m.servicosComFullKit} com FULL KIT)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleReplicar} disabled={replicando || plano.copiar.length === 0}>
            {replicando ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <CopyPlus data-icon="inline-start" />}
            Preencher {plano.copiar.length} serviço{plano.copiar.length === 1 ? "" : "s"}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {plano.copiar.length} serviço{plano.copiar.length === 1 ? "" : "s"} vazio
          {plano.copiar.length === 1 ? "" : "s"} com correspondente ({plano.perguntasACopiar} pergunta
          {plano.perguntasACopiar === 1 ? "" : "s"}) · {plano.jaPreenchidos.length} já preenchido
          {plano.jaPreenchidos.length === 1 ? "" : "s"} · {plano.semModelo.length} sem correspondente
        </p>

        {plano.copiar.length > 0 && (
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-3">
            {plano.copiar.map((item) => (
              <div key={item.servico.id} className="text-sm">
                <span className="text-muted-foreground">{item.etapa} › </span>
                <span className="font-medium">{item.servico.nome}</span>
                <span className="text-muted-foreground">
                  {" "}
                  ← {item.modelo!.obra.nome} ({item.modelo!.qtdPerguntas} pergunta
                  {item.modelo!.qtdPerguntas === 1 ? "" : "s"})
                </span>
              </div>
            ))}
          </div>
        )}

        {plano.semModelo.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Sem correspondente em outra obra (continuam vazios):</p>
            <p className="text-sm text-muted-foreground">
              {plano.semModelo.map((item) => item.servico.nome).join(" · ")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
