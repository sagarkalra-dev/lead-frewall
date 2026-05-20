# Changelog

All notable changes to LeadShield AI are documented here.

## [1.0.0] — 2026-05-16

Initial release. Built as a working proof-of-concept for a US performance-marketing agency.

### Added

- **Real-time scoring engine** with 6 independent signal analyzers:
  - Email quality detection (disposable domain blocklist)
  - Phone/ZIP geographic cross-referencing
  - Form fill speed analysis (bot detection)
  - Data consistency validation (gibberish name detection)
  - Traffic source quality scoring
  - Technical fingerprinting (data center IP, bot user-agent, engagement depth)
- **Verdict system** — PASS (70+), REVIEW (40-69), REJECT (0-39) with per-vertical CPL-based savings calculation
- **Gemini AI integration** — plain-English lead quality assessment via Google Gemini 2.0 Flash, with graceful fallback to heuristic-only scoring
- **Pattern detection** — real-time sliding window analysis for IP clustering, email domain clustering, and rapid-fire submission attacks
- **Live dashboard** — React 19 + Tailwind CSS with:
  - 6 stat cards (total, passed, reviewed, rejected, avg score, est. savings)
  - Scrollable real-time lead feed with color-coded verdict badges
  - Detailed lead view with animated score ring, signal breakdown bars, contact data, AI reasoning, and technical fingerprint
  - Pattern alert display
- **Light/dark theme** — CSS variable-based theming with toggle button
- **Mock lead generator** — realistic lead simulation across 4 verticals (auto insurance, Medicare, home services, debt relief) with configurable quality distribution (~55% legit, ~25% suspicious, ~20% fraud)
- **Production-ready deployment** — Render.com blueprint with `render.yaml`, Express 5 static file serving, environment-based port configuration
- **Full proposal document** — README with problem analysis, pipeline diagrams, ROI projections, and step-by-step integration guide

### Technical Decisions

- **Express 5** over Express 4 — native async error handling, modern route syntax
- **Socket.io** over SSE — bidirectional communication, automatic reconnection, room support for future multi-tenant use
- **Heuristic + AI hybrid** — heuristic signals provide deterministic, fast scoring; AI layer adds interpretability without being a single point of failure
- **CSS custom properties for theming** — single source of truth for light/dark themes, no class duplication across components
- **Monolithic server** — appropriate for POC scope; production version would separate the scoring API from the dashboard
