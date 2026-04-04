<p align="center">
  <h1 align="center">🚛 Warp Tools</h1>
  <p align="center">
    Free, open-source logistics systems that replace your spreadsheets.
    <br />
    <a href="https://github.com/dasokolovsky/warp-tools/issues">Issues</a>
    ·
    <a href="#systems">Systems</a>
    ·
    <a href="#quick-start">Quick Start</a>
    ·
    <a href="CONTRIBUTING.md">Contributing</a>
  </p>
</p>

<p align="center">
  <a href="https://github.com/dasokolovsky/warp-tools/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://github.com/dasokolovsky/warp-tools"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
</p>

---

**Not calculators — real software.** Built by [Warp](https://wearewarp.com) because logistics companies shouldn't pay $500/mo for basic operational software.

Every system works standalone with a local SQLite database. No cloud accounts, no subscriptions, no vendor lock-in. Clone it, run it, own your data.

![Carrier List](screenshots/carrier-list.png)

## Systems

| System | What It Replaces | Status |
|--------|-----------------|--------|
| [**Carrier Management**](apps/carrier-management/) | Carrier spreadsheets, expired insurance surprises, guessed performance | ✅ Available |
| [**Invoice & Payment Tracker**](apps/invoice-tracker/) | Excel aging reports, manual follow-up, lost invoices | ✅ Available |
| [**Document Vault**](apps/document-vault/) | Email attachments, shared drives, "where's the POD?" | ✅ Available |
| **Load Board / Dispatch** | Email chains, WhatsApp groups, phone calls | 📋 Planned |
| **Dock / Appointment Scheduler** | Phone calls, paper sign-in sheets | 📋 Planned |
| **Driver & Settlement** | Excel pay calculations, disputes | 📋 Planned |
| **Rate Management** | Emailed rate sheets, manual comparisons | 📋 Planned |
| **Mini TMS** | All of the above glued together | 📋 Planned |

Each system works standalone. Together they're a platform — systems share carriers, rates, documents, and invoices across a unified schema.

## Quick Start

### Option 1: npm

```bash
git clone https://github.com/dasokolovsky/warp-tools.git
cd warp-tools
npm install

# Run carrier management
cd apps/carrier-management
npm run db:migrate
npm run db:seed    # Optional: sample data
npm run dev        # → http://localhost:3001

# Or run invoice tracker
cd apps/invoice-tracker
npm run db:migrate
npm run db:seed
npm run dev        # → http://localhost:3003

# Or run document vault
cd apps/document-vault
npm run db:migrate
npm run db:seed
npm run dev        # → http://localhost:3004
```

### Option 2: Docker

```bash
git clone https://github.com/dasokolovsky/warp-tools.git
cd warp-tools
docker compose up carrier-management  # → http://localhost:3001
docker compose up invoice-tracker      # → http://localhost:3003
docker compose up document-vault        # → http://localhost:3004
```

## Screenshots

| Carrier List | Carrier Detail | Compliance Dashboard |
|:---:|:---:|:---:|
| ![List](screenshots/carrier-list.png) | ![Detail](screenshots/carrier-detail.png) | ![Dashboard](screenshots/dashboard.png) |

| Add Carrier | Rate Comparison | Mobile |
|:---:|:---:|:---:|
| ![New](screenshots/carrier-new.png) | ![Rates](screenshots/rate-comparison.png) | ![Mobile](screenshots/carrier-list-mobile.png) |

## Architecture

```
warp-tools/
├── apps/
│   ├── carrier-management/    # Carrier relationship management
│   ├── invoice-tracker/       # Invoice & payment tracking
│   └── document-vault/        # Freight document management
├── packages/
│   ├── ui/                    # Shared design system (colors, tokens)
│   ├── config/                # Shared Tailwind + TypeScript config
│   └── freight-core/          # Logistics domain logic (freight classes, density calc)
├── docker-compose.yml         # One-command self-hosting
├── ARCHITECTURE.md            # Deep dive into system design
└── CONTRIBUTING.md            # How to contribute
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for a deep dive into how the monorepo works, how systems connect, and where to put code.

## Tech Stack

- **[Next.js 16](https://nextjs.org/)** — React framework with App Router and Server Components
- **[Drizzle ORM](https://orm.drizzle.team/)** — Type-safe database access (SQLite for self-hosted, Postgres for hosted)
- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first styling with custom Warp design tokens
- **[Radix UI](https://www.radix-ui.com/)** — Accessible headless UI components
- **[Turborepo](https://turbo.build/)** — High-performance monorepo build system
- **[Zod](https://zod.dev/)** — Runtime schema validation

## Contributing

We welcome contributions! See the [Contributing Guide](CONTRIBUTING.md) for:

- Development setup
- Branch naming and commit conventions
- PR process
- Architecture overview
- Ideas for what to build next

Each system's README has an **"Ideas & Next Steps"** section with concrete features to build, tagged by difficulty (🟢 Easy, 🟡 Medium, 🔴 Hard).

## Why Open Source?

Logistics runs on spreadsheets, sticky notes, and $500/mo SaaS that looks like it was built in 2008. We think the industry deserves better — and that basic operational software should be free.

Every system is MIT-licensed. Self-host it, modify it, build on it. No telemetry, no data collection, no strings attached.

## License

[MIT](LICENSE) — do whatever you want with it.

---

<p align="center">
  <strong>Built with ❤️ by <a href="https://wearewarp.com">Warp</a></strong> — Modern freight, simplified.
</p>
