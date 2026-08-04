import Link from "next/link";
import { Settings2 } from "lucide-react";

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-3">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Settings2 className="size-4 text-primary" />
            FULL KIT
          </Link>
          <span className="text-muted-foreground text-sm">/ Configuração</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
