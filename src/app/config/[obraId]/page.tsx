"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronRight, ListChecks, MapPin } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { servicosDoSubtree } from "@/lib/planejamento";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default function ObraOverviewPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = useFullKitStore((s) => s.obras.find((o) => o.id === obraId));
  const etapas = useFullKitStore(useShallow((s) => s.etapas.filter((e) => e.obraId === obraId)));
  const servicos = useFullKitStore((s) => s.servicos);

  if (!obra) return notFound();

  const etapasRaiz = etapas.filter((e) => !e.etapaPaiId).sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{obra.nome}</h1>
        {obra.endereco && (
          <p className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <MapPin className="size-3.5" />
            {obra.endereco}
          </p>
        )}
      </div>

      <Link href={`/config/${obraId}/etapas`} className={buttonVariants({ variant: "outline", className: "h-auto justify-start p-4" })}>
        <ListChecks className="size-4" />
        <div className="text-left">
          <div className="font-medium">Etapas</div>
          <div className="text-xs text-muted-foreground font-normal">
            {etapas.length} etapa{etapas.length === 1 ? "" : "s"} no fluxo executivo
          </div>
        </div>
      </Link>

      <div className="space-y-3">
        <h2 className="font-medium">Fluxo executivo</h2>
        {etapasRaiz.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma etapa cadastrada ainda. Comece em{" "}
            <Link href={`/config/${obraId}/etapas`} className="underline">
              Etapas
            </Link>
            .
          </p>
        )}
        <div className="space-y-3">
          {etapasRaiz.map((etapa) => {
            const filhas = etapas.filter((e) => e.etapaPaiId === etapa.id);
            const servicosSubtree = servicosDoSubtree(etapa.id, etapas, servicos);
            return (
              <Card key={etapa.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{etapa.nome}</CardTitle>
                    <CardDescription>
                      {filhas.length > 0
                        ? `${filhas.length} sub-etapa${filhas.length === 1 ? "" : "s"} · `
                        : ""}
                      {servicosSubtree.length} serviço{servicosSubtree.length === 1 ? " notável" : "s notáveis"}
                    </CardDescription>
                  </div>
                  <Link
                    href={`/config/${obraId}/etapas`}
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    Gerenciar
                    <ChevronRight data-icon="inline-end" />
                  </Link>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
