import { ApontadorShell } from "@/components/apontador-shell";

export default function ApontadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ApontadorShell>
      <div className="mx-auto w-full max-w-md">{children}</div>
    </ApontadorShell>
  );
}
