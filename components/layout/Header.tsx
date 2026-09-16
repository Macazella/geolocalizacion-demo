import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
            PI
          </span>
          <span className="text-lg font-semibold text-foreground">Property Intelligence AR</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted">
          <Link href="/buscar" className="hover:text-foreground">
            Buscar
          </Link>
          <Link href="/favoritos" className="hover:text-foreground">
            Favoritos
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Cuenta
          </Link>
        </nav>
      </div>
    </header>
  );
}
