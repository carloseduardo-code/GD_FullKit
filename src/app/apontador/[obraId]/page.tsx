"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ListTree } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { progressoEtapa } from "@/lib/planejamento";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SelecionarEtapaRaizPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = useFullKitStore((s) => s.obras.find((o) => o.id === obraId));
  const etapas = useFullKitStore(useShallow((s) => s.etapas.filter((e) => e.obraId === obraId)));
  const servicos = useFullKitStore((s) => s.servicos);
  const getStatusServico = useFullKitStore((s) => s.getStatusServico);

  if (!obra) return notFound();

  const etapasRaiz = etapas.filter((e) => !e.etapaPaiId).sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="space-y-5">
      <Link href="/apontador" className="flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" />
        Trocar obra
      </Link>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">{obra.nome}</h1>
        <p className="text-sm text-muted-foreground">Selecione a etapa que você está executando.</p>
      </div>

      <div className="space-y-3">
        {etapasRaiz.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">Nenhuma etapa cadastrada nesta obra ainda.</p>
        )}
        {etapasRaiz.map((etapa) => {
          const progresso = progressoEtapa(etapa.id, etapas, servicos, getStatusServico);
          return (
            <Link key={etapa.id} href={`/apontador/${obraId}/etapa/${etapa.id}`}>
              <Card className="transition-colors active:bg-accent">
                <CardHeader className="flex-row items-center gap-3 space-y-0">
                  <ListTree className="size-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <CardTitle className="text-base">{etapa.nome}</CardTitle>
                    <CardDescription>{progresso.percentual}% concluído</CardDescription>
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
}
