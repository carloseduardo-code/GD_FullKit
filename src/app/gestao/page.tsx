"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GestaoObrasPage() {
  const obras = useFullKitStore((s) => s.obras);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Obras</h1>
        <p className="text-muted-foreground">Selecione uma obra para acompanhar a prontidão dos elementos.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {obras.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma obra cadastrada ainda.</p>
        )}
        {obras.map((obra) => (
          <Link key={obra.id} href={`/gestao/${obra.id}`}>
            <Card className="h-full transition-colors hover:bg-[oklch(0.985_0.004_155)] cursor-pointer">
              <CardHeader className="space-y-1.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary-tint">
                  <Building2 className="size-4 text-primary-tint-foreground" />
                </span>
                <CardTitle>{obra.nome}</CardTitle>
                <CardDescription>{obra.endereco || "Sem endereço cadastrado"}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
