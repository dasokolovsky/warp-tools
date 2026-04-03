# 🚛 Warp Tools

**Free, open-source logistics systems. Not calculators — real software that replaces your spreadsheets.**

Built by [Warp](https://wearewarp.com) — because logistics companies shouldn't pay $500/mo for basic operational software.

## Systems

| System | What It Replaces | Status |
|--------|-----------------|--------|
| **Carrier Management** | Your carrier spreadsheet, expired insurance surprises, guessed performance | 📋 Specced |
| **Invoice & Payment Tracker** | Excel aging reports, manual follow-up, lost invoices | 📋 Planned |
| **Document Vault** | Email attachments, shared drives, "where's the POD?" | 📋 Planned |
| **Load Board / Dispatch** | Email chains, WhatsApp groups, phone calls | 📋 Planned |
| **Dock / Appointment Scheduler** | Phone calls, paper sign-in sheets | 📋 Planned |
| **Driver & Settlement** | Excel pay calculations, disputes | 📋 Planned |
| **Rate Management** | Emailed rate sheets, manual comparisons | 📋 Planned |
| **Mini TMS** | All of the above glued together with spreadsheets | 📋 Planned |

Each system works standalone. Together they're a platform.

[View full roadmap →](https://github.com/dasokolovsky/warp-tools/issues)

## Use It

### Hosted (Free)

Visit **[tools.wearewarp.com](https://tools.wearewarp.com)** — no setup, no install, just use it.

### Self-Host

```bash
git clone https://github.com/dasokolovsky/warp-tools.git
cd warp-tools
npm install
npm run dev
```

Each system in `apps/` is independently deployable. See individual READMEs for details.

## Tech Stack

- **Next.js 15** — React framework with App Router
- **Tailwind CSS + shadcn/ui** — Consumer-app quality design
- **Drizzle ORM** — Type-safe database access (Postgres + SQLite)
- **Turborepo** — Monorepo build system
- **Supabase** — Auth, database, storage (hosted version)

## Project Structure

```
warp-tools/
├── apps/
│   ├── carrier-management/  # Carrier relationship management
│   ├── invoice-tracker/     # Invoice & payment tracking
│   ├── document-vault/      # Shipping document management
│   └── ...
├── packages/
│   ├── ui/                  # Shared design system
│   ├── db/                  # Shared database schema
│   ├── auth/                # Auth helpers
│   └── config/              # Shared configs
└── turbo.json
```

## Contributing

PRs welcome! Check `specs/` for detailed system specifications.

## License

MIT — do whatever you want with it.

---

**Built with ❤️ by [Warp](https://wearewarp.com)** — Modern freight, simplified.
