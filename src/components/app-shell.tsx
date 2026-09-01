"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  Home,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  UserRound,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { useAuthStore, type Role } from "@/lib/store-auth";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: ComponentType<{ className?: string }>;
  roles?: Role[];
  mobile?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Visão geral", shortLabel: "Início", icon: Home, mobile: true },
  {
    href: "/config",
    label: "Configuração",
    shortLabel: "Configurar",
    icon: Settings2,
    roles: ["god", "administrador"],
    mobile: true,
  },
  {
    href: "/apontador",
    label: "Apontamentos",
    shortLabel: "Apontar",
    icon: ClipboardCheck,
    roles: ["god", "administrador", "apontador"],
    mobile: true,
  },
  { href: "/gestao", label: "Gestão", icon: LayoutDashboard, mobile: true },
  { href: "/usuarios", label: "Usuários", icon: Users, roles: ["god"] },
];

function itemPermitido(item: NavItem, role: Role | undefined): boolean {
  return !item.roles || (!!role && item.roles.includes(role));
}

function rotaAtiva(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

interface AppShellProps {
  children: ReactNode;
  section: string;
  contentClassName?: string;
}

export function AppShell({ children, section, contentClassName }: AppShellProps) {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.profile?.role);
  const [recolhida, setRecolhida] = useState(false);

  useEffect(() => {
    const salva = window.localStorage.getItem("full-kit-sidebar-recolhida");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- preferência local restaurada após hidratação
    setRecolhida(salva === "true");
  }, []);

  function alternarSidebar() {
    setRecolhida((atual) => {
      const proximo = !atual;
      window.localStorage.setItem("full-kit-sidebar-recolhida", String(proximo));
      return proximo;
    });
  }

  const itemsPermitidos = NAV_ITEMS.filter((item) => itemPermitido(item, role));
  const itemsMobile = itemsPermitidos.filter((item) => item.mobile);

  return (
    <div className="flex min-h-dvh w-full bg-muted/20">
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
          recolhida ? "w-20" : "w-68"
        )}
      >
        <div className="flex h-17 items-center border-b border-sidebar-border px-4">
          <Link
            href="/"
            className={cn("flex min-w-0 items-center", recolhida ? "mx-auto" : "gap-3")}
            title={recolhida ? "FULL KIT" : undefined}
          >
            {recolhida ? (
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-extrabold tracking-tight text-primary-foreground shadow-card">
                FK
              </span>
            ) : (
              <>
                <Image
                  src="/logo.png"
                  alt="Gonçalves & Dias Engenharia"
                  width={856}
                  height={385}
                  className="h-8 w-auto shrink-0"
                  priority
                />
                <span className="min-w-0 border-l pl-3">
                  <span className="block truncate text-sm font-bold tracking-tight">FULL KIT</span>
                  <span className="block truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Operações
                  </span>
                </span>
              </>
            )}
          </Link>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={alternarSidebar}
          aria-expanded={!recolhida}
          aria-label={recolhida ? "Expandir menu lateral" : "Recolher menu lateral"}
          className="absolute -right-4 top-21 z-10 rounded-full bg-background text-muted-foreground shadow-sm"
        >
          {recolhida ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>

        <nav className="flex-1 space-y-1 p-3" aria-label="Navegação principal">
          {!recolhida && (
            <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Menu principal
            </p>
          )}
          {itemsPermitidos.map((item) => {
            const Icon = item.icon;
            const ativa = rotaAtiva(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={recolhida ? item.label : undefined}
                aria-current={ativa ? "page" : undefined}
                className={cn(
                  "group flex h-11 items-center rounded-xl text-sm font-medium transition-colors",
                  recolhida ? "justify-center px-0" : "gap-3 px-3",
                  ativa
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("size-[18px] shrink-0", ativa && "text-primary")} />
                {!recolhida && <span className="truncate">{item.label}</span>}
                {!recolhida && ativa && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Link
            href="/conta"
            title={recolhida ? "Minha conta" : undefined}
            className={cn(
              "flex h-11 items-center rounded-xl text-sm font-medium transition-colors",
              recolhida ? "justify-center" : "gap-3 px-3",
              rotaAtiva(pathname, "/conta")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            )}
          >
            <UserRound className="size-[18px] shrink-0" />
            {!recolhida && <span>Minha conta</span>}
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 md:hidden">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-[11px] font-extrabold text-primary-foreground">
                FK
              </span>
            </Link>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">FULL KIT</p>
              <p className="truncate text-sm font-semibold tracking-tight sm:text-base">{section}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </header>

        <main
          className={cn(
            "mx-auto w-full flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-10 md:pt-8 lg:px-8",
            contentClassName ?? "max-w-7xl"
          )}
        >
          {children}
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/94 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_30px_rgba(15,15,15,0.06)] backdrop-blur-xl md:hidden"
          aria-label="Navegação móvel"
        >
          <div className="mx-auto flex max-w-lg items-stretch justify-around">
            {itemsMobile.map((item) => {
              const Icon = item.icon;
              const ativa = rotaAtiva(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={ativa ? "page" : undefined}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors",
                    ativa ? "text-primary" : "text-muted-foreground active:bg-accent"
                  )}
                >
                  <span className={cn("rounded-lg px-3 py-1", ativa && "bg-primary-tint")}>
                    <Icon className="size-[19px]" />
                  </span>
                  <span className="max-w-full truncate">{item.shortLabel ?? item.label}</span>
                </Link>
              );
            })}
            {role && (
              <Link
                href="/conta"
                aria-current={rotaAtiva(pathname, "/conta") ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors",
                  rotaAtiva(pathname, "/conta") ? "text-primary" : "text-muted-foreground active:bg-accent"
                )}
              >
                <span className={cn("rounded-lg px-3 py-1", rotaAtiva(pathname, "/conta") && "bg-primary-tint")}>
                  <UserRound className="size-[19px]" />
                </span>
                <span>Conta</span>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
