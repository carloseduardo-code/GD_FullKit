import Link from "next/link";
import { ClipboardList } from "lucide-react";

export default function ApontadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-muted/30">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-medium text-sm">
            <ClipboardList className="size-4 text-primary" />
            FULL KIT · Apontador
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5">{children}</main>
    </div>
  );
}
