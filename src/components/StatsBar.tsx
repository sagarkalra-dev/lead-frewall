import type { DashboardStats } from "../types.js";

const cards: { key: keyof DashboardStats; label: string; format: (v: number) => string; color: string }[] = [
  { key: "totalLeads", label: "Total Leads", format: v => v.toLocaleString(), color: "text-white" },
  { key: "passed", label: "Passed", format: v => v.toLocaleString(), color: "text-emerald-400" },
  { key: "reviewed", label: "In Review", format: v => v.toLocaleString(), color: "text-amber-400" },
  { key: "rejected", label: "Rejected", format: v => v.toLocaleString(), color: "text-red-400" },
  { key: "avgScore", label: "Avg Score", format: v => `${v}/100`, color: "text-accent-light" },
  { key: "estimatedSavings", label: "Est. Savings", format: v => `$${v.toLocaleString()}`, color: "text-emerald-400" },
];

export function StatsBar({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map(c => (
        <div key={c.key} className="rounded-xl border border-surface-600 bg-surface-800 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{c.label}</p>
          <p className={`mt-1 text-2xl font-bold ${c.color}`}>
            {c.format(stats[c.key])}
          </p>
        </div>
      ))}
    </div>
  );
}
