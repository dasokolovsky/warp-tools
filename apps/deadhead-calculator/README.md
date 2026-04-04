# Deadhead Mileage Calculator

**Free, open-source deadhead cost calculator for truckers and freight brokers.**

Calculate the true cost of empty miles so you can decide whether a load is worth taking before you ever leave the yard.

## What It Does

- Calculates **deadhead fuel cost**, **driver pay**, and **total deadhead cost**
- Shows **effective rate per total mile** and **per loaded mile**
- Computes **net profit** after all costs
- Displays **deadhead ratio gauge** (green < 10%, yellow 10–15%, red > 15%)
- **Worth it? indicator** — green ($1.50+/mi), yellow ($1.00–1.50), red (< $1.00)
- **Revenue vs. costs bar chart**
- **Route summary**: Current → Pickup → Delivery
- **Comparison mode**: Compare multiple loads side by side

## Quick Start

```bash
# From the monorepo root
npm install
cd apps/deadhead-calculator
npm run dev
# → http://localhost:3013
```

## Inputs

| Field | Default | Description |
|-------|---------|-------------|
| Current location | — | Where the truck is now (display only) |
| Pickup location | — | Where to pick up the load (display only) |
| Delivery location | — | Where to deliver the load (display only) |
| Deadhead miles | — | Empty miles to pickup (manual entry) |
| Loaded miles | — | Miles from pickup to delivery |
| Load rate | — | Flat dollar amount for the load |
| Fuel cost/gal | $3.50 | Current diesel price |
| MPG | 6.5 | Truck fuel efficiency |
| Tolls | $0 | Deadhead leg toll costs |
| Driver $/hr | $0 | Driver hourly wage |
| Deadhead hours | 0 | Hours driving empty |
| Other carrier costs | $0 | Insurance, permits, etc. |

## Presets

- **Short deadhead** — 50 mi empty, 500 mi loaded
- **Long deadhead** — 200 mi empty, 800 mi loaded
- **Local run** — 10 mi empty, 50 mi loaded

## Calculations

```
Total miles        = deadhead miles + loaded miles
Deadhead ratio     = deadhead miles / total miles
Fuel cost (DH)     = (deadhead miles / MPG) × fuel $/gal
Total DH cost      = fuel + tolls + (driver $/hr × DH hours)
Rate per total mi  = load rate / total miles
Rate per loaded mi = load rate / loaded miles
Net profit         = load rate − carrier costs − total DH cost
```

## Docker

```bash
# Build from monorepo root
docker build -f apps/deadhead-calculator/Dockerfile -t deadhead-calculator .

# Run
docker run -p 3013:3013 deadhead-calculator
```

## Ideas for Future Versions

- **Map integration** — Auto-calculate deadhead miles from location inputs (Google Maps / HERE / OpenRouteService)
- **Fuel surcharge** — Include FSC in rate calculations
- **Per-mile rate input** — Accept rate as $/mile instead of flat rate
- **Rate history** — Track loads you&apos;ve analyzed over time
- **Break-even finder** — "What rate do I need to make this worth it?"
- **Lane database** — Save and reuse common deadhead routes
- **Load board integration** — Pull rates directly from DAT or Truckstop
- **PDF export** — Print-ready load analysis summary
- **Mobile app** — Quick calculator for drivers on the road

## License

MIT — free to use, fork, and self-host.

Built by [Warp](https://wearewarp.com) as part of the [Warp Tools](https://github.com/dasokolovsky/warp-tools) open-source logistics suite.
