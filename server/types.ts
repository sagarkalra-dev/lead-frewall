export interface Lead {
  id: string;
  timestamp: number;
  vertical: "auto_insurance" | "medicare" | "home_services" | "debt_relief";
  source: { platform: string; campaign: string; adSet: string; utm: string };
  contact: { firstName: string; lastName: string; email: string; phone: string; zip: string; state: string };
  behavior: { timeToFillMs: number; pageViews: number; scrollDepth: number; device: string };
  technical: { ip: string; userAgent: string; isDataCenterIp: boolean };
}

export interface Signal {
  name: string;
  score: number;
  maxScore: number;
  detail: string;
  severity: "good" | "warn" | "bad";
}

export interface ScoredLead {
  lead: Lead;
  score: number;
  verdict: "PASS" | "REVIEW" | "REJECT";
  signals: Signal[];
  aiReasoning: string | null;
  estimatedValue: number;
  scoredAt: number;
}

export interface PatternAlert {
  id: string;
  type: "ip_cluster" | "email_domain" | "rapid_fire" | "geo_mismatch";
  message: string;
  severity: "low" | "medium" | "high";
  count: number;
  timestamp: number;
}

export interface DashboardStats {
  totalLeads: number;
  passed: number;
  reviewed: number;
  rejected: number;
  avgScore: number;
  estimatedSavings: number;
  leadsPerMinute: number;
}
