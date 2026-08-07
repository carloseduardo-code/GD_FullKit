import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StatusServico } from "@/lib/types";

const CONFIG: Record<StatusServico, { label: string; className: string }> = {
  pronto: {
    label: "Pronto para Execução",
    className: "bg-primary-tint text-primary-tint-foreground border-primary-tint-border",
  },
  bloqueado: {
    label: "Bloqueado",
    className: "bg-destructive-tint text-destructive-tint-foreground border-destructive-tint-border",
  },
  nao_iniciado: {
    label: "Não Iniciado",
    className: "bg-surface-2 text-muted-foreground border-border",
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
