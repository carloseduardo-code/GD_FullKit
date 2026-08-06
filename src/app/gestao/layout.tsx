import Image from "next/image";
import Link from "next/link";

export default function GestaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Gonçalves & Dias Engenharia" width={856} height={385} className="h-8 w-auto" />
            <span className="font-medium">FULL KIT</span>
          </Link>
          <span className="text-muted-foreground text-sm">/ Gestão</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
