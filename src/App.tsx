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
  const [dark, setDark] = useState(false);
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

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handleSelect = useCallback((lead: ScoredLead) => setSelected(lead), []);

  return (
    <div className="min-h-screen bg-surface-900 p-4 md:p-6 transition-colors duration-300">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-th-primary">LeadShield <span className="text-accent">AI</span></h1>
            <p className="text-xs text-th-muted">Real-time Lead Quality Firewall</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDark(d => !d)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-600 bg-surface-800 text-th-muted transition-colors hover:text-th-primary"
          >
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm0-8a3 3 0 100 6 3 3 0 000-6zm5.657-1.596a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 11-1.061-1.06l1.06-1.061a.75.75 0 011.061 0zm-9.193 9.192a.75.75 0 010 1.061l-1.06 1.06a.75.75 0 01-1.061-1.06l1.06-1.06a.75.75 0 011.061 0zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zm12.657 5.657a.75.75 0 01-1.061 0l-1.06-1.06a.75.75 0 011.06-1.061l1.061 1.06a.75.75 0 010 1.061zm-9.193-9.193a.75.75 0 01-1.06 0l-1.061-1.06a.75.75 0 011.06-1.061l1.06 1.06a.75.75 0 010 1.06z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-xs text-th-muted">Live</span>
          </div>
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
          <h3 className="mb-3 text-sm font-semibold text-th-muted">Pattern Alerts</h3>
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
      <footer className="mt-6 text-center text-xs text-th-faint">
        Built for Pear Media LLC &middot; LeadShield AI v1.0
      </footer>
    </div>
  );
}
