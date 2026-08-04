import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StatusServico } from "@/lib/types";

const CONFIG: Record<StatusServico, { label: string; className: string }> = {
  pronto: {
    label: "Pronto para Execução",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  },
  bloqueado: {
    label: "Bloqueado",
    className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
  nao_iniciado: {
    label: "Não Iniciado",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function StatusBadge({ status, className }: { status: StatusServico; className?: string }) {
  const config = CONFIG[status];
  return (
    <Badge variant="outline" className={cn(config.className, "font-medium", className)}>
      {config.label}
    </Badge>
  );
}
