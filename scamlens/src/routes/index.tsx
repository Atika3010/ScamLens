import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, ShieldAlert, ShieldCheck, ShieldQuestion, X, Copy, Share2, Ban, MousePointerClick, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { analyzeMessage, type ScanResult } from "@/lib/scan.functions";
import { CHANNELS, CITIES } from "@/lib/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ScamLens — Check any suspicious SMS, WhatsApp or UPI request" },
      { name: "description", content: "Paste or screenshot a suspicious message and get a Safe, Suspicious or Scam verdict in seconds. Works in Hindi, Hinglish and English." },
      { property: "og:title", content: "ScamLens — AI scam checker for everyone" },
      { property: "og:description", content: "Instant verdict, plain-language reasons and what to do next for suspicious SMS, WhatsApp, UPI and links." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SAMPLES = [
  "Dear customer, your SBI account will be blocked today. Update KYC immediately: http://sbi-kyc-update.in/verify Share OTP with our executive.",
  "Aapka bijli connection aaj raat 9:30 baje kaat diya jayega kyunki pichhle mahine ka bill update nahi hua. Turant electricity officer se sampark karein 9876543210",
  "Hi, I am Priya from HR. Part time job: like YouTube videos and earn ₹3000-₹8000 daily. Reply YES on WhatsApp.",
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function Index() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [channel, setChannel] = useState("SMS");
  const [city, setCity] = useState("Unknown");
  const fileRef = useRef<HTMLInputElement>(null);
  const analyze = useServerFn(analyzeMessage);
  const m = useMutation({
    mutationFn: () => analyze({ data: { text, image: image ?? undefined, channel, city } }),
    onError: (e: Error) => toast.error(e.message),
  });

  const onFile = async (f?: File) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error("Screenshot must be under 5 MB"); return; }
    setImage(await fileToDataUrl(f));
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_1fr]">
        <section>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-safe" /> Hindi · Hinglish · English
          </p>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Got a weird message?<br />
            <span className="text-primary">Check it before you click.</span>
          </h1>
          <p className="mt-3 max-w-lg text-muted-foreground">
            Paste an SMS, WhatsApp text, UPI request or link — or drop a screenshot. Get a verdict in seconds.
          </p>

          <div
            className="mt-6 rounded-2xl border border-border bg-card p-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
            onPaste={(e) => { const f = Array.from(e.clipboardData.files)[0]; if (f) onFile(f); }}
          >
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the suspicious message or link here…"
              className="min-h-36 resize-none border-0 bg-transparent p-1 text-base focus-visible:ring-0"
            />
            {image && (
              <div className="relative mt-2 inline-block">
                <img src={image} alt="Screenshot to check" className="h-28 rounded-lg border border-border object-cover" />
                <button onClick={() => setImage(null)} aria-label="Remove screenshot" className="absolute -right-2 -top-2 rounded-full bg-secondary p-1">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
              <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                <ImagePlus className="h-4 w-4" /> Screenshot
              </Button>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className="h-8 rounded-md border border-input bg-secondary px-2 text-sm" aria-label="Where did you get it">
                {CHANNELS.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="h-8 rounded-md border border-input bg-secondary px-2 text-sm" aria-label="Your city">
                <option value="Unknown">City (optional)</option>
                {CITIES.map((c) => <option key={c.name}>{c.name}</option>)}
              </select>
              <Button className="ml-auto" disabled={m.isPending || (!text.trim() && !image)} onClick={() => m.mutate()}>
                {m.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</> : "Check message"}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Try:</span>
            {["Bank KYC", "Bijli bill", "Job offer"].map((l, i) => (
              <button key={l} onClick={() => { setText(SAMPLES[i] ?? ""); setImage(null); }} className="rounded-full border border-border px-3 py-0.5 text-xs text-muted-foreground hover:text-foreground">
                {l}
              </button>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            We never store your message — only the scam type and city, to power the <Link to="/map" className="underline">live scam map</Link>.
          </p>
        </section>

        <section>
          {m.isPending ? <Scanning /> : m.data ? <Verdict r={m.data} /> : <Empty />}
        </section>
      </main>
    </div>
  );
}

function Empty() {
  return (
    <div className="grid h-full min-h-80 place-items-center rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
      <div>
        <ShieldQuestion className="mx-auto h-10 w-10 text-primary" />
        <p className="mt-3 font-display text-lg text-foreground">Your verdict appears here</p>
        <p className="mt-1 text-sm">Safe, Suspicious or Scam — with reasons and next steps.</p>
      </div>
    </div>
  );
}

function Scanning() {
  return (
    <div className="lens-scan grid min-h-80 place-items-center rounded-2xl border border-border bg-card p-8 text-center">
      <div>
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 font-display">Scanning for scam patterns…</p>
        <p className="text-sm text-muted-foreground">Links, urgency, OTP requests, impersonation</p>
      </div>
    </div>
  );
}

const STYLE = {
  Safe: { icon: ShieldCheck, text: "text-safe", bg: "bg-safe", ring: "border-safe/40" },
  Suspicious: { icon: ShieldQuestion, text: "text-warn", bg: "bg-warn", ring: "border-warn/40" },
  Scam: { icon: ShieldAlert, text: "text-scam", bg: "bg-scam", ring: "border-scam/40" },
} as const;

function Verdict({ r }: { r: ScanResult }) {
  const s = STYLE[r.verdict];
  const Icon = s.icon;
  const share = `⚠️ ${r.family_warning}\n\nChecked with ScamLens`;
  const stepIcons = [MousePointerClick, Ban, PhoneCall];
  return (
    <div className={`animate-in fade-in slide-in-from-bottom-2 rounded-2xl border ${s.ring} bg-card p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon className={`h-10 w-10 ${s.text}`} />
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{r.category}</p>
            <h2 className={`text-3xl font-bold ${s.text}`}>{r.verdict}</h2>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-4xl font-bold">{r.risk_score}</p>
          <p className="text-xs text-muted-foreground">risk / 100</p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${s.bg} transition-all duration-700`} style={{ width: `${r.risk_score}%` }} />
      </div>

      <h3 className="mt-6 text-sm font-semibold text-muted-foreground">Why</h3>
      <ul className="mt-2 space-y-2">
        {r.reasons.map((x) => (
          <li key={x} className="flex gap-2"><span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${s.bg}`} />{x}</li>
        ))}
      </ul>

      <h3 className="mt-6 text-sm font-semibold text-muted-foreground">What to do next</h3>
      <ul className="mt-2 space-y-2">
        {r.next_steps.map((x, i) => {
          const I = stepIcons[i % 3] ?? Ban;
          return <li key={x} className="flex gap-2 rounded-lg bg-secondary px-3 py-2 text-sm"><I className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{x}</li>;
        })}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild>
          <a href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noreferrer">
            <Share2 className="h-4 w-4" /> Warn my family
          </a>
        </Button>
        <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(share); toast.success("Warning copied"); }}>
          <Copy className="h-4 w-4" /> Copy
        </Button>
        {r.verdict !== "Safe" && (
          <Button variant="outline" asChild>
            <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">Report · 1930</a>
          </Button>
        )}
      </div>
    </div>
  );
}
