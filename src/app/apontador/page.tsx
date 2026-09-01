"use client";

import Link from "next/link";
import { Building2, ChevronRight, MapPin } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SelecionarObraPage() {
  const obras = useFullKitStore((s) => s.obras);

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        eyebrow="Operação em campo"
        title="Selecione a obra"
        description="Escolha onde você está trabalhando para acessar as etapas e registrar o FULL KIT."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {obras.length === 0 && (
          <div className="rounded-xl border border-dashed bg-card p-8 text-center sm:col-span-2">
            <Building2 className="mx-auto mb-3 size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhuma obra disponível</p>
            <p className="mt-1 text-xs text-muted-foreground">Peça ao administrador para cadastrar uma obra.</p>
          </div>
        )}
        {obras.map((obra) => (
          <Link key={obra.id} href={`/apontador/${obra.id}`} className="group">
            <Card className="h-full cursor-pointer transition-all hover:border-primary/60 hover:shadow-card active:bg-accent">
              <CardHeader className="flex-row items-center gap-3 space-y-0 py-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-tint">
                  <Building2 className="size-[18px] text-primary-tint-foreground" />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <CardTitle className="truncate text-base">{obra.nome}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 truncate text-xs">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{obra.endereco || "Endereço não informado"}</span>
                  </CardDescription>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
