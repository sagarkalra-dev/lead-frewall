import type { ScoredLead, Signal } from "../types.js";

const VERTICAL_LABELS: Record<string, string> = {
  auto_insurance: "Auto Insurance",
  medicare: "Medicare",
  home_services: "Home Services",
  debt_relief: "Debt Relief",
};

function ScoreRing({ score, verdict }: { score: number; verdict: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = verdict === "PASS" ? "#10b981" : verdict === "REVIEW" ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg className="absolute -rotate-90" width="128" height="128">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="text-center">
        <p className="text-3xl font-extrabold text-white">{score}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">/ 100</p>
      </div>
    </div>
  );
}

function SignalBar({ signal }: { signal: Signal }) {
  const pct = (signal.score / signal.maxScore) * 100;
  const barColor = signal.severity === "good" ? "bg-emerald-500" : signal.severity === "warn" ? "bg-amber-500" : "bg-red-500";
  const textColor = signal.severity === "good" ? "text-emerald-400" : signal.severity === "warn" ? "text-amber-400" : "text-red-400";

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-300">{signal.name}</span>
        <span className={`font-mono font-bold ${textColor}`}>{signal.score}/{signal.maxScore}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-600">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-0.5 text-[11px] text-slate-500">{signal.detail}</p>
    </div>
  );
}

export function LeadDetail({ lead }: { lead: ScoredLead | null }) {
  if (!lead) {
    return (
      <div className="flex h-[580px] items-center justify-center rounded-xl border border-surface-600 bg-surface-800">
        <p className="text-sm text-slate-600">Select a lead to view details</p>
      </div>
    );
  }

  const { lead: l, score, verdict, signals, aiReasoning, estimatedValue } = lead;
  const verdictColor = verdict === "PASS" ? "text-emerald-400" : verdict === "REVIEW" ? "text-amber-400" : "text-red-400";
  const verdictBg = verdict === "PASS" ? "bg-emerald-500/10 border-emerald-500/30" : verdict === "REVIEW" ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30";

  return (
    <div className="rounded-xl border border-surface-600 bg-surface-800 p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <ScoreRing score={score} verdict={verdict} />
          <div>
            <h2 className="text-lg font-bold text-white">{l.contact.firstName} {l.contact.lastName}</h2>
            <p className="text-sm text-slate-400">{VERTICAL_LABELS[l.vertical]}</p>
            <div className={`mt-2 inline-block rounded-lg border px-3 py-1 text-sm font-bold ${verdictBg} ${verdictColor}`}>
              {verdict}
            </div>
            {estimatedValue > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Est. savings: <span className="font-semibold text-emerald-400">${estimatedValue}</span> per blocked lead
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Left: Signals */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Signal Breakdown</h3>
          {signals.map(s => <SignalBar key={s.name} signal={s} />)}
        </div>

        {/* Right: Details + AI */}
        <div>
          {/* Contact Info */}
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Contact Data</h3>
          <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-surface-700/50 p-3 text-xs">
            <Detail label="Email" value={l.contact.email} />
            <Detail label="Phone" value={l.contact.phone} />
            <Detail label="Location" value={`${l.contact.zip}, ${l.contact.state}`} />
            <Detail label="Device" value={l.behavior.device} />
            <Detail label="Source" value={`${l.source.platform} / ${l.source.adSet}`} />
            <Detail label="Fill Time" value={`${(l.behavior.timeToFillMs / 1000).toFixed(1)}s`} />
            <Detail label="Page Views" value={`${l.behavior.pageViews}`} />
            <Detail label="Scroll Depth" value={`${l.behavior.scrollDepth}%`} />
          </div>

          {/* AI Reasoning */}
          {aiReasoning && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-light">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.784l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.784.785l.24 1.192a1 1 0 001.96 0l.239-1.192a1 1 0 01.784-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.784-.784l-.24-1.192zM5.99 9.503a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192z" />
                </svg>
                AI Analysis
              </h3>
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-xs leading-relaxed text-slate-300">
                {aiReasoning}
              </div>
            </div>
          )}

          {/* Technical */}
          <div className="mt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Technical Fingerprint</h3>
            <div className="rounded-lg bg-surface-700/50 p-3 font-mono text-[11px] text-slate-500">
              <p>IP: {l.technical.ip} {l.technical.isDataCenterIp && <span className="text-red-400">[DATA CENTER]</span>}</p>
              <p className="mt-1 truncate">UA: {l.technical.userAgent}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-slate-500">{label}: </span>
      <span className="font-medium text-slate-300">{value}</span>
    </div>
  );
}
