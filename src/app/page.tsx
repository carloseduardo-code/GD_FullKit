"use client";

import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store-auth";
import { AppShell } from "@/components/app-shell";
import { DashboardInicio } from "@/components/dashboard-inicio";
import { LandingPublica } from "@/components/landing-publica";

export default function Home() {
  const authCarregado = useAuthStore((s) => s.carregado);
  const userId = useAuthStore((s) => s.userId);

  if (!authCarregado) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!userId) {
    return <LandingPublica />;
  }

  return (
    <AppShell section="inicio">
      <DashboardInicio />
    </AppShell>
  );
}
