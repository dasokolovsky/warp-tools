# Contributing to Warp Tools

Thanks for your interest in contributing! This guide covers everything you need to get started.

## Development Setup

### Prerequisites

- **Node.js** 20 or higher
- **npm** 10 or higher
- **Git**

### Getting Started

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/warp-tools.git
cd warp-tools

# Install dependencies
npm install

# Set up the database for carrier management
cd apps/carrier-management
npm run db:migrate
npm run db:seed       # Adds sample data

# Start the dev server
npm run dev
# → http://localhost:3001
```

### Running from the Monorepo Root

```bash
# Start all systems
npm run dev

# Start a specific system
npx turbo dev --filter=@warp-tools/carrier-management

# Build everything
npm run build

# Lint everything
npm run lint
```

## Finding Something to Work On

1. Check the **[Issues](https://github.com/wearewarp/warp-tools/issues)** page for open issues
2. Look at each system's README for **"Ideas & Next Steps"** — these are concrete features tagged by difficulty:
   - 🟢 **Easy** — Good first issues, small scope
   - 🟡 **Medium** — Requires understanding of the codebase
   - 🔴 **Hard** — Significant feature work
3. If you have a new idea, [open an issue](https://github.com/wearewarp/warp-tools/issues/new/choose) first to discuss it

## Branch Naming

```
feat/short-description     # New feature
fix/short-description      # Bug fix
docs/short-description     # Documentation
refactor/short-description # Code refactor (no behavior change)
```

Examples:
- `feat/carrier-csv-import`
- `fix/insurance-expiry-calculation`
- `docs/rate-api-examples`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(carrier-mgmt): add CSV import for carrier list
fix(carrier-mgmt): correct insurance expiry date calculation
docs: update API reference in carrier management README
refactor(ui): extract StatusBadge to shared package
chore: update dependencies
```

Format: `type(scope): description`

- **type**: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`
- **scope**: optional, usually the app or package name
- **description**: lowercase, imperative mood ("add" not "added")

## Pull Request Process

1. **Create a branch** from `main`
2. **Make your changes** — keep PRs focused on one thing
3. **Verify it works**:
   ```bash
   npm run build     # Must pass with zero errors
   npm run lint      # Must pass
   ```
4. **Test manually** — run the dev server and verify your changes work in the browser
5. **Open a PR** against `main`
6. **Fill out the PR template** — describe what you changed and why
7. **Wait for CI** — build and lint must pass
8. **Address review feedback** if any

### PR Tips

- Keep PRs small and focused. One feature or fix per PR.
- Include screenshots for UI changes.
- If your PR adds a new feature, update the relevant README.
- If your PR changes the API, update the API reference in the app's README.

## Code Style

### General

- **TypeScript** everywhere — no `any` types unless absolutely necessary
- **Functional components** — no class components
- **Server Components** by default — only use `'use client'` when you need interactivity
- **Named exports** — avoid default exports except for pages

### File Naming

- Components: `PascalCase.tsx` (e.g., `StatusBadge.tsx`)
- Pages: `page.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- Utilities: `camelCase.ts` (e.g., `utils.ts`)

### Database

- Follow the schema conventions in [ARCHITECTURE.md](ARCHITECTURE.md#database)
- Use Drizzle ORM — don't write raw SQL unless necessary
- All schema changes need a migration: `npm run db:generate`

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for:
- How the monorepo is structured
- Where to put different types of code
- How to add a new system
- Database conventions
- API conventions

## Questions?

- Open a [Discussion](https://github.com/wearewarp/warp-tools/discussions) for general questions
- Open an [Issue](https://github.com/wearewarp/warp-tools/issues) for bugs or feature requests
- Tag your PR with `help wanted` if you need guidance

---

Thank you for helping make logistics software better! 🚛
