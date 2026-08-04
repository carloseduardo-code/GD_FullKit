"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SelecionarElementoPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = useFullKitStore((s) => s.obras.find((o) => o.id === obraId));
  const elementos = useFullKitStore(useShallow((s) => s.elementos.filter((e) => e.obraId === obraId)));

  if (!obra) return notFound();

  return (
    <div className="space-y-5">
      <Link href="/apontador" className="flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" />
        Trocar obra
      </Link>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">{obra.nome}</h1>
        <p className="text-sm text-muted-foreground">Selecione o elemento que você está inspecionando.</p>
      </div>

      <div className="space-y-3">
        {elementos.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">Nenhum elemento cadastrado nesta obra ainda.</p>
        )}
        {elementos.map((elemento) => (
          <Link key={elemento.id} href={`/apontador/${obraId}/${elemento.id}`}>
            <Card className="transition-colors active:bg-accent">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <Package className="size-5 text-primary shrink-0" />
                <div className="flex-1">
                  <CardTitle className="text-base">{elemento.nome}</CardTitle>
                  <CardDescription>{elemento.tipo}</CardDescription>
                </div>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
