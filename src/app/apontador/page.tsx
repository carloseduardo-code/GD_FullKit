"use client";

import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SelecionarObraPage() {
  const obras = useFullKitStore((s) => s.obras);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Selecione a obra</h1>
        <p className="text-sm text-muted-foreground">Escolha em qual obra você está registrando o apontamento.</p>
      </div>

      <div className="space-y-3">
        {obras.map((obra) => (
          <Link key={obra.id} href={`/apontador/${obra.id}`}>
            <Card className="transition-colors active:bg-accent">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <Building2 className="size-5 text-primary shrink-0" />
                <div className="flex-1">
                  <CardTitle className="text-base">{obra.nome}</CardTitle>
                  <CardDescription>{obra.endereco}</CardDescription>
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
