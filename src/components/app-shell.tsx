"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Bell,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings2,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useAuthStore, ROLE_LABEL } from "@/lib/store-auth";
import { useShallow } from "zustand/react/shallow";
import { progressoEtapa, situacaoEtapa, type SituacaoEtapa } from "@/lib/planejamento";
import { cn } from "@/lib/utils";

export type ShellSection = "inicio" | "gestao" | "config" | "usuarios" | "conta";

const DOT_SITUACAO: Record<SituacaoEtapa, string> = {
  nao_iniciada: "bg-white/30",
  em_andamento: "bg-primary/60",
  nao_liberada: "bg-destructive",
  liberada: "bg-primary/80",
  concluida: "bg-primary",
};

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

function NavButton({
  href,
  active,
  icon,
  children,
  collapsed,
  badge,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsed?: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? String(children) : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-white/[0.09]",
        collapsed && "size-10 justify-center px-0",
        active ? "bg-white/[0.12] text-white" : "text-white/62"
      )}
    >
      <span className="flex shrink-0 [&_svg]:size-[17px]">{icon}</span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{children}</span>
          {!!badge && (
            <span className="flex h-[18px] shrink-0 items-center justify-center rounded-full bg-destructive px-1.5 text-[10.5px] font-semibold text-white">
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

function SidebarContent({
  collapsed,
  onToggleCollapsed,
  showToggle,
}: {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  showToggle: boolean;
}) {
  const pathname = usePathname();
  const params = useParams<{ obraId?: string }>();
  const userId = useAuthStore((s) => s.userId);
  const profile = useAuthStore((s) => s.profile);
  const { resolvedTheme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- evita mismatch de hidratação do tema
    setMontado(true);
  }, []);

  const emGestaoObra = pathname.startsWith("/gestao/") && !!params.obraId;
  const obra = useFullKitStore((s) => (params.obraId ? s.obras.find((o) => o.id === params.obraId) : undefined));
  const etapas = useFullKitStore(
    useShallow((s) => (emGestaoObra ? s.etapas.filter((e) => e.obraId === params.obraId) : []))
  );
  const servicos = useFullKitStore((s) => s.servicos);
  const getStatusServico = useFullKitStore((s) => s.getStatusServico);
  const etapasRaiz = emGestaoObra
    ? etapas.filter((e) => !e.etapaPaiId).sort((a, b) => a.ordem - b.ordem)
    : [];

  const podeConfig = profile?.role === "god" || profile?.role === "administrador";
  const ehGod = profile?.role === "god";

  const ativoInicio = pathname === "/";
  const ativoGestao = pathname.startsWith("/gestao");
  const ativoObras = pathname.startsWith("/config") && !pathname.startsWith("/config/full-kits");
  const ativoCatalogo = pathname.startsWith("/config/full-kits");
  const ativoUsuarios = pathname.startsWith("/usuarios");
  const ativoConta = pathname.startsWith("/conta");

  const escuro = montado && resolvedTheme === "dark";

  return (
    <div className="flex h-full flex-col bg-[oklch(0.235_0.022_158)] text-white">
      <div className={cn("flex items-center gap-2.5 px-[18px] pt-[18px] pb-4", collapsed && "flex-col px-0")}>
        <span className="flex size-[34px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
          <Image src="/logo.png" alt="Gonçalves & Dias" width={856} height={385} className="w-[26px]" />
        </span>
        {!collapsed && (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="text-[14.5px] font-bold tracking-tight">FULL KIT</span>
            <span className="truncate text-[10.5px] font-medium tracking-[0.08em] text-white/45 uppercase">
              Gonçalves &amp; Dias
            </span>
          </span>
        )}
        {showToggle && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            className={cn(
              "flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-white/[0.07] text-white/60 transition-colors hover:bg-white/[0.14] hover:text-white",
              collapsed ? "mt-1.5" : "ml-auto"
            )}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3.5 pb-3.5">
        <div className="flex flex-col gap-0.5">
          {!collapsed && (
            <span className="px-3 pb-1.5 text-[9.5px] font-semibold tracking-[0.08em] text-white/35 uppercase">
              Operação
            </span>
          )}
          <NavButton href="/" active={ativoInicio} icon={<LayoutDashboard />} collapsed={collapsed}>
            Início
          </NavButton>
          <NavButton
            href={obra ? `/gestao/${obra.id}` : "/gestao"}
            active={ativoGestao}
            icon={<GitBranch />}
            collapsed={collapsed}
          >
            Gestão da obra
          </NavButton>
          {!collapsed && emGestaoObra && etapasRaiz.length > 0 && (
            <div className="mt-0.5 mb-0.5 ml-[22px] flex flex-col gap-px border-l border-white/10 pl-3">
              {etapasRaiz.map((etapa) => {
                const progresso = progressoEtapa(etapa.id, etapas, servicos, getStatusServico);
                const situacao = situacaoEtapa(progresso);
                return (
                  <Link
                    key={etapa.id}
                    href={`/gestao/${params.obraId}/etapa/${etapa.id}`}
                    className="flex items-center gap-2 truncate rounded-lg px-2 py-1.5 text-[12.5px] font-medium text-white/72 transition-colors hover:bg-white/[0.07] hover:text-white"
                  >
                    <span className={cn("size-1.5 shrink-0 rounded-full", DOT_SITUACAO[situacao])} />
                    <span className="truncate">{etapa.nome}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {podeConfig && (
          <div className="flex flex-col gap-0.5">
            {!collapsed && (
              <span className="px-3 pb-1.5 text-[9.5px] font-semibold tracking-[0.08em] text-white/35 uppercase">
                Configuração
              </span>
            )}
            <NavButton href="/config" active={ativoObras} icon={<Settings2 />} collapsed={collapsed}>
              Obras e etapas
            </NavButton>
            <NavButton
              href="/config/full-kits"
              active={ativoCatalogo}
              icon={<ListChecks />}
              collapsed={collapsed}
            >
              Catálogo FULL KIT
            </NavButton>
            {ehGod && (
              <NavButton href="/usuarios" active={ativoUsuarios} icon={<Users />} collapsed={collapsed}>
                Usuários
              </NavButton>
            )}
          </div>
        )}
      </nav>

      <div className={cn("flex flex-col gap-2 border-t border-white/[0.09] p-3.5", collapsed && "items-center px-0")}>
        {userId && profile ? (
          <div
            className={cn(
              "flex items-center justify-between gap-2 rounded-[10px] py-1 pr-1 pl-1 hover:bg-white/[0.07]",
              collapsed && "flex-col-reverse gap-2 p-0"
            )}
          >
            <Link
              href="/conta"
              className={cn("flex items-center gap-2.5 p-1", ativoConta && "text-white")}
              title={collapsed ? "Minha conta" : undefined}
            >
              <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-primary text-[11.5px] font-semibold text-white">
                {iniciaisDe(profile.nome)}
              </span>
              {!collapsed && (
                <span className="flex flex-col leading-tight">
                  <span className="text-[12.5px] font-semibold">{profile.nome}</span>
                  <span className="text-[10.5px] text-white/45">{ROLE_LABEL[profile.role]}</span>
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setTheme(escuro ? "light" : "dark")}
              title="Alternar tema"
              className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-white/[0.07] text-white/60 hover:bg-white/[0.14] hover:text-white"
            >
              {escuro ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-[10px] bg-white/[0.09] py-2 text-[13px] font-semibold text-white hover:bg-white/[0.15]"
          >
            {collapsed ? "→" : "Entrar"}
          </Link>
        )}
      </div>
    </div>
  );
}

const TITULO_SECAO: Record<ShellSection, string> = {
  inicio: "Início · Visão geral",
  gestao: "Gestão da obra",
  config: "Configuração",
  usuarios: "Configuração · Usuários",
  conta: "Minha conta",
};

function useTrilha(section: ShellSection): string {
  const pathname = usePathname();
  const params = useParams<{ obraId?: string }>();
  const obra = useFullKitStore((s) => (params.obraId ? s.obras.find((o) => o.id === params.obraId) : undefined));

  if (section === "gestao") {
    if (!obra) return "Gestão da obra";
    if (pathname.includes("/etapa/")) return `Gestão da obra · ${obra.nome} · Etapa`;
    if (pathname.includes("/servico/")) return `Gestão da obra · ${obra.nome} · Serviço`;
    return `Gestão da obra · ${obra.nome} · Fluxo executivo`;
  }
  if (section === "config") {
    const catalogo = pathname.startsWith("/config/full-kits");
    if (catalogo) return "Configuração · Catálogo FULL KIT";
    if (!obra) return "Configuração · Obras e etapas";
    if (pathname.includes("/servicos/")) return `Configuração · ${obra.nome} · Serviços`;
    if (pathname.includes("/etapas")) return `Configuração · ${obra.nome} · Etapas`;
    return `Configuração · ${obra.nome}`;
  }
  return TITULO_SECAO[section];
}

export function AppShell({ section, children }: { section: ShellSection; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const trilha = useTrilha(section);

  const userId = useAuthStore((s) => s.userId);
  const role = useAuthStore((s) => s.profile?.role);
  const podeApontar = !!userId && (role === "god" || role === "administrador" || role === "apontador");

  const obras = useFullKitStore((s) => s.obras);
  const etapas = useFullKitStore((s) => s.etapas);
  const servicos = useFullKitStore((s) => s.servicos);
  const getStatusServico = useFullKitStore((s) => s.getStatusServico);
  const totalPendencias = obras.reduce((acc, obra) => {
    const raiz = etapas.filter((e) => e.obraId === obra.id && !e.etapaPaiId);
    return acc + raiz.reduce((a, e) => a + progressoEtapa(e.id, etapas, servicos, getStatusServico).pendencias, 0);
  }, 0);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem("fullkit:sidebar-colapsada");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lê preferência persistida no mount, não sincronização de estado
      if (salvo === "1") setCollapsed(true);
    } catch {
      // localStorage indisponível — mantém expandida
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      const novo = !v;
      try {
        localStorage.setItem("fullkit:sidebar-colapsada", novo ? "1" : "0");
      } catch {
        // localStorage indisponível — só não persiste
      }
      return novo;
    });
  }

  return (
    <div className="flex min-h-screen">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 md:flex", collapsed ? "w-[72px]" : "w-[268px]")}>
        <SidebarContent collapsed={collapsed} onToggleCollapsed={toggleCollapsed} showToggle />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex h-full w-[268px] flex-col">
            <SidebarContent collapsed={false} showToggle={false} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-[18px] right-[-44px] flex size-9 items-center justify-center rounded-full bg-white/10 text-white"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center gap-4 border-b border-border bg-white/85 px-4 backdrop-blur-sm sm:px-7">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex size-8 items-center justify-center rounded-lg text-foreground/70 hover:bg-muted md:hidden"
          >
            <Menu className="size-5" />
          </button>
          <span className="truncate text-[12.5px] font-medium text-muted-foreground">{trilha}</span>
          <div className="ml-auto flex items-center gap-2.5">
            {userId && (
              <span className="relative flex size-[34px] items-center justify-center rounded-[10px] border border-border bg-card text-foreground/80">
                <Bell className="size-4" />
                {totalPendencias > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                    {totalPendencias}
                  </span>
                )}
              </span>
            )}
            {podeApontar && (
              <Link
                href="/apontador"
                className="inline-flex h-[34px] items-center gap-1.5 rounded-[10px] bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="size-[15px]" />
                <span className="hidden sm:inline">Novo apontamento</span>
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-7 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
