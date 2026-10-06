import { createFileRoute, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import { SiteHeader } from "@/components/SiteHeader";
import { getTrends } from "@/lib/scan.functions";
import { CITIES } from "@/lib/constants";

const trendsQuery = queryOptions({ queryKey: ["trends"], queryFn: () => getTrends(), refetchInterval: 15000 });

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Live Scam Map India — ScamLens" },
      { name: "description", content: "Trending scams across Indian cities, updated live from every ScamLens check." },
      { property: "og:title", content: "Live Scam Map — ScamLens" },
      { property: "og:description", content: "See which scams are trending right now, by city, channel and type." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(trendsQuery),
  component: MapPage,
  errorComponent: ({ error }) => {
    const router = useRouter();
    return (
      <div className="p-10 text-center">
        <p>{error instanceof Error ? error.message : "Could not load trends"}</p>
        <button className="mt-3 underline" onClick={() => router.invalidate()}>Retry</button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-10">Not found</div>,
});

function count<T>(arr: T[], key: (t: T) => string) {
  const m = new Map<string, number>();
  arr.forEach((a) => m.set(key(a), (m.get(key(a)) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function MapPage() {
  const { data } = useSuspenseQuery(trendsQuery);
  const flagged = useMemo(() => data.filter((d) => d.verdict !== "Safe"), [data]);
  const byCity = useMemo(() => new Map(count(flagged, (d) => d.city)), [flagged]);
  const byCat = useMemo(() => count(flagged, (d) => d.category).slice(0, 6), [flagged]);
  const byChannel = useMemo(() => count(flagged, (d) => d.channel), [flagged]);
  const maxCity = Math.max(1, ...byCity.values());
  const scams = data.filter((d) => d.verdict === "Scam").length;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-scam">
              <span className="relative flex h-2 w-2"><span className="pulse-ring absolute h-2 w-2 rounded-full bg-scam" /><span className="h-2 w-2 rounded-full bg-scam" /></span>
              Live
            </p>
            <h1 className="mt-1 text-4xl font-bold">Scam map of India</h1>
            <p className="text-muted-foreground">Built from every check on ScamLens. No messages are stored.</p>
          </div>
          <div className="flex gap-3">
            <Stat label="Checks" value={data.length} />
            <Stat label="Scams caught" value={scams} tone="text-scam" />
            <Stat label="Cities" value={[...byCity.keys()].filter((k) => k !== "Unknown").length} />
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="relative aspect-[4/4.2] rounded-2xl border border-border bg-card">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
              <path d="M30 8 L45 6 L52 14 L48 20 L60 26 L72 30 L82 34 L86 40 L78 44 L74 52 L64 56 L56 66 L50 78 L46 92 L40 90 L34 78 L28 68 L20 60 L16 50 L12 44 L20 38 L24 30 L28 20 Z" fill="var(--secondary)" stroke="var(--border)" strokeWidth="0.4" />
            </svg>
            {CITIES.map((c) => {
              const n = byCity.get(c.name) ?? 0;
              const size = 10 + (n / maxCity) * 34;
              return (
                <div key={c.name} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${c.x}%`, top: `${c.y}%` }}>
                  <div className="relative mx-auto grid place-items-center" style={{ width: size, height: size }}>
                    {n > 0 && <span className="pulse-ring absolute inset-0 rounded-full bg-scam" />}
                    <span className={`relative rounded-full ${n > 0 ? "bg-scam" : "bg-muted-foreground/40"}`} style={{ width: size * 0.5, height: size * 0.5 }} />
                  </div>
                  <p className="whitespace-nowrap text-[11px] font-medium">{c.name} <span className="text-muted-foreground">{n}</span></p>
                </div>
              );
            })}
          </div>

          <div className="space-y-6">
            <Panel title="Trending scam types">
              {byCat.map(([k, v], i) => (
                <div key={k} className="mb-3">
                  <div className="flex justify-between text-sm"><span>{i + 1}. {k}</span><span className="text-muted-foreground">{v}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(v / (byCat[0]?.[1] ?? 1)) * 100}%` }} /></div>
                </div>
              ))}
            </Panel>
            <Panel title="Where scams arrive">
              <div className="flex flex-wrap gap-2">
                {byChannel.map(([k, v]) => (
                  <span key={k} className="rounded-full bg-secondary px-3 py-1 text-sm">{k} <span className="text-muted-foreground">{v}</span></span>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <Panel title="Latest flagged checks" className="mt-6">
          <ul className="divide-y divide-border">
            {flagged.slice(0, 12).map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className={`w-20 shrink-0 font-semibold ${d.verdict === "Scam" ? "text-scam" : "text-warn"}`}>{d.verdict}</span>
                <span className="flex-1 truncate">{d.headline || d.category}</span>
                <span className="hidden text-muted-foreground sm:inline">{d.channel} · {d.city}</span>
                <span className="w-24 text-right text-xs text-muted-foreground">{formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </main>
    </div>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-2">
      <p className={`font-display text-2xl font-bold ${tone}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}
