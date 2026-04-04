# Detention & Demurrage Calculator

Free, open-source detention and demurrage fee calculator for truckers and freight brokers. Calculate waiting time fees and container holding charges instantly — no account, no sign-up.

Part of [Warp Tools](https://github.com/dasokolovsky/warp-tools).

---

## Features

### Detention Calculator
- Enter arrival time, free time start, free time duration, and departure
- Configurable hourly rate (default $75/hr) and optional daily cap
- Live timeline visualization — see free time vs. billable time at a glance
- Itemized fee breakdown showing exact billable hours and calculation

### Demurrage Calculator
- Enter container available date, pickup date, and free days
- Supports flat daily rates or tiered rate structures (Days 1–5 / 6–10 / 11+)
- Calendar visualization showing free days vs. billable days
- Handles port (default 5 free days) and rail (default 2 free days) scenarios

### Common Features
- **Live updates** — recalculates instantly as you type
- **Summary card** — total fee displayed prominently (red when fees apply)
- **Print-ready** — clean print layout with nav/buttons hidden
- **Copy to clipboard** — one-click invoice text template
- **Quick presets** — Standard Shipper, Port Demurrage, Rail Demurrage

---

## Quick Start

```bash
# From monorepo root
npm install
cd apps/detention-calculator
npm run dev
# → http://localhost:3011
```

### Docker

```bash
# From monorepo root
docker build -f apps/detention-calculator/Dockerfile -t detention-calculator .
docker run -p 3011:3011 detention-calculator
```

---

## How It Works

### Detention

```
Total time on site = departure - arrival
Billable time = total time - free time (min 0)
Detention fee = billable hours × hourly rate
               (capped at daily max if set)
```

### Demurrage

```
Days held = pickup date - available date
Billable days = days held - free days (min 0)
Demurrage fee = billable days × daily rate
               OR tiered calculation if tiers are set
```

**Tiered example (port):**
- Days 1–5: $150/day
- Days 6–10: $250/day
- Days 11+: $400/day

---

## Ideas & Next Steps

- [ ] **Multi-container** — calculate demurrage across multiple containers at once
- [ ] **Per-diem tracking** — track detention per driver/load over a week
- [ ] **Export to PDF** — generate a proper invoice PDF
- [ ] **Port lookup** — pull free day rules for major US ports (LA/LB, NY, Savannah)
- [ ] **Carrier contract profiles** — save your detention rates per carrier
- [ ] **Dispute letter generator** — generate a formatted dispute letter with calculations
- [ ] **Email report** — send the fee summary directly to a broker or shipper
- [ ] **Historical log** — save past calculations for audit trail
- [ ] **Unit system toggle** — support CAD rates for Canadian carriers
- [ ] **FMCSA linkage** — display detention best practices per FMCSA guidelines

---

## Stack

- **Next.js 16** (App Router, stateless)
- **Tailwind CSS** (dark theme, Warp design system)
- **TypeScript**
- No backend, no database — runs entirely in the browser

---

## License

MIT — see [LICENSE](../../LICENSE)
