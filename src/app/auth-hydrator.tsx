"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store-auth";

export function AuthHydrator({ children }: { children: React.ReactNode }) {
  const carregarSessao = useAuthStore((s) => s.carregarSessao);

  useEffect(() => {
    carregarSessao();
    // Sem isso, um login/logout feito via client-navigation nunca chegava a
    // atualizar o estado local — router.refresh() não remonta este componente.
    const { data } = supabase.auth.onAuthStateChange(() => {
      carregarSessao();
    });
    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
