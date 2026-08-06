import Image from "next/image";
import Link from "next/link";
import { ClipboardList, LayoutDashboard, Settings2 } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 p-6">
      <div className="text-center space-y-3">
        <Image
          src="/logo.png"
          alt="Gonçalves & Dias Engenharia"
          width={856}
          height={385}
          className="mx-auto h-16 w-auto"
          priority
        />
        <p className="text-muted-foreground max-w-md">
          <span className="font-medium text-foreground">FULL KIT</span> — gestão da prontidão
          operacional da obra. Selecione como você quer entrar no sistema.
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        <Link href="/config">
          <Card className="h-full transition-colors hover:border-primary hover:bg-accent/40 cursor-pointer">
            <CardHeader className="space-y-2">
              <Settings2 className="size-6 text-primary" />
              <CardTitle>Administrador</CardTitle>
              <CardDescription>
                Configurar obras, etapas, serviços notáveis e os checklists FULL KIT.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/apontador">
          <Card className="h-full transition-colors hover:border-primary hover:bg-accent/40 cursor-pointer">
            <CardHeader className="space-y-2">
              <ClipboardList className="size-6 text-primary" />
              <CardTitle>Apontador</CardTitle>
              <CardDescription>
                Registrar em campo o FULL KIT de um serviço: responder o checklist, anexar fotos e salvar.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/gestao">
          <Card className="h-full transition-colors hover:border-primary hover:bg-accent/40 cursor-pointer">
            <CardHeader className="space-y-2">
              <LayoutDashboard className="size-6 text-primary" />
              <CardTitle>Gestão / Consulta</CardTitle>
              <CardDescription>
                Acompanhar a prontidão da obra: status, pendências, FULL KIT preenchido e histórico por elemento.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </main>
  );
}
