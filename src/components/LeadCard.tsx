import type { ScoredLead } from "../types.js";

const VERTICAL_LABELS: Record<string, string> = {
  auto_insurance: "Auto Insurance",
  medicare: "Medicare",
  home_services: "Home Services",
  debt_relief: "Debt Relief",
};

const VERDICT_STYLES: Record<string, string> = {
  PASS: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  REVIEW: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  REJECT: "bg-red-500/15 text-red-600 border-red-500/30",
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function LeadCard({ scored, isSelected, onClick }: { scored: ScoredLead; isSelected: boolean; onClick: () => void }) {
  const { lead, score, verdict } = scored;
  const borderGlow = verdict === "PASS" ? "glow-green" : verdict === "REVIEW" ? "glow-amber" : "glow-red";

  return (
    <button
      onClick={onClick}
      className={`mb-1.5 w-full animate-slide-in rounded-lg border p-3 text-left transition-all ${
        isSelected
          ? `border-accent/40 bg-accent/5 ${borderGlow}`
          : "border-transparent bg-surface-700/50 hover:border-surface-500 hover:bg-surface-700"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold ${VERDICT_STYLES[verdict]}`}>
            {score}
          </div>
          <div>
            <p className="text-sm font-medium text-th-primary">
              {lead.contact.firstName} {lead.contact.lastName.charAt(0)}.
            </p>
            <p className="text-xs text-th-muted">
              {VERTICAL_LABELS[lead.vertical]} &middot; {lead.source.platform}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${VERDICT_STYLES[verdict]}`}>
            {verdict}
          </span>
          <span className="text-[10px] text-th-faint">{timeAgo(scored.scoredAt)}</span>
        </div>
      </div>
    </button>
  );
}
