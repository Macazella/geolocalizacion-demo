interface SummaryTileProps {
  label: string;
  value: number | string;
}

export function SummaryTile({ label, value }: SummaryTileProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
