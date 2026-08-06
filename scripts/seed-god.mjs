// Cria (ou corrige) o primeiro acesso GOD do FULL KIT.
// Uso: npm run seed:god
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const USERNAME = "gd";
const SENHA = "Cc@2026@";
const NOME = "GD";
const EMAIL_DOMAIN = "fullkit.local";

function carregarEnv() {
  const raiz = dirname(dirname(fileURLToPath(import.meta.url)));
  const envPath = join(raiz, ".env");
  if (!existsSync(envPath)) return;
  for (const linha of readFileSync(envPath, "utf8").split("\n")) {
    const match = linha.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}
carregarEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chaveSecreta = process.env.SUPABASE_SECRET_KEY;

if (!url || !chaveSecreta) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SECRET_KEY no .env.");
  process.exit(1);
}

const supabase = createClient(url, chaveSecreta, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = `${USERNAME}@${EMAIL_DOMAIN}`;
const metadados = {
  email,
  password: SENHA,
  email_confirm: true,
  app_metadata: { role: "god", username: USERNAME },
  user_metadata: { nome: NOME },
};

async function encontrarUsuarioPorEmail(alvo) {
  let pagina = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (error) throw error;
    const encontrado = data.users.find((u) => u.email === alvo);
    if (encontrado) return encontrado;
    if (data.users.length < 200) return null;
    pagina++;
  }
}

async function main() {
  const { error: erroCriar } = await supabase.auth.admin.createUser(metadados);

  if (!erroCriar) {
    console.log(`Acesso GOD criado. Usuário: ${USERNAME}  Senha: ${SENHA}`);
    return;
  }

  if (!erroCriar.message.toLowerCase().includes("already been registered")) {
    console.error("Não foi possível criar o usuário GOD:", erroCriar.message);
    process.exit(1);
  }

  const existente = await encontrarUsuarioPorEmail(email);
  if (!existente) {
    console.error("Usuário já existia mas não foi possível localizá-lo.");
    process.exit(1);
  }

  const { error: erroAtualizar } = await supabase.auth.admin.updateUserById(existente.id, {
    password: SENHA,
    app_metadata: { ...existente.app_metadata, role: "god", username: USERNAME },
    user_metadata: { ...existente.user_metadata, nome: NOME },
  });

  if (erroAtualizar) {
    console.error("Não foi possível atualizar o usuário GOD existente:", erroAtualizar.message);
    process.exit(1);
  }

  console.log(`Acesso GOD atualizado. Usuário: ${USERNAME}  Senha: ${SENHA}`);
}

main();
