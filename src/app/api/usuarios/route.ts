import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { usernameParaEmail, usernameValido, normalizarUsername } from "@/lib/auth-domain";

async function exigirGod() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "god") return null;
  return user;
}

export async function GET() {
  const god = await exigirGod();
  if (!god) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const admin = createAdminClient();
  const usuarios: { id: string; username: string; nome: string; role: string; ultimoAcesso: string | null }[] = [];
  let pagina = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    for (const u of data.users) {
      usuarios.push({
        id: u.id,
        username: typeof u.app_metadata?.username === "string" ? u.app_metadata.username : (u.email?.split("@")[0] ?? ""),
        nome: typeof u.user_metadata?.nome === "string" ? u.user_metadata.nome : "",
        role: typeof u.app_metadata?.role === "string" ? u.app_metadata.role : "apontador",
        ultimoAcesso: u.last_sign_in_at ?? null,
      });
    }
    if (data.users.length < 200) break;
    pagina++;
  }

  usuarios.sort((a, b) => a.nome.localeCompare(b.nome));
  return NextResponse.json({ usuarios });
}

export async function POST(request: Request) {
  const god = await exigirGod();
  if (!god) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const nome = String(body?.nome ?? "").trim();
  const username = normalizarUsername(String(body?.username ?? ""));
  const senha = String(body?.senha ?? "");
  const role = body?.role === "administrador" ? "administrador" : "apontador";

  if (!nome) return NextResponse.json({ error: "Informe o nome." }, { status: 400 });
  if (!usernameValido(username)) {
    return NextResponse.json(
      { error: "Usuário deve ter de 3 a 32 caracteres: letras minúsculas, números, ponto, traço ou underline." },
      { status: 400 }
    );
  }
  if (senha.length < 6) {
    return NextResponse.json({ error: "A senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: usernameParaEmail(username),
    password: senha,
    email_confirm: true,
    app_metadata: { role, username },
    user_metadata: { nome },
  });

  if (error) {
    const mensagem = error.message.toLowerCase().includes("already been registered")
      ? "Esse usuário já existe."
      : "Não foi possível criar o usuário.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
