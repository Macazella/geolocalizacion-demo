import Link from "next/link";

interface QuickZoneLinkProps {
  label: string;
  partido: string;
}

export function QuickZoneLink({ label, partido }: QuickZoneLinkProps) {
  return (
    <Link
      href={`/buscar?partido=${encodeURIComponent(partido)}`}
      className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-brand-dark transition hover:border-brand hover:bg-brand-light"
    >
      {label}
    </Link>
  );
}
