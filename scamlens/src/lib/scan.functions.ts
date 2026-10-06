import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ScanResult = {
  verdict: "Safe" | "Suspicious" | "Scam";
  risk_score: number;
  category: string;
  language: string;
  headline: string;
  reasons: string[];
  next_steps: string[];
  family_warning: string;
};

const InputSchema = z.object({
  text: z.string().max(5000).default(""),
  image: z.string().max(7_000_000).optional(),
  channel: z.string().max(30).default("SMS"),
  city: z.string().max(40).default("Unknown"),
});

const SYSTEM = `You are ScamLens, a fraud analyst for everyday Indian users. Analyse the SMS / WhatsApp / UPI request / link / screenshot.
Detect: fake urgency, OTP/PIN/CVV requests, UPI collect requests posing as refunds or prizes, mismatched or lookalike domains, shortened links, KYC/PAN/electricity/courier/digital-arrest/job-task/investment scams, impersonation of banks, govt or police.
Reply in the SAME language style as the message (Hindi, Hinglish or English). Keep each reason under 12 words, plain words, no jargon.
Return ONLY a JSON object, no markdown:
{"verdict":"Safe|Suspicious|Scam","risk_score":0-100,"category":"short scam type e.g. KYC / Bank update, UPI collect request, Job / Task offer, Delivery / Courier, Electricity bill, Digital arrest, Investment, Loan offer, Genuine alert, Other","language":"Hindi|Hinglish|English","headline":"one-line summary under 10 words, no personal data","reasons":["2-4 short reasons"],"next_steps":["3-4 concrete actions; for scams include not clicking, blocking, and reporting at cybercrime.gov.in or calling 1930"],"family_warning":"a short friendly WhatsApp message (under 45 words) warning family about this exact scam, same language"}`;

export const analyzeMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<ScanResult> => {
    if (!data.text.trim() && !data.image) throw new Error("Paste a message or add a screenshot.");
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) throw new Error("AI is not configured.");

    const parts: Record<string, unknown>[] = [
      { text: `Channel: ${data.channel}\nMessage:\n${data.text || "(see screenshot)"}` },
    ];
    if (data.image) {
      const m = data.image.match(/^data:(.+?);base64,(.+)$/);
      if (m) parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
    }

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: "user", parts }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Gemini error", res.status, body);
      if (res.status === 429) throw new Error("Too many checks right now. Please try again in a minute.");
      throw new Error(`Analysis failed (${res.status}).`);
    }

    const json = await res.json();
    const out: string = (json.candidates?.[0]?.content?.parts ?? [])
      .map((p: { text?: string }) => p.text ?? "")
      .join("");

    const match = out.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Couldn't read the analysis. Please try again.");
    const r = JSON.parse(match[0]) as ScanResult;
    r.risk_score = Math.max(0, Math.min(100, Math.round(Number(r.risk_score) || 0)));
    if (!["Safe", "Suspicious", "Scam"].includes(r.verdict)) r.verdict = "Suspicious";
    r.reasons = (r.reasons ?? []).slice(0, 5);
    r.next_steps = (r.next_steps ?? []).slice(0, 5);

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("scam_checks").insert({
        verdict: r.verdict,
        risk_score: r.risk_score,
        category: String(r.category ?? "Other").slice(0, 40),
        channel: data.channel,
        city: data.city,
        language: String(r.language ?? "English").slice(0, 20),
        headline: String(r.headline ?? "").slice(0, 80),
      });
    } catch (e) {
      console.error("log failed", e);
    }
    return r;
  }); 
export const getTrends = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(
    process.env['SUPABASE_URL'] ?? import.meta.env['VITE_SUPABASE_URL'],
    process.env['SUPABASE_PUBLISHABLE_KEY'] ?? import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'], {
    auth: { persistSession: false },
  });
  const { data, error } = await sb
    .from("scam_checks")
    .select("id,verdict,risk_score,category,channel,city,language,headline,created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return data ?? [];
});