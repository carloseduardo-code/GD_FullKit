"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronRight, ListChecks, MapPin, Package } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export default function ObraOverviewPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = useFullKitStore((s) => s.obras.find((o) => o.id === obraId));
  const etapas = useFullKitStore(useShallow((s) => s.etapas.filter((e) => e.obraId === obraId)));
  const elementos = useFullKitStore(useShallow((s) => s.elementos.filter((e) => e.obraId === obraId)));
  const servicos = useFullKitStore((s) => s.servicos);

  if (!obra) return notFound();

  const etapasOrdenadas = [...etapas].sort((a, b) => a.ordem - b.ordem);

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

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href={`/config/${obraId}/elementos`} className={buttonVariants({ variant: "outline", className: "h-auto justify-start p-4" })}>
          <Package className="size-4" />
          <div className="text-left">
            <div className="font-medium">Elementos</div>
            <div className="text-xs text-muted-foreground font-normal">
              {elementos.length} cadastrado{elementos.length === 1 ? "" : "s"}
            </div>
          </div>
        </Link>
        <Link href={`/config/${obraId}/etapas`} className={buttonVariants({ variant: "outline", className: "h-auto justify-start p-4" })}>
          <ListChecks className="size-4" />
          <div className="text-left">
            <div className="font-medium">Etapas</div>
            <div className="text-xs text-muted-foreground font-normal">
              {etapas.length} etapa{etapas.length === 1 ? "" : "s"} no fluxo executivo
            </div>
          </div>
        </Link>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium">Fluxo executivo</h2>
        {etapasOrdenadas.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma etapa cadastrada ainda. Comece em{" "}
            <Link href={`/config/${obraId}/etapas`} className="underline">
              Etapas
            </Link>
            .
          </p>
        )}
        <div className="space-y-3">
          {etapasOrdenadas.map((etapa) => {
            const servicosDaEtapa = servicos
              .filter((sv) => sv.etapaId === etapa.id)
              .sort((a, b) => a.ordem - b.ordem);
            return (
              <Card key={etapa.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{etapa.nome}</CardTitle>
                    <CardDescription>
                      {servicosDaEtapa.length} serviço{servicosDaEtapa.length === 1 ? " notável" : "s notáveis"}
                    </CardDescription>
                  </div>
                  <Link
                    href={`/config/${obraId}/servicos/${etapa.id}`}
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    Gerenciar serviços
                    <ChevronRight data-icon="inline-end" />
                  </Link>
                </CardHeader>
                {servicosDaEtapa.length > 0 && (
                  <CardContent className="flex flex-wrap gap-1.5">
                    {servicosDaEtapa.map((sv) => (
                      <Badge key={sv.id} variant="secondary">
                        {sv.nome}
                      </Badge>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
