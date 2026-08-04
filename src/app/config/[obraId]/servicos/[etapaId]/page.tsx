"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronDown, ChevronRight, ChevronUp, ListChecks, Plus, Trash2 } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ServicosPage() {
  const { obraId, etapaId } = useParams<{ obraId: string; etapaId: string }>();
  const obra = useFullKitStore((s) => s.obras.find((o) => o.id === obraId));
  const etapa = useFullKitStore((s) => s.etapas.find((e) => e.id === etapaId));
  const servicos = useFullKitStore(useShallow((s) => s.servicos.filter((sv) => sv.etapaId === etapaId)));
  const perguntas = useFullKitStore((s) => s.perguntas);
  const addServico = useFullKitStore((s) => s.addServico);
  const updateServico = useFullKitStore((s) => s.updateServico);
  const removeServico = useFullKitStore((s) => s.removeServico);
  const reorderServico = useFullKitStore((s) => s.reorderServico);

  const [nome, setNome] = useState("");

  if (!obra || !etapa) return notFound();

  const servicosOrdenados = [...servicos].sort((a, b) => a.ordem - b.ordem);

  function handleCriar() {
    if (!nome.trim()) return;
    addServico(etapaId, nome.trim());
    setNome("");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Serviços — {etapa.nome}
        </h1>
        <p className="text-muted-foreground">
          {obra.nome} · Cada serviço notável tem seu próprio FULL KIT (checklist).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Serviços notáveis desta etapa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {servicosOrdenados.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">Nenhum serviço cadastrado ainda.</p>
          )}
          {servicosOrdenados.map((servico, i) => {
            const qtdPerguntas = perguntas.filter((p) => p.servicoId === servico.id).length;
            return (
              <div key={servico.id} className="flex items-center gap-2 rounded-md border p-2.5">
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    disabled={i === 0}
                    onClick={() => reorderServico(servico.id, "subir")}
                  >
                    <ChevronUp className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    disabled={i === servicosOrdenados.length - 1}
                    onClick={() => reorderServico(servico.id, "descer")}
                  >
                    <ChevronDown className="size-3.5" />
                  </Button>
                </div>
                <Input
                  className="flex-1"
                  value={servico.nome}
                  onChange={(e) => updateServico(servico.id, { nome: e.target.value })}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap px-1">
                  {qtdPerguntas} pergunta{qtdPerguntas === 1 ? "" : "s"}
                </span>
                <Link
                  href={`/config/${obraId}/form-builder/${servico.id}`}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  <ListChecks data-icon="inline-start" />
                  FULL KIT
                  <ChevronRight data-icon="inline-end" />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-red-600"
                  onClick={() => removeServico(servico.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}

          <div className="flex gap-2 pt-2">
            <Input
              placeholder="Nome do novo serviço (ex: Armação)"
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
