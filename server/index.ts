import "dotenv/config";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { generateLead } from "./leads.js";
import { scoreLead } from "./scorer.js";
import type { DashboardStats, PatternAlert, ScoredLead } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(join(__dirname, "../dist")));

const history: ScoredLead[] = [];
const alerts: PatternAlert[] = [];
let alertCounter = 0;

function computeStats(): DashboardStats {
  const total = history.length;
  const passed = history.filter(l => l.verdict === "PASS").length;
  const reviewed = history.filter(l => l.verdict === "REVIEW").length;
  const rejected = history.filter(l => l.verdict === "REJECT").length;
  const avgScore = total > 0 ? Math.round(history.reduce((s, l) => s + l.score, 0) / total) : 0;
  const savings = history.reduce((s, l) => s + l.estimatedValue, 0);
  const now = Date.now();
  const oneMinAgo = now - 60_000;
  const recentCount = history.filter(l => l.scoredAt > oneMinAgo).length;
  return { totalLeads: total, passed, reviewed, rejected, avgScore, estimatedSavings: savings, leadsPerMinute: recentCount };
}

function detectPatterns(scored: ScoredLead) {
  const recentWindow = history.filter(l => l.scoredAt > Date.now() - 30_000);

  const sameIp = recentWindow.filter(l => l.lead.technical.ip === scored.lead.technical.ip);
  if (sameIp.length >= 3) {
    const existing = alerts.find(a => a.type === "ip_cluster" && a.message.includes(scored.lead.technical.ip));
    if (existing) {
      existing.count = sameIp.length;
      existing.timestamp = Date.now();
    } else {
      alerts.push({
        id: `alert_${++alertCounter}`,
        type: "ip_cluster",
        message: `${sameIp.length} leads from IP ${scored.lead.technical.ip} in 30s`,
        severity: "high",
        count: sameIp.length,
        timestamp: Date.now(),
      });
    }
  }

  const emailDomain = scored.lead.contact.email.split("@")[1];
  const sameDomain = recentWindow.filter(l => l.lead.contact.email.endsWith(`@${emailDomain}`));
  if (sameDomain.length >= 4 && !["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"].includes(emailDomain)) {
    const existing = alerts.find(a => a.type === "email_domain" && a.message.includes(emailDomain));
    if (!existing) {
      alerts.push({
        id: `alert_${++alertCounter}`,
        type: "email_domain",
        message: `Unusual cluster: ${sameDomain.length} leads from @${emailDomain}`,
        severity: "medium",
        count: sameDomain.length,
        timestamp: Date.now(),
      });
    }
  }

  const rapidFire = recentWindow.filter(l => l.scoredAt > Date.now() - 10_000);
  if (rapidFire.length >= 5) {
    const existing = alerts.find(a => a.type === "rapid_fire" && a.timestamp > Date.now() - 15_000);
    if (!existing) {
      alerts.push({
        id: `alert_${++alertCounter}`,
        type: "rapid_fire",
        message: `Rapid fire: ${rapidFire.length} leads in 10 seconds`,
        severity: "high",
        count: rapidFire.length,
        timestamp: Date.now(),
      });
    }
  }
}

io.on("connection", (socket) => {
  console.log(`[LeadShield] Client connected: ${socket.id}`);
  socket.emit("history", history.slice(-50));
  socket.emit("stats", computeStats());
  socket.emit("alerts", alerts.slice(-10));
  socket.on("disconnect", () => console.log(`[LeadShield] Client disconnected: ${socket.id}`));
});

async function processLead() {
  const lead = generateLead();
  const scored = await scoreLead(lead);
  history.push(scored);
  if (history.length > 500) history.splice(0, history.length - 500);
  detectPatterns(scored);
  io.emit("lead", scored);
  io.emit("stats", computeStats());
  if (alerts.length > 0) io.emit("alerts", alerts.slice(-10));
}

function scheduleNext() {
  const delay = 2000 + Math.random() * 3000;
  setTimeout(async () => {
    await processLead();
    scheduleNext();
  }, delay);
}

app.get("*", (_req, res) => {
  res.sendFile(join(__dirname, "../dist/index.html"));
});

const PORT = parseInt(process.env.PORT ?? "3001");
server.listen(PORT, () => {
  console.log(`\n  LeadShield AI Server`);
  console.log(`  Running on http://localhost:${PORT}`);
  console.log(`  AI Scoring: ${process.env.GEMINI_API_KEY ? "ENABLED (Gemini Flash)" : "DISABLED (heuristic only)"}\n`);
  scheduleNext();
});
