"use client";

import Link from "next/link";
import { useRef } from "react";
import { Dock, type DockItemDef } from "@/components/reactbits/Dock";
import { Crosshair } from "@/components/reactbits/Crosshair";
import { useIsAdmin } from "@/lib/auth/useIsAdmin";

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 20s-7-4.5-9.5-9C.5 7 2 3 6 3c2.2 0 3.6 1.3 6 4 2.4-2.7 3.8-4 6-4 4 0 5.5 4 3.5 8-2.5 4.5-9.5 9-9.5 9Z" />
  </svg>
);
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
  </svg>
);

export function Header() {
  const isAdmin = useIsAdmin();
  const logoRef = useRef<HTMLAnchorElement>(null);

  const items: DockItemDef[] = [
    { href: "/buscar", label: "Buscar", icon: <SearchIcon /> },
    { href: "/favoritos", label: "Favoritos", icon: <HeartIcon /> },
    { href: "/login", label: "Cuenta", icon: <UserIcon /> },
    ...(isAdmin ? [{ href: "/admin/monitoring", label: "Admin", icon: <ShieldIcon /> }] : []),
  ];

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link ref={logoRef} href="/" className="relative flex items-center gap-2 overflow-visible">
          <Crosshair containerRef={logoRef} />
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
            PI
          </span>
          <span className="text-lg font-semibold text-foreground">Property Intelligence AR</span>
        </Link>
        <Dock items={items} />
      </div>
    </header>
  );
}
