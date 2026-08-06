// FULL KIT usa "usuário" (não e-mail) para login. Por baixo, o Supabase Auth
// continua trabalhando com e-mail — então mapeamos usuário -> um e-mail
// sintético fixo, sem depender de caixa de entrada real nenhuma.
export const EMAIL_DOMAIN = "fullkit.local";

export function normalizarUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function usernameParaEmail(username: string): string {
  return `${normalizarUsername(username)}@${EMAIL_DOMAIN}`;
}

const USERNAME_REGEX = /^[a-z0-9._-]{3,32}$/;

export function usernameValido(username: string): boolean {
  return USERNAME_REGEX.test(normalizarUsername(username));
}
