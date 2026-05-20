# Architecture

LeadShield AI is a full-stack real-time application with a Node.js backend, React frontend, and AI-powered scoring engine.

## Directory Structure

```
leadshield/
├── server/                     # Backend (Express + Socket.io)
│   ├── index.ts                # Server entry — HTTP, WebSocket, lead simulation loop
│   ├── scorer.ts               # Scoring engine — 6 heuristic signals + Gemini AI reasoning
│   ├── leads.ts                # Mock lead generator — realistic data across 4 verticals
│   └── types.ts                # Shared type definitions (Lead, ScoredLead, Signal, etc.)
│
├── src/                        # Frontend (React + Tailwind)
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Root component — Socket.io connection, theme toggle, layout
│   ├── index.css               # Tailwind directives + light/dark theme CSS variables
│   ├── types.ts                # Frontend type definitions (mirrors server types)
│   └── components/
│       ├── StatsBar.tsx        # 6 metric cards (total, passed, reviewed, rejected, avg, savings)
│       ├── LeadFeed.tsx        # Scrollable real-time lead list
│       ├── LeadCard.tsx        # Individual lead row with score badge and verdict
│       └── LeadDetail.tsx      # Full lead analysis — score ring, signal bars, AI reasoning
│
├── docs/
│   ├── ARCHITECTURE.md         # System architecture (this file)
│   ├── CHANGELOG.md            # Version history and technical decisions
│   └── demo-dashboard.png      # Dashboard screenshot
│
├── index.html                  # HTML shell (loads React app)
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite build config + dev proxy
├── tailwind.config.js          # Tailwind theme (CSS variable-based theming)
├── postcss.config.js           # PostCSS plugins
├── render.yaml                 # Render.com deployment blueprint
├── .env.example                # Environment variable template
└── README.md                   # Full proposal document
```

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                 │
│  React 19 + Tailwind CSS                                        │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐  ┌───────────────┐  │
│  │ StatsBar │  │ LeadFeed │  │ LeadDetail │  │ Pattern Alerts│  │
│  └─────────┘  └──────────┘  └────────────┘  └───────────────┘  │
│       ▲            ▲              ▲               ▲             │
│       └────────────┴──────────────┴───────────────┘             │
│                          Socket.io                              │
└──────────────────────────────┬──────────────────────────────────┘
                               │ WebSocket
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     SERVER (Node.js + Express 5)                 │
│                                                                  │
│  ┌──────────────┐    ┌───────────────┐    ┌──────────────────┐   │
│  │ Lead Intake   │───▶│ Scoring Engine │───▶│ Pattern Detector │  │
│  │              │    │               │    │                  │   │
│  │ - Mock gen   │    │ - 6 heuristic │    │ - IP clustering  │   │
│  │ - POST /api  │    │   signals     │    │ - Email domains  │   │
│  │   (future)   │    │ - Gemini AI   │    │ - Rapid fire     │   │
│  └──────────────┘    │   reasoning   │    └──────────────────┘   │
│                      └───────────────┘                           │
│                             │                                    │
│                             ▼                                    │
│                    ┌─────────────────┐                            │
│                    │ Socket.io Emit  │                            │
│                    │ - lead          │                            │
│                    │ - stats         │                            │
│                    │ - alerts        │                            │
│                    └─────────────────┘                            │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     GEMINI AI (Google Cloud)                      │
│                                                                  │
│  Model: gemini-2.0-flash                                         │
│  Input: Lead data + heuristic scores                             │
│  Output: Plain-English quality assessment                        │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Lead Generation (Demo Mode)

The server generates a realistic mock lead every 2-4 seconds. Each lead includes:

- **Contact data** — name, email, phone, ZIP, state
- **Behavioral data** — time-to-fill, page views, scroll depth, device
- **Source data** — ad platform, campaign, ad set, UTM parameters
- **Technical data** — IP address, user agent, data center flag

Leads are generated with a realistic quality distribution: ~55% legitimate, ~25% suspicious, ~20% fraudulent.

### 2. Scoring Pipeline

Each lead passes through 6 independent signal analyzers:

```
Lead ──▶ Email Quality    ──▶ 0-20 pts
     ──▶ Phone Match      ──▶ 0-15 pts
     ──▶ Fill Speed       ──▶ 0-20 pts
     ──▶ Data Consistency ──▶ 0-15 pts
     ──▶ Traffic Source    ──▶ 0-15 pts
     ──▶ Technical Signals ──▶ 0-15 pts
                              ─────────
                              0-100 total
```

**Verdict thresholds:**
- 70-100 → PASS (deliver to CRM)
- 40-69 → REVIEW (manual check)
- 0-39 → REJECT (block)

### 3. AI Reasoning (Optional)

If `GEMINI_API_KEY` is set, each scored lead is sent to Gemini Flash for a 2-3 sentence plain-English assessment. The AI receives the raw lead data plus the heuristic signal breakdown and provides independent analysis.

Falls back gracefully to heuristic-only scoring when no API key is configured.

### 4. Pattern Detection

After scoring, each lead is checked against a sliding 30-second window for coordinated fraud:

| Pattern | Trigger | Severity |
|---|---|---|
| IP cluster | 3+ leads from same IP in 30s | High |
| Email domain cluster | 4+ leads from same non-major domain in 30s | Medium |
| Rapid fire | 5+ leads in 10s from any source | High |

### 5. Real-time Broadcast

Scored leads, updated stats, and pattern alerts are emitted to all connected clients via Socket.io. The frontend maintains a rolling buffer of the last 100 leads.

## Production Integration Path

Replace the mock lead generator with a REST endpoint:

```
POST /api/score
Content-Type: application/json

{ lead data }

Response: { score, verdict, signals, aiReasoning }
```

Connect this to LeadByte's outbound webhook. Route the response verdict back to LeadByte for conditional CRM delivery.

## Tech Stack

| Component | Technology | Why |
|---|---|---|
| Runtime | Node.js 20+ (ESM) | Modern async, native ESM support |
| Server | Express 5 | Latest stable, native async support |
| Real-time | Socket.io 4 | Reliable WebSocket with auto-fallback |
| AI | Google Gemini Flash | Fast, cheap, high-quality reasoning |
| Frontend | React 19 | Component-based, fast rendering |
| Styling | Tailwind CSS 3 | Utility-first, CSS variable theming |
| Build | Vite 6 | Sub-second HMR, optimized production builds |
| Types | TypeScript (strict) | End-to-end type safety |
| Deploy | Render | Free tier, WebSocket support |
