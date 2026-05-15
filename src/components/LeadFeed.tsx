import { useEffect, useRef } from "react";
import type { ScoredLead } from "../types.js";
import { LeadCard } from "./LeadCard.js";

interface Props {
  leads: ScoredLead[];
  selected: ScoredLead | null;
  onSelect: (lead: ScoredLead) => void;
}

export function LeadFeed({ leads, selected, onSelect }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [leads.length]);

  const reversed = [...leads].reverse();

  return (
    <div className="rounded-xl border border-surface-600 bg-surface-800">
      <div className="flex items-center justify-between border-b border-surface-600 px-4 py-3">
        <h2 className="text-sm font-semibold text-th-secondary">Live Lead Feed</h2>
        <span className="rounded-full bg-surface-700 px-2 py-0.5 text-xs text-th-muted">
          {leads.length} leads
        </span>
      </div>
      <div ref={listRef} className="max-h-[520px] overflow-y-auto p-2">
        {reversed.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-th-faint">
            Waiting for leads...
          </div>
        ) : (
          reversed.map(scored => (
            <LeadCard
              key={scored.lead.id}
              scored={scored}
              isSelected={selected?.lead.id === scored.lead.id}
              onClick={() => onSelect(scored)}
            />
          ))
        )}
      </div>
    </div>
  );
}
