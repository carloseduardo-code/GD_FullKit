import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Home ("/") e Gestão ficam abertas mesmo sem login — Gestão é a "vista" pública
// da obra. Administrador, Apontador, Usuários e Conta exigem login.
const PREFIXOS_PUBLICOS = ["/login", "/gestao"];

function ehRotaPublica(pathname: string): boolean {
  if (pathname === "/") return true;
  return PREFIXOS_PUBLICOS.some((rota) => pathname.startsWith(rota));
}

function podeAcessar(pathname: string, role: string | null): boolean {
  if (role === "god") return true;
  if (pathname.startsWith("/usuarios")) return false;
  if (pathname.startsWith("/config")) return role === "administrador";
  if (pathname.startsWith("/apontador")) return role === "administrador" || role === "apontador";
  return true;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !ehRotaPublica(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Só afasta do /login quem já está logado — "/" e "/gestao" continuam
  // acessíveis normalmente para quem tem sessão.
  if (user && pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // O papel vem no próprio token (app_metadata) — sem consulta extra ao banco.
  if (user) {
    const role = typeof user.app_metadata?.role === "string" ? user.app_metadata.role : null;
    if (!podeAcessar(pathname, role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png|Logo/|api/).*)"],
};
