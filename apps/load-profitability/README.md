# Load Profitability Calculator

> **Part of [Warp Tools](https://github.com/dasokolovsky/warp-tools)** — free, open-source logistics software.

True cost-per-load analysis for trucking companies and owner-operators. Goes beyond simple margin — factors in **all** costs: fuel, driver pay, tolls, maintenance per mile, insurance per mile, truck payment per mile, deadhead, and overhead allocation.

**Port:** 3015

## Features

### Revenue Tracking
- Flat rate or per-mile rate input
- Fuel surcharge
- Dynamic accessorial line items (detention, lumper, etc.)
- Auto-calculated total revenue

### Direct Cost Analysis
- Fuel cost: calculated from miles ÷ MPG × fuel price (defaults: 6.5 MPG, $3.50/gal)
- Driver pay: per-mile rate, percentage of revenue, or flat amount
- Tolls
- Deadhead fuel cost (empty miles calculation)

### Fixed Cost Allocation
- Monthly costs auto-converted to per-mile rates based on monthly mileage (default: 10,000 mi/mo)
- Truck payment ($/month)
- Insurance ($/month)
- Maintenance reserve ($/mile, default $0.15/mi)
- Permits & licensing ($/month)
- Overhead (office, phone, software, etc.) ($/month)

### Results
- Gross revenue and gross margin
- TRUE NET PROFIT (large, color-coded: green/red)
- Cost per mile breakdown (donut chart by category)
- Revenue per mile vs all-in cost per mile
- Break-even rate: minimum flat and per-mile rate to cover all costs
- Profit waterfall visualization

### Scenario Comparison
- Save up to 2 scenarios
- Side-by-side comparison table with best-value highlighting

## Tech Stack

- **Next.js 16** (App Router, stateless — no database)
- **Tailwind CSS** dark theme
- **TypeScript**
- SVG-based charts (no external chart library)

## Run Locally

```bash
# From repo root
npm install
npm run dev --workspace=apps/load-profitability
# → http://localhost:3015
```

## Docker

```bash
docker build -f apps/load-profitability/Dockerfile -t load-profitability .
docker run -p 3015:3015 load-profitability
```

## Ideas for Future Improvements

- **Load history** — save loads to local storage or a DB for trend analysis
- **Fuel price API** — auto-pull current EIA average diesel prices by region
- **Multi-stop loads** — add intermediate stops with individual mileage segments
- **Driver settlement export** — generate a driver pay statement from load data
- **Rate-per-load reporting** — weekly/monthly profit summaries from saved loads
- **Truck fleet support** — manage multiple trucks with different cost profiles
- **Factoring fee integration** — factor in factoring company fees (percentage of invoice)
- **IFTA fuel tax** — integrate with IFTA data for accurate fuel tax accounting
- **Mobile app** — PWA for quick load profitability checks on the road

## License

MIT — free to use, modify, and deploy.
