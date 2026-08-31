"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useFullKitStore } from "@/lib/store";

const ROTAS_SEM_DADOS = ["/login"];

export function StoreHydrator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const carregado = useFullKitStore((s) => s.carregado);
  const carregarTudo = useFullKitStore((s) => s.carregarTudo);
  // "/" agora mostra indicadores reais (landing pública ou dashboard, conforme
  // login) — precisa dos dados como "/gestao", que já é pública e carregada.
  const precisaDados = !ROTAS_SEM_DADOS.some((rota) => pathname.startsWith(rota));

  useEffect(() => {
    if (precisaDados) carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precisaDados]);

  if (!precisaDados) {
    return <>{children}</>;
  }

  if (!carregado) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
