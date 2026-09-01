"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, MapPin } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GestaoObrasPage() {
  const obras = useFullKitStore((s) => s.obras);

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        eyebrow="Acompanhamento"
        title="Obras"
        description="Selecione uma obra para acompanhar prontidão, pendências e avanço físico."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {obras.length === 0 && (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center sm:col-span-2 xl:col-span-3">
            <Building2 className="mx-auto mb-3 size-7 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhuma obra cadastrada</p>
            <p className="mt-1 text-xs text-muted-foreground">As obras aparecerão aqui quando forem configuradas.</p>
          </div>
        )}
        {obras.map((obra) => (
          <Link key={obra.id} href={`/gestao/${obra.id}`} className="group">
            <Card className="h-full cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-pop">
              <CardHeader className="min-h-40 gap-4">
                <div className="flex items-start justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary-tint">
                    <Building2 className="size-[18px] text-primary-tint-foreground" />
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle>{obra.nome}</CardTitle>
                  <CardDescription className="flex items-start gap-1.5 text-xs">
                    <MapPin className="mt-0.5 size-3 shrink-0" />
                    {obra.endereco || "Endereço não cadastrado"}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
