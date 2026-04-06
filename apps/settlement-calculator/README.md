# Driver Settlement Calculator

Free, open-source net pay calculator for truck drivers. No account or database required — all calculations happen in your browser.

## Features

- **5 pay types:** Per Mile, Percentage of Revenue, Flat Rate, Hourly, Per Stop
- **Multi-trip entry** with auto-calculated pay per trip based on your pay type + rate
- **Deductions** — fixed dollar or percentage of gross, with common presets (Insurance, Truck Lease, ELD)
- **Reimbursements** — fuel receipts, tolls, etc.
- **Advances** — track pay advances with date and reason
- **Live settlement summary** — gross, deductions, advances, reimbursements, and net pay
- **Visual breakdown bar** — see where your money goes at a glance
- **Print Statement** — clean printable PDF with company header, driver name, period, and itemized breakdown

## Screenshot

![Settlement Calculator](screenshots/settlement-calculator.png)

## Getting Started

```bash
npm install
npm run dev
# → http://localhost:3016
```

## Docker

```bash
docker build -t settlement-calculator .
docker run -p 3016:3016 settlement-calculator
```

## Stack

- Next.js 16 (App Router, fully client-side)
- Tailwind CSS + Lucide Icons
- Zero database dependencies — pure stateless calculator

## Part of Warp Tools

This is one of many free logistics tools in the [Warp Tools](https://github.com/wearewarp/warp-tools) monorepo. Built by [Warp](https://wearewarp.com).

## Ideas / Roadmap

- Save/load settlement templates (localStorage)
- Export to CSV or PDF
- Multi-driver comparison view
- Integration with the full Driver Settlements system (with DB persistence)
- Weekly/biweekly period auto-fill
- Per-mile rate benchmarking hints
