"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function SelecionarServicoPage() {
  const { obraId, elementoId } = useParams<{ obraId: string; elementoId: string }>();
  const obra = useFullKitStore((s) => s.obras.find((o) => o.id === obraId));
  const elemento = useFullKitStore((s) => s.elementos.find((e) => e.id === elementoId));
  const etapas = useFullKitStore(useShallow((s) => s.etapas.filter((e) => e.obraId === obraId)));
  const servicos = useFullKitStore((s) => s.servicos);
  const getStatusServico = useFullKitStore((s) => s.getStatusServico);

  if (!obra || !elemento) return notFound();

  const etapasOrdenadas = [...etapas].sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="space-y-5">
      <Link href={`/apontador/${obraId}`} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" />
        Trocar elemento
      </Link>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">{elemento.nome}</h1>
        <p className="text-sm text-muted-foreground">
          {elemento.tipo} · {obra.nome}
        </p>
      </div>

      <div className="space-y-6">
        {etapasOrdenadas.map((etapa) => {
          const servicosDaEtapa = servicos
            .filter((sv) => sv.etapaId === etapa.id)
            .sort((a, b) => a.ordem - b.ordem);
          if (servicosDaEtapa.length === 0) return null;

          return (
            <div key={etapa.id} className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">{etapa.nome}</h2>
              <div className="space-y-2">
                {servicosDaEtapa.map((servico) => {
                  const resultado = getStatusServico(elementoId, servico.id);
                  return (
                    <Link key={servico.id} href={`/apontador/${obraId}/${elementoId}/${servico.id}`}>
                      <Card className="transition-colors active:bg-accent">
                        <CardHeader className="flex-row items-center gap-3 space-y-0 py-3">
                          <div className="flex-1 space-y-1.5">
                            <CardTitle className="text-sm font-medium">{servico.nome}</CardTitle>
                            <StatusBadge status={resultado.status} />
                          </div>
                          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                        </CardHeader>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
