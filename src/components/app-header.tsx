import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function AppHeader({ section, compact = false }: { section?: string; compact?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-card/85 backdrop-blur-sm">
      <div
        className={cn(
          "mx-auto flex items-center gap-2.5 px-4 py-3 sm:px-6",
          compact ? "max-w-md" : "max-w-5xl"
        )}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80">
          <Image
            src="/logo.png"
            alt="Gonçalves & Dias Engenharia"
            width={856}
            height={385}
            className={compact ? "h-7 w-auto" : "h-8 w-auto"}
          />
          <span className={cn("font-medium tracking-tight", compact ? "text-sm" : "text-base")}>
            FULL KIT{compact ? " · Apontador" : ""}
          </span>
        </Link>
        {section && (
          <>
            <span className="h-4 w-px bg-border" />
            <span className="text-sm text-muted-foreground">{section}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
