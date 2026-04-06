# Freight Margin Calculator

Free, open-source freight broker margin calculator. Built with Next.js, Tailwind CSS, and zero external dependencies.

**No account. No database. Runs entirely in the browser.**

## Features

- **Basic Margin Calculator** — Per-mile, flat rate, or per-CWT. Visual margin gauge with color coding (green >15%, yellow 10–15%, red <10%).
- **Load Profitability Calculator** — Full cost breakdown including fuel, tolls, driver pay, deadhead, accessorials, and factoring fees. Waterfall chart shows true profit.
- **Quick Compare** — Enter one sell rate and multiple carrier buy rates. Best option automatically highlighted.
- **Batch Calculator** — Process multiple loads at once. Paste from spreadsheet. Totals row with average margin.

## Screenshot

![Margin Calculator](screenshots/margin-calculator.png)

## Getting Started

```bash
npm install
npm run dev
# → http://localhost:3012
```

## Build

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t margin-calculator .
docker run -p 3012:3012 margin-calculator
```

## Tech Stack

- Next.js 16 (App Router)
- Tailwind CSS
- Lucide Icons
- TypeScript

## Ideas / Roadmap

- PDF/CSV export of batch results
- Saved load history (localStorage)
- Email summary of profitability analysis
- Lane-level margin benchmarks
- Integration with carrier management app for live rate comparison
- Fuel surcharge schedule import

## License

MIT — free for personal and commercial use.

---

Part of [Warp Tools](https://github.com/wearewarp/warp-tools) — free, open-source logistics software.
