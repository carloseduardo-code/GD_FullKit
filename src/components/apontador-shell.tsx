"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Bell, ClipboardList, Home, LayoutDashboard } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store-auth";
import { resumoObra } from "@/lib/planejamento";
import { cn } from "@/lib/utils";

function iniciaisDe(nome: string): string {
  return (
    nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function ApontadorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ obraId?: string }>();
  const profile = useAuthStore((s) => s.profile);

  const obra = useFullKitStore((s) => (params.obraId ? s.obras.find((o) => o.id === params.obraId) : undefined));
  const etapas = useFullKitStore((s) => (params.obraId ? s.etapas.filter((e) => e.obraId === params.obraId) : []));
  const servicos = useFullKitStore((s) => s.servicos);
  const getStatusServico = useFullKitStore((s) => s.getStatusServico);

  const resumo = obra ? resumoObra(obra.id, etapas, servicos, getStatusServico) : null;
  const liberados = obra
    ? etapas.reduce((acc, etapa) => {
        const daEtapa = servicos.filter((sv) => sv.etapaId === etapa.id && !sv.concluidoEm);
        return acc + daEtapa.filter((sv) => getStatusServico(sv.id).status === "liberado").length;
      }, 0)
    : 0;

  const emEtapaOuServico = pathname.includes("/etapa/") || pathname.includes("/servico/");
  const ativoInicio = !emEtapaOuServico;
  const gestaoHref = params.obraId ? `/gestao/${params.obraId}` : "/gestao";

  return (
    <div className="flex min-h-screen flex-col bg-[oklch(0.98_0.003_155)]">
      <div className="flex flex-col gap-4 bg-[oklch(0.235_0.022_158)] px-4.5 pt-4 pb-3 text-white">
        <div className="flex items-center gap-2.5">
          <span className="flex size-[30px] items-center justify-center overflow-hidden rounded-lg bg-white">
            <Image src="/logo.png" alt="" width={856} height={385} className="w-[23px]" />
          </span>
          <span className="text-[14px] font-bold tracking-tight">FULL KIT</span>
          <span className="relative ml-auto flex size-8 items-center justify-center rounded-lg bg-white/[0.09]">
            <Bell className="size-4" />
          </span>
          {profile && (
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[11.5px] font-semibold">
              {iniciaisDe(profile.nome)}
            </span>
          )}
        </div>

        {obra && resumo ? (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold tracking-[0.08em] text-white/45 uppercase">Obra ativa</span>
              <span className="truncate text-[20px] font-bold tracking-tight">{obra.nome}</span>
            </div>
            <div className="flex gap-2 pb-1">
              <div className="flex-1 rounded-[13px] bg-white/[0.08] px-3 py-2.5">
                <span className="block text-[10.5px] font-semibold text-white/55">Avanço</span>
                <span className="text-[21px] font-bold tracking-tight tabular-nums">{resumo.percentual}%</span>
              </div>
              <div className="flex-1 rounded-[13px] bg-white/[0.08] px-3 py-2.5">
                <span className="block text-[10.5px] font-semibold text-white/55">Pendências</span>
                <span className="text-[21px] font-bold tracking-tight tabular-nums text-[oklch(0.78_0.13_27)]">
                  {resumo.pendencias}
                </span>
              </div>
              <div className="flex-1 rounded-[13px] bg-white/[0.08] px-3 py-2.5">
                <span className="block text-[10.5px] font-semibold text-white/55">Liberados</span>
                <span className="text-[21px] font-bold tracking-tight tabular-nums text-[oklch(0.82_0.13_154)]">
                  {liberados}
                </span>
              </div>
            </div>
          </>
        ) : (
          <span className="text-[15px] font-semibold">Apontador</span>
        )}
      </div>

      <main className="flex-1 px-4.5 py-4.5 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border bg-white/96 px-3 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+6px)] backdrop-blur-sm">
        <Link
          href={params.obraId ? `/apontador/${params.obraId}` : "/apontador"}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 rounded-[14px] py-2 text-[11px] font-semibold",
            ativoInicio ? "bg-primary-tint text-primary-tint-foreground" : "text-muted-foreground"
          )}
        >
          <Home className="size-[21px]" />
          Início
        </Link>
        <Link
          href={params.obraId ? `/apontador/${params.obraId}` : "/apontador"}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 rounded-[14px] py-2 text-[11px] font-semibold",
            emEtapaOuServico ? "bg-primary-tint text-primary-tint-foreground" : "text-muted-foreground"
          )}
        >
          <ClipboardList className="size-[21px]" />
          Apontar
        </Link>
        <Link
          href={gestaoHref}
          className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[14px] py-2 text-[11px] font-semibold text-muted-foreground"
        >
          <LayoutDashboard className="size-[21px]" />
          Gestão
        </Link>
      </nav>
    </div>
  );
}
