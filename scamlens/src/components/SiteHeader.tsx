import { Link } from "@tanstack/react-router";
import { ScanSearch } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ScanSearch className="h-4 w-4" />
          </span>
          ScamLens
        </Link>
        <nav className="flex gap-1 text-sm">
          <Link to="/" className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground" activeProps={{ className: "bg-secondary text-foreground" }} activeOptions={{ exact: true }}>
            Check
          </Link>
          <Link to="/map" className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground" activeProps={{ className: "bg-secondary text-foreground" }}>
            Live scam map
          </Link>
        </nav>
      </div>
    </header>
  );
}
