interface ValuePropCardProps {
  title: string;
  description: string;
}

export function ValuePropCard({ title, description }: ValuePropCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}
