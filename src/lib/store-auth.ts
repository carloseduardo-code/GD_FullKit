import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export type Role = "god" | "administrador" | "apontador";

export const ROLE_LABEL: Record<Role, string> = {
  god: "GOD",
  administrador: "Administrador",
  apontador: "Apontador",
};

const ROLES: readonly string[] = ["god", "administrador", "apontador"];

export interface Profile {
  username: string;
  nome: string;
  role: Role;
}

// Papel e usuário ficam em app_metadata (só a Admin API grava — o próprio
// usuário não consegue alterar via cliente). Nome fica em user_metadata,
// que o dono da conta pode editar.
export function perfilDoUsuario(user: User): Profile {
  const role = user.app_metadata?.role;
  const username = user.app_metadata?.username;
  const nome = user.user_metadata?.nome;
  return {
    role: typeof role === "string" && ROLES.includes(role) ? (role as Role) : "apontador",
    username: typeof username === "string" ? username : (user.email?.split("@")[0] ?? ""),
    nome: typeof nome === "string" && nome ? nome : (user.email?.split("@")[0] ?? "Sem nome"),
  };
}

interface AuthState {
  carregado: boolean;
  userId: string | null;
  profile: Profile | null;

  carregarSessao: () => Promise<void>;
  atualizarNome: (nome: string) => Promise<void>;
  sair: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  carregado: false,
  userId: null,
  profile: null,

  carregarSessao: async () => {
    let user: User | null = null;
    try {
      const resultado = await supabase.auth.getUser();
      user = resultado.data.user;
    } catch {
      // Falha de rede ao checar a sessão: segue como deslogado em vez de
      // travar a tela em carregamento indefinidamente.
    }

    if (!user) {
      set({ carregado: true, userId: null, profile: null });
      return;
    }

    set({ carregado: true, userId: user.id, profile: perfilDoUsuario(user) });
  },

  atualizarNome: async (nome) => {
    const { data, error } = await supabase.auth.updateUser({ data: { nome } });
    if (error) throw error;
    if (data.user) set({ profile: perfilDoUsuario(data.user) });
  },

  sair: async () => {
    await supabase.auth.signOut();
    set({ userId: null, profile: null });
  },
}));
