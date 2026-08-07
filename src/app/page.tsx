"use client";

import Link from "next/link";
import { ClipboardList, LayoutDashboard, Settings2, Users } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppHeader } from "@/components/app-header";
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
    <div className="flex flex-1 flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-10 bg-gradient-to-b from-accent/30 via-background to-background p-6">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">FULL KIT</h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            Gestão da prontidão operacional da obra.
          </p>
        </div>

        <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {podeAdministrador && (
            <Link href="/config">
              <Card className="h-full transition-all hover:border-primary hover:bg-accent/40 hover:shadow-md cursor-pointer">
                <CardHeader className="space-y-2">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <Settings2 className="size-5 text-primary" />
                  </span>
                  <CardTitle>Administrador</CardTitle>
                  <CardDescription>
                    Configurar obras, etapas, serviços notáveis e os checklists FULL KIT.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}

          {podeApontador && (
            <Link href="/apontador">
              <Card className="h-full transition-all hover:border-primary hover:bg-accent/40 hover:shadow-md cursor-pointer">
                <CardHeader className="space-y-2">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <ClipboardList className="size-5 text-primary" />
                  </span>
                  <CardTitle>Apontador</CardTitle>
                  <CardDescription>
                    Registrar em campo o FULL KIT de um serviço: responder o checklist, anexar fotos e salvar.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}

          <Link href="/gestao">
            <Card className="h-full transition-all hover:border-primary hover:bg-accent/40 hover:shadow-md cursor-pointer">
              <CardHeader className="space-y-2">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <LayoutDashboard className="size-5 text-primary" />
                </span>
                <CardTitle>Gestão / Consulta</CardTitle>
                <CardDescription>
                  Acompanhar a prontidão da obra: status, pendências, FULL KIT preenchido e histórico por elemento.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {role === "god" && (
            <Link href="/usuarios">
              <Card className="h-full transition-all hover:border-primary hover:bg-accent/40 hover:shadow-md cursor-pointer">
                <CardHeader className="space-y-2">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <Users className="size-5 text-primary" />
                  </span>
                  <CardTitle>Usuários</CardTitle>
                  <CardDescription>Criar e acompanhar acessos de Administrador e Apontador.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
