# Rate Confirmation Generator

**Free, open-source rate confirmation document builder for freight brokers.**

Part of [Warp Tools](https://github.com/dasokolovsky/warp-tools) — a suite of open-source logistics software.

## What It Does

Generates professional, print-ready rate confirmation documents instantly. Enter load details, carrier info, and rate — get a formatted rate con that you can print, copy as text, or download as HTML.

**Replaces:** Manual Word/Google Docs templates, $50/mo TMS add-ons.

## Features

- 📋 **Complete Rate Con Form** — broker info, pickup/delivery, carrier, rate, accessorials
- 👁️ **Live Preview** — see the formatted document update as you type
- 🖨️ **Print Ready** — professional layout with `@media print` styles
- 📋 **Copy as Text** — plain text version for email pasting
- 💾 **Download as HTML** — save a self-contained HTML file
- 📁 **Templates** — save and reload form templates from localStorage
- 🏢 **Company Persistence** — your broker info saves automatically to localStorage

## Getting Started

```bash
npm install
npm run dev
# → http://localhost:3014
```

## Tech Stack

- Next.js 16 (App Router)
- Tailwind CSS
- TypeScript
- 100% stateless — no database, no backend, no auth

## Rate Con Format

```
RATE CONFIRMATION
[Broker Company Name]
[Address] | [Phone] | [Email] | MC# [number]

Load #: [reference]              Date: [today]

PICKUP:                          DELIVERY:
[Company Name]                   [Company Name]
[Address, City, State ZIP]       [Address, City, State ZIP]
Date: [date] | Time: [window]    Date: [date] | Time: [window]
Contact: [name] — [phone]        Contact: [name] — [phone]

EQUIPMENT: [type]
WEIGHT: [lbs] | COMMODITY: [description]

RATE: $[amount] [type]
FUEL SURCHARGE: $[amount]
TOTAL: $[total]
PAYMENT TERMS: [terms]

TERMS & CONDITIONS: [standard broker terms]

CARRIER ACCEPTANCE:
Carrier: [name] | MC# [mc] | DOT# [dot]
Driver: [name] | Phone: [phone]
Truck #: [number] | Trailer #: [number]

Signature: ________________  Date: ________________
```

## Ideas / Roadmap

- PDF generation (via `jspdf` or `puppeteer`)
- Email delivery directly from the form
- Multi-stop (more than one pickup or delivery)
- Shipper-facing portal link
- Integration with Carrier Management app for auto-fill carrier details
- Bulk generation from CSV upload
- Digital signature capture

## License

MIT — free forever. Build on it, fork it, deploy it.

---

*Built by [Warp](https://wearewarp.com) — modern freight technology.*
