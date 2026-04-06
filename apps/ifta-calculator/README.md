# ⛽ IFTA Mileage Calculator

> Free IFTA fuel tax calculator. Enter miles and fuel per state, get your quarterly tax report instantly.

## Features

- ✅ All 48 contiguous US states + DC + Canadian provinces
- ✅ Diesel and gasoline tax rates
- ✅ Automatic MPG and taxable gallon calculation
- ✅ Net tax owed/credit per state
- ✅ Printable IFTA report format
- ✅ CSV export
- ✅ No account needed — runs entirely in your browser
- ✅ Dark theme

## Screenshot

![IFTA Calculator](screenshots/ifta-calculator.png)

## Quick Start

```bash
cd apps/ifta-calculator && npm install && npm run dev
# → http://localhost:3010
```

## How IFTA Works

IFTA (International Fuel Tax Agreement) simplifies fuel tax reporting for interstate carriers. Instead of filing separately in each state, you file **one quarterly return** with your base jurisdiction.

**The math:**
1. Calculate fleet average MPG (total miles ÷ total gallons)
2. For each state: taxable gallons = state miles ÷ fleet MPG
3. Tax owed to state = taxable gallons × state tax rate
4. Tax already paid = gallons purchased in state × state tax rate
5. Net = owed − paid (positive = you owe, negative = you get credit)

States where you drove more than you fueled → you owe.  
States where you fueled more than you drove → you get a credit.

## Tax Rate Data

Rates are from Q1 2026. Update `src/data/ifta-rates.ts` each quarter.

Official rates: [IFTA Inc.](https://www.iftach.org)

## Ideas & Next Steps

### 🟢 Easy
- Add trip-based entry (origin→dest, auto-calculate state miles)
- Save/load calculations to localStorage
- Add previous quarter rate history

### 🟡 Medium
- Multi-vehicle support (enter per truck, aggregate)
- Mileage import from ELD/GPS CSV files
- Province-level Canadian rates (currently using USD equivalents)

### 🔴 Hard
- Integration with Load Dispatch (auto-pull trip mileage)
- AI route parser (paste a route, auto-split by state)
- Direct IFTA filing integration

## License

MIT — Part of [Warp Tools](https://github.com/wearewarp/warp-tools)
