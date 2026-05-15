import { GoogleGenAI } from "@google/genai";
import type { Lead, Signal, ScoredLead } from "./types.js";

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "tempmail.org", "throwaway.email", "guerrillamail.com",
  "sharklasers.com", "yopmail.com", "10minutemail.com", "trashmail.com",
  "fakeinbox.com", "maildrop.cc", "dispostable.com",
]);

const BOT_UA_PATTERNS = ["python", "go-http", "curl", "scrapy", "bot", "spider", "crawl"];

const GIBBERISH_PATTERN = /^([a-z])\1{2,}$|^[^aeiou]{4,}$|^(test|fake|asdf|qwer|xxxx|aaaa|zzzz)/i;

const COST_PER_LEAD: Record<string, number> = {
  auto_insurance: 28,
  medicare: 35,
  home_services: 22,
  debt_relief: 40,
};

function scoreEmail(lead: Lead): Signal {
  const domain = lead.contact.email.split("@")[1]?.toLowerCase() ?? "";
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { name: "Email Quality", score: 0, maxScore: 20, detail: `Disposable domain: ${domain}`, severity: "bad" };
  }
  const corporate = ["statefarm.com", "allstate.com", "geico.com", "progressive.com"];
  if (corporate.includes(domain)) {
    return { name: "Email Quality", score: 20, maxScore: 20, detail: `Corporate email: ${domain}`, severity: "good" };
  }
  const major = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com", "icloud.com"];
  if (major.includes(domain)) {
    return { name: "Email Quality", score: 16, maxScore: 20, detail: `Major provider: ${domain}`, severity: "good" };
  }
  return { name: "Email Quality", score: 10, maxScore: 20, detail: `Unknown domain: ${domain}`, severity: "warn" };
}

function scorePhone(lead: Lead): Signal {
  const areaCode = lead.contact.phone.match(/\((\d{3})\)/)?.[1] ?? "";
  const zipPrefix = lead.contact.zip.slice(0, 3);
  const regionMatch = Math.abs(parseInt(areaCode) - parseInt(zipPrefix)) < 200;
  if (regionMatch) {
    return { name: "Phone Match", score: 15, maxScore: 15, detail: `Area code ${areaCode} consistent with ZIP ${lead.contact.zip}`, severity: "good" };
  }
  return { name: "Phone Match", score: 5, maxScore: 15, detail: `Area code ${areaCode} doesn't match ZIP ${lead.contact.zip} region`, severity: "warn" };
}

function scoreTimeToFill(lead: Lead): Signal {
  const seconds = lead.behavior.timeToFillMs / 1000;
  if (seconds < 3) {
    return { name: "Fill Speed", score: 0, maxScore: 20, detail: `Filled in ${seconds.toFixed(1)}s — likely bot or auto-fill script`, severity: "bad" };
  }
  if (seconds < 8) {
    return { name: "Fill Speed", score: 5, maxScore: 20, detail: `Filled in ${seconds.toFixed(1)}s — suspiciously fast`, severity: "warn" };
  }
  if (seconds < 15) {
    return { name: "Fill Speed", score: 12, maxScore: 20, detail: `Filled in ${seconds.toFixed(1)}s — fast but possible`, severity: "warn" };
  }
  return { name: "Fill Speed", score: 20, maxScore: 20, detail: `Filled in ${seconds.toFixed(1)}s — natural pace`, severity: "good" };
}

function scoreDataConsistency(lead: Lead): Signal {
  const issues: string[] = [];
  if (GIBBERISH_PATTERN.test(lead.contact.firstName)) issues.push(`Suspicious first name: "${lead.contact.firstName}"`);
  if (GIBBERISH_PATTERN.test(lead.contact.lastName)) issues.push(`Suspicious last name: "${lead.contact.lastName}"`);

  const emailName = lead.contact.email.split("@")[0].toLowerCase();
  const nameInEmail = emailName.includes(lead.contact.firstName.toLowerCase()) || emailName.includes(lead.contact.lastName.toLowerCase());
  if (!nameInEmail && issues.length === 0) issues.push("Email doesn't contain name elements");

  if (issues.length === 0) return { name: "Data Quality", score: 15, maxScore: 15, detail: "All fields consistent and well-formed", severity: "good" };
  if (issues.length === 1) return { name: "Data Quality", score: 8, maxScore: 15, detail: issues[0], severity: "warn" };
  return { name: "Data Quality", score: 2, maxScore: 15, detail: issues.join("; "), severity: "bad" };
}

function scoreSource(lead: Lead): Signal {
  const platform = lead.source.platform;
  const scores: Record<string, number> = { google: 14, meta: 12, native: 11, tiktok: 9, display: 7 };
  const s = scores[platform] ?? 8;
  return { name: "Traffic Source", score: s, maxScore: 15, detail: `Source: ${platform} / ${lead.source.campaign}`, severity: s >= 11 ? "good" : "warn" };
}

function scoreTechnical(lead: Lead): Signal {
  const issues: string[] = [];
  if (lead.technical.isDataCenterIp) issues.push(`Data center IP detected (${lead.technical.ip})`);
  const isBot = BOT_UA_PATTERNS.some(p => lead.technical.userAgent.toLowerCase().includes(p));
  if (isBot) issues.push("Bot user-agent detected");
  if (lead.behavior.scrollDepth < 15) issues.push(`Low scroll depth: ${lead.behavior.scrollDepth}%`);
  if (lead.behavior.pageViews < 2) issues.push("Single page view before submit");

  if (issues.length === 0) return { name: "Technical Signals", score: 15, maxScore: 15, detail: "Residential IP, real browser, normal engagement", severity: "good" };
  if (issues.length === 1) return { name: "Technical Signals", score: 7, maxScore: 15, detail: issues[0], severity: "warn" };
  return { name: "Technical Signals", score: 1, maxScore: 15, detail: issues.join("; "), severity: "bad" };
}

function heuristicScore(lead: Lead): { score: number; signals: Signal[] } {
  const signals = [
    scoreEmail(lead),
    scorePhone(lead),
    scoreTimeToFill(lead),
    scoreDataConsistency(lead),
    scoreSource(lead),
    scoreTechnical(lead),
  ];
  const score = signals.reduce((sum, s) => sum + s.score, 0);
  return { score, signals };
}

let genai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

async function getAiReasoning(lead: Lead, score: number, signals: Signal[]): Promise<string | null> {
  if (!genai) return null;
  try {
    const signalSummary = signals.map(s => `${s.name}: ${s.score}/${s.maxScore} — ${s.detail}`).join("\n");
    const response = await genai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a lead quality analyst for a performance marketing agency that buys leads in insurance, home services, and debt relief verticals. Analyze this lead and provide a 2-3 sentence assessment.

Lead:
- Name: ${lead.contact.firstName} ${lead.contact.lastName}
- Email: ${lead.contact.email}
- Phone: ${lead.contact.phone}
- ZIP: ${lead.contact.zip}, ${lead.contact.state}
- Vertical: ${lead.vertical.replace("_", " ")}
- Source: ${lead.source.platform} / ${lead.source.campaign}
- Fill time: ${(lead.behavior.timeToFillMs / 1000).toFixed(1)}s
- Device: ${lead.behavior.device}
- Page views: ${lead.behavior.pageViews}, Scroll: ${lead.behavior.scrollDepth}%

Heuristic Score: ${score}/100
Signal Breakdown:
${signalSummary}

Give a concise, direct assessment. Focus on what makes this lead trustworthy or suspicious. No preamble.`,
    });
    return response.text?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function scoreLead(lead: Lead): Promise<ScoredLead> {
  const { score, signals } = heuristicScore(lead);
  const verdict = score >= 70 ? "PASS" : score >= 40 ? "REVIEW" : "REJECT";
  const aiReasoning = await getAiReasoning(lead, score, signals);
  const costPerLead = COST_PER_LEAD[lead.vertical] ?? 25;
  const estimatedValue = verdict === "REJECT" ? costPerLead : verdict === "REVIEW" ? costPerLead * 0.3 : 0;

  return { lead, score, verdict, signals, aiReasoning, estimatedValue, scoredAt: Date.now() };
}
