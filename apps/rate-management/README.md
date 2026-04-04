# 📊 Rate Management
> Free, open-source freight rate management. Track lane rates, manage carrier pricing, run RFQs, analyze margins — no more emailed rate sheets.

## Features
- ✅ Lane management (origin → destination with equipment)
- ✅ Carrier rates per lane (spot + contract, multiple carriers)
- ✅ Customer tariffs with margin preview
- ✅ Rate comparison — all carriers for a lane, side-by-side
- ✅ RFQ workflow (create → send → collect responses → award)
- ✅ Margin alerts when lanes drop below target
- ✅ Expiring rate tracking
- ✅ Analytics: rate trends, equipment averages, margin breakdown
- ✅ Dark theme, mobile responsive

## Quick Start
```bash
cd apps/rate-management && npm install && npm run db:migrate && npm run db:seed && npm run dev
# → http://localhost:3008
```

## Tech Stack
Next.js 16, Drizzle ORM + SQLite, Tailwind CSS, Lucide Icons, Zod, TypeScript

## Data Model
5 tables: lanes, carrier_rates, customer_tariffs, rfqs, rfq_responses

## Docker
```bash
docker build -t rate-management .
docker run -p 3008:3008 -e DATABASE_URL=file:/data/rate.db -v $(pwd)/data:/data rate-management
```

## Ideas & Next Steps
### 🟢 Easy
- CSV import for carrier rate sheets
- Rate expiry email reminders
- Lane favorites/bookmarks

### 🟡 Medium
- Historical rate trend charts (line graphs)
- Automated RFQ email distribution
- Rate benchmarking against industry averages

### 🔴 Hard
- Integration with Carrier Management (auto-pull carrier list)
- Integration with Load Dispatch (auto-populate rates when quoting)
- Market rate API integration (DAT, Greenscreens)

## License
MIT
