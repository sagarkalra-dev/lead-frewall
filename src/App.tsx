import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { ScoredLead, DashboardStats, PatternAlert } from "./types.js";
import { StatsBar } from "./components/StatsBar.js";
import { LeadFeed } from "./components/LeadFeed.js";
import { LeadDetail } from "./components/LeadDetail.js";

export default function App() {
  const [leads, setLeads] = useState<ScoredLead[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalLeads: 0, passed: 0, reviewed: 0, rejected: 0, avgScore: 0, estimatedSavings: 0, leadsPerMinute: 0 });
  const [alerts, setAlerts] = useState<PatternAlert[]>([]);
  const [selected, setSelected] = useState<ScoredLead | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(window.location.hostname === "localhost" ? "http://localhost:3001" : window.location.origin);
    socketRef.current = socket;

    socket.on("history", (data: ScoredLead[]) => {
      setLeads(data);
      if (data.length > 0) setSelected(data[data.length - 1]);
    });

    socket.on("lead", (scored: ScoredLead) => {
      setLeads(prev => {
        const next = [...prev, scored];
        return next.length > 100 ? next.slice(-100) : next;
      });
      setSelected(scored);
    });

    socket.on("stats", (data: DashboardStats) => setStats(data));
    socket.on("alerts", (data: PatternAlert[]) => setAlerts(data));

    return () => { socket.disconnect(); };
  }, []);

  const handleSelect = useCallback((lead: ScoredLead) => setSelected(lead), []);

  return (
    <div className="min-h-screen bg-surface-900 p-4 md:p-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">LeadShield <span className="text-accent">AI</span></h1>
            <p className="text-xs text-slate-500">Real-time Lead Quality Firewall</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-xs text-slate-500">Live</span>
        </div>
      </header>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Main Content */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <LeadFeed leads={leads} selected={selected} onSelect={handleSelect} />
        </div>
        <div className="lg:col-span-3">
          <LeadDetail lead={selected} />
        </div>
      </div>

      {/* Pattern Alerts */}
      {alerts.length > 0 && (
        <div className="mt-5 rounded-xl border border-surface-600 bg-surface-800 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-400">Pattern Alerts</h3>
          <div className="flex flex-wrap gap-2">
            {alerts.slice(-6).map(a => (
              <div
                key={a.id}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  a.severity === "high"
                    ? "border-red-500/20 bg-red-500/10 text-red-400"
                    : a.severity === "medium"
                      ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                      : "border-slate-500/20 bg-slate-500/10 text-slate-400"
                }`}
              >
                {a.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-6 text-center text-xs text-slate-600">
        Built for Pear Media LLC &middot; LeadShield AI v1.0
      </footer>
    </div>
  );
}
