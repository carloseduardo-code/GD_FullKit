import Link from "next/link";
import { ClipboardList, Settings2 } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">FULL KIT</h1>
        <p className="text-muted-foreground max-w-md">
          Gestão da prontidão operacional da obra. Selecione como você quer entrar no sistema.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <Link href="/config">
          <Card className="h-full transition-colors hover:border-primary hover:bg-accent/40 cursor-pointer">
            <CardHeader className="space-y-2">
              <Settings2 className="size-6 text-primary" />
              <CardTitle>Técnico de Planejamento</CardTitle>
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
      </div>
    </main>
  );
}
