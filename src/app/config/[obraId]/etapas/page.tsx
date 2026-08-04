"use client";

import { useState } from "react";
import { notFound, useParams } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EtapasPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = useFullKitStore((s) => s.obras.find((o) => o.id === obraId));
  const etapas = useFullKitStore(useShallow((s) => s.etapas.filter((e) => e.obraId === obraId)));
  const addEtapa = useFullKitStore((s) => s.addEtapa);
  const updateEtapa = useFullKitStore((s) => s.updateEtapa);
  const removeEtapa = useFullKitStore((s) => s.removeEtapa);
  const reorderEtapa = useFullKitStore((s) => s.reorderEtapa);

  const [nome, setNome] = useState("");

  if (!obra) return notFound();

  const etapasOrdenadas = [...etapas].sort((a, b) => a.ordem - b.ordem);

  function handleCriar() {
    if (!nome.trim()) return;
    addEtapa(obraId, nome.trim());
    setNome("");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Etapas — {obra.nome}</h1>
        <p className="text-muted-foreground">
          Defina o fluxo executivo da obra. A ordem aqui determina a sequência exibida ao apontador e à gestão.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fluxo executivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {etapasOrdenadas.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">Nenhuma etapa cadastrada ainda.</p>
          )}
          {etapasOrdenadas.map((etapa, i) => (
            <div key={etapa.id} className="flex items-center gap-2 rounded-md border p-2.5">
              <div className="flex flex-col gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={i === 0}
                  onClick={() => reorderEtapa(etapa.id, "subir")}
                >
                  <ChevronUp className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={i === etapasOrdenadas.length - 1}
                  onClick={() => reorderEtapa(etapa.id, "descer")}
                >
                  <ChevronDown className="size-3.5" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground w-5 text-center">{i + 1}</span>
              <Input
                className="flex-1"
                value={etapa.nome}
                onChange={(e) => updateEtapa(etapa.id, { nome: e.target.value })}
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-red-600"
                onClick={() => removeEtapa(etapa.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Input
              placeholder="Nome da nova etapa (ex: Concretagem)"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCriar()}
            />
            <Button onClick={handleCriar} disabled={!nome.trim()}>
              <Plus data-icon="inline-start" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
