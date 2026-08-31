"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardList,
  Copy,
  GitBranch,
  History,
  Lock,
  LogIn,
  Moon,
  PlayCircle,
  Settings2,
  Sun,
} from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { resumoObra } from "@/lib/planejamento";

const NAV_ITENS = ["Como funciona", "Módulos", "Indicadores", "Suporte"];

function ThemeDot() {
  const { resolvedTheme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- evita mismatch de hidratação do tema
    setMontado(true);
  }, []);
  const escuro = montado && resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(escuro ? "light" : "dark")}
      title="Alternar tema"
      className="flex size-[34px] items-center justify-center rounded-[10px] border border-border text-foreground/70 hover:bg-muted"
    >
      {escuro ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export function LandingPublica() {
  const obras = useFullKitStore((s) => s.obras);
  const etapas = useFullKitStore((s) => s.etapas);
  const servicos = useFullKitStore((s) => s.servicos);
  const apontamentos = useFullKitStore((s) => s.apontamentos);
  const getStatusServico = useFullKitStore((s) => s.getStatusServico);

  const obraDestaque = obras[0];
  const resumoDestaque = obraDestaque
    ? resumoObra(
        obraDestaque.id,
        etapas.filter((e) => e.obraId === obraDestaque.id),
        servicos,
        getStatusServico
      )
    : null;
  const etapasDestaque = resumoDestaque?.etapasRaiz.slice(0, 3) ?? [];

  const totalServicosMonitorados = servicos.length;
  const totalApontamentosComRegistro = apontamentos.length;

  return (
    <div className="min-h-screen bg-card">
      <header className="flex h-[68px] items-center gap-3.5 border-b border-border bg-white/90 px-5 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Gonçalves & Dias" width={856} height={385} className="h-[34px] w-auto" />
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-bold tracking-tight text-foreground">FULL KIT</span>
            <span className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Gonçalves &amp; Dias
            </span>
          </span>
        </Link>
        <nav className="ml-8 hidden gap-5.5 text-[13.5px] font-semibold text-foreground/70 md:flex">
          {NAV_ITENS.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <ThemeDot />
          <Link
            href="/login"
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-primary px-4 text-[13.5px] font-bold text-primary-foreground hover:bg-primary/90"
          >
            <LogIn className="size-[15px]" />
            Entrar
          </Link>
        </div>
      </header>

      <section className="bg-[oklch(0.235_0.022_158)] px-5 py-16 text-white sm:px-10 sm:py-20">
        <div className="mx-auto grid max-w-[1240px] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="flex flex-col gap-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/18 bg-white/[0.07] px-3 py-1 text-[11.5px] font-semibold tracking-[0.08em] text-white/80 uppercase">
              <span className="size-1.5 rounded-full bg-[oklch(0.72_0.15_154)]" />
              Prontidão operacional
            </span>
            <h1 className="max-w-xl text-[34px] leading-[1.08] font-bold tracking-tight text-balance sm:text-[46px]">
              Nenhum serviço começa sem o FULL KIT atendido.
            </h1>
            <p className="max-w-lg text-[15px] leading-relaxed text-white/72 sm:text-[16.5px]">
              Checklist de liberação, fluxo executivo com predecessoras e avanço físico da obra — em um
              só lugar, do escritório ao canteiro.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/login"
                className="inline-flex h-[46px] items-center gap-2 rounded-[10px] bg-white px-[22px] text-[14.5px] font-bold text-[oklch(0.22_0.03_158)] hover:bg-white/90"
              >
                Entrar no sistema
                <ArrowRight className="size-[17px]" />
              </Link>
              <Link
                href="/gestao"
                className="inline-flex h-[46px] items-center gap-2 rounded-[10px] border border-white/22 px-[22px] text-[14.5px] font-semibold text-white hover:bg-white/10"
              >
                <PlayCircle className="size-[17px]" />
                Ver como funciona
              </Link>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-8 border-t border-white/12 pt-3.5">
              <div className="flex flex-col gap-0.5 pt-3.5">
                <span className="text-[26px] font-bold tracking-tight tabular-nums">{obras.length}</span>
                <span className="text-xs text-white/60">obras ativas</span>
              </div>
              <div className="flex flex-col gap-0.5 pt-3.5">
                <span className="text-[26px] font-bold tracking-tight tabular-nums">{totalServicosMonitorados}</span>
                <span className="text-xs text-white/60">serviços monitorados</span>
              </div>
              <div className="flex flex-col gap-0.5 pt-3.5">
                <span className="text-[26px] font-bold tracking-tight tabular-nums">
                  {totalApontamentosComRegistro}
                </span>
                <span className="text-xs text-white/60">apontamentos com registro</span>
              </div>
            </div>
          </div>

          {obraDestaque && resumoDestaque && (
            <div className="overflow-hidden rounded-[14px] bg-card text-card-foreground shadow-[0_30px_70px_rgba(0,0,0,.35)]">
              <div className="flex items-center gap-2 border-b border-border bg-[oklch(0.985_0.003_155)] px-4 py-3">
                <span className="size-[9px] rounded-full bg-[oklch(0.9_0.004_155)]" />
                <span className="size-[9px] rounded-full bg-[oklch(0.9_0.004_155)]" />
                <span className="size-[9px] rounded-full bg-[oklch(0.9_0.004_155)]" />
                <span className="ml-2 text-[11.5px] font-semibold text-muted-foreground">
                  Painel do gestor · {obraDestaque.nome}
                </span>
              </div>
              <div className="flex flex-col gap-3 p-[18px]">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col gap-1.5 rounded-[10px] border border-border p-3">
                    <span className="text-[10.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                      Avanço
                    </span>
                    <span className="text-2xl font-bold tracking-tight tabular-nums">
                      {resumoDestaque.percentual}%
                    </span>
                    <div className="h-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${resumoDestaque.percentual}%` }} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 rounded-[10px] border border-border p-3">
                    <span className="text-[10.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                      Pendências
                    </span>
                    <span className="text-2xl font-bold tracking-tight tabular-nums text-destructive">
                      {resumoDestaque.pendencias}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 rounded-[10px] border border-border p-3">
                    <span className="text-[10.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                      Etapas
                    </span>
                    <span className="text-2xl font-bold tracking-tight tabular-nums">
                      {resumoDestaque.etapasRaiz.length}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {etapasDestaque.map((etapa) => {
                    const progresso = resumoDestaque.progressoPorEtapaId.get(etapa.id)!;
                    const bloqueada = progresso.total === 0 && etapa.predecessorasIds.length > 0;
                    const pendente = progresso.pendencias > 0;
                    return (
                      <div
                        key={etapa.id}
                        className="flex items-center gap-2.5 rounded-[10px] border border-border px-3 py-2.5"
                      >
                        <span className="flex size-[22px] items-center justify-center rounded-full bg-primary-tint text-primary-tint-foreground">
                          {pendente ? (
                            <AlertTriangle className="size-3" />
                          ) : bloqueada ? (
                            <Lock className="size-2.5" />
                          ) : (
                            <CheckCircle2 className="size-3" />
                          )}
                        </span>
                        <span className="flex-1 truncate text-[12.5px] font-semibold">{etapa.nome}</span>
                        <span className="text-[12px] font-semibold tabular-nums text-muted-foreground">
                          {progresso.percentual}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto flex max-w-[1240px] flex-col gap-8 px-5 py-14 sm:px-10 sm:py-16">
        <div className="flex max-w-xl flex-col gap-2">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">Módulos</span>
          <h2 className="text-[26px] font-bold tracking-tight sm:text-[28px]">
            Um acesso para cada papel na obra
          </h2>
        </div>
        <div className="grid gap-4.5 sm:grid-cols-3">
          <Link
            href="/config"
            className="flex flex-col gap-3.5 rounded-[14px] border border-border p-6.5 transition-colors hover:border-primary/50 hover:bg-accent/30"
          >
            <span className="flex size-11 items-center justify-center rounded-[13px] bg-primary-tint text-primary-tint-foreground">
              <Settings2 className="size-5" />
            </span>
            <span className="text-[18px] font-bold tracking-tight">Administrador</span>
            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
              Cadastra obras, monta o fluxo executivo em árvore, define predecessoras e mantém o catálogo
              de checklists.
            </p>
            <span className="mt-auto inline-flex items-center gap-1.5 text-[13px] font-bold text-primary">
              Acessar configuração
              <ArrowRight className="size-[15px]" />
            </span>
          </Link>
          <Link
            href="/apontador"
            className="flex flex-col gap-3.5 rounded-[14px] border border-border p-6.5 transition-colors hover:border-primary/50 hover:bg-accent/30"
          >
            <span className="flex size-11 items-center justify-center rounded-[13px] bg-primary-tint text-primary-tint-foreground">
              <ClipboardList className="size-5" />
            </span>
            <span className="text-[18px] font-bold tracking-tight">Apontador</span>
            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
              Responde o FULL KIT no celular, anexa fotos e registra a liberação do serviço direto do
              canteiro.
            </p>
            <span className="mt-auto inline-flex items-center gap-1.5 text-[13px] font-bold text-primary">
              Abrir apontamento
              <ArrowRight className="size-[15px]" />
            </span>
          </Link>
          <Link
            href="/gestao"
            className="flex flex-col gap-3.5 rounded-[14px] border border-border p-6.5 transition-colors hover:border-primary/50 hover:bg-accent/30"
          >
            <span className="flex size-11 items-center justify-center rounded-[13px] bg-primary-tint text-primary-tint-foreground">
              <GitBranch className="size-5" />
            </span>
            <span className="text-[18px] font-bold tracking-tight">Gestão / Consulta</span>
            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
              Acompanha status, pendências, avanço físico e o histórico de cada elemento da obra.
            </p>
            <span className="mt-auto inline-flex items-center gap-1.5 text-[13px] font-bold text-primary">
              Ver painel
              <ArrowRight className="size-[15px]" />
            </span>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pb-16 sm:px-10">
        <div className="grid gap-7 rounded-[20px] border border-border bg-[oklch(0.985_0.003_155)] p-8.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <span className="flex size-8.5 items-center justify-center rounded-[10px] border border-border bg-card text-primary-tint-foreground">
              <GitBranch className="size-4" />
            </span>
            <span className="text-sm font-bold">Fluxo com predecessoras</span>
            <span className="text-[12.5px] leading-relaxed text-muted-foreground">
              A etapa só libera quando as anteriores fecham 100%.
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="flex size-8.5 items-center justify-center rounded-[10px] border border-border bg-card text-primary-tint-foreground">
              <Camera className="size-4" />
            </span>
            <span className="text-sm font-bold">Evidência fotográfica</span>
            <span className="text-[12.5px] leading-relaxed text-muted-foreground">
              Cada resposta obrigatória pode exigir foto do campo.
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="flex size-8.5 items-center justify-center rounded-[10px] border border-border bg-card text-primary-tint-foreground">
              <Copy className="size-4" />
            </span>
            <span className="text-sm font-bold">Catálogo reaproveitável</span>
            <span className="text-[12.5px] leading-relaxed text-muted-foreground">
              Checklists padrão replicados para qualquer obra.
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="flex size-8.5 items-center justify-center rounded-[10px] border border-border bg-card text-primary-tint-foreground">
              <History className="size-4" />
            </span>
            <span className="text-sm font-bold">Histórico por elemento</span>
            <span className="text-[12.5px] leading-relaxed text-muted-foreground">
              Quem apontou, quando e o que ficou pendente.
            </span>
          </div>
        </div>
      </section>

      <footer className="flex items-center gap-3 border-t border-border px-5 py-6.5 sm:px-10">
        <Image src="/logo.png" alt="" width={856} height={385} className="h-[26px] w-auto" />
        <span className="text-[12.5px] text-muted-foreground">FULL KIT · Gonçalves &amp; Dias Engenharia</span>
        <span className="ml-auto text-[12.5px] text-muted-foreground/80">
          Gestão da prontidão operacional da obra
        </span>
      </footer>
    </div>
  );
}
