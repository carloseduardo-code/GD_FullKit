"use client";

import Link from "next/link";
import { ArrowUpRight, ClipboardList, LayoutDashboard, Settings2, Users } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { useAuthStore } from "@/lib/store-auth";

export default function Home() {
  const userId = useAuthStore((s) => s.userId);
  const role = useAuthStore((s) => s.profile?.role);
  const logado = !!userId;

  // Deslogado vê as 3 seções normalmente; ao clicar em Administrador ou
  // Apontador, o login é pedido. Logado, filtra pelo papel de fato.
  const podeAdministrador = !logado || role === "god" || role === "administrador";
  const podeApontador = !logado || role === "god" || role === "administrador" || role === "apontador";

  return (
    <AppShell section="Visão geral" contentClassName="max-w-6xl">
      <div className="space-y-8">
        <PageHeader
          eyebrow="Painel operacional"
          title={logado ? "Bem-vindo ao FULL KIT" : "Gestão da prontidão operacional"}
          description="Acesse as áreas do sistema para configurar a operação, registrar apontamentos e acompanhar a evolução das obras."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {podeAdministrador && (
            <Link href="/config" className="group">
              <Card className="h-full cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-pop">
                <CardHeader className="min-h-44 gap-4">
                  <div className="flex items-start justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary-tint">
                      <Settings2 className="size-5 text-primary-tint-foreground" />
                    </span>
                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <CardTitle>Configuração</CardTitle>
                  <CardDescription>
                    Configurar obras, etapas, serviços notáveis e os checklists FULL KIT.
                  </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )}

          {podeApontador && (
            <Link href="/apontador" className="group">
              <Card className="h-full cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-pop">
                <CardHeader className="min-h-44 gap-4">
                  <div className="flex items-start justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary-tint">
                      <ClipboardList className="size-5 text-primary-tint-foreground" />
                    </span>
                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <CardTitle>Apontamentos</CardTitle>
                    <CardDescription>Registrar em campo o FULL KIT de cada serviço e acompanhar pendências.</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )}

          <Link href="/gestao" className="group">
            <Card className="h-full cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-pop">
              <CardHeader className="min-h-44 gap-4">
                <div className="flex items-start justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary-tint">
                    <LayoutDashboard className="size-5 text-primary-tint-foreground" />
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle>Gestão e consulta</CardTitle>
                  <CardDescription>Acompanhar status, pendências, avanço físico e prontidão por obra.</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {role === "god" && (
            <Link href="/usuarios" className="group">
              <Card className="h-full cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-pop">
                <CardHeader className="min-h-44 gap-4">
                  <div className="flex items-start justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary-tint">
                      <Users className="size-5 text-primary-tint-foreground" />
                    </span>
                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <CardTitle>Usuários</CardTitle>
                    <CardDescription>Criar e acompanhar acessos de Administrador e Apontador.</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  );
}
