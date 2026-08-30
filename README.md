# PowerPlan — P01 Load-Shedding Window Planner

Full-stack hackathon implementation using:

- Next.js 16 + React + TypeScript
- Node.js + Express + TypeScript
- PostgreSQL
- `pg` for database access
- Zod for API validation

## Hackathon requirements covered

1. Enter one or more power-cut start/end times and display them on a 24-hour timeline.
2. Add jobs with a name, duration, and one of three power requirements.
3. Automatically schedule jobs. Grid-required jobs never overlap a power cut.
4. Generator minutes are calculated from the finished plan and recalculate immediately after job/outage changes.

## Real-world additions

- PostgreSQL persistence
- Multiple outage windows per date
- Shop opening/closing hours
- Generator cost per hour
- Estimated generator operating cost
- Unscheduled-job detection when the day is full
- REST API with validation
- Date-based planning

## Scheduling rule

Jobs are processed in queue order.

- `GRID_REQUIRED`: moves forward until the full job fits into a continuous grid-on interval.
- `GENERATOR_OK`: stays in queue order; any part that overlaps a power cut is counted as generator usage.
- `NO_POWER`: runs normally even during a cut and adds no generator minutes.

This makes the rule explainable and deterministic for judging.

---

## 1. PostgreSQL setup

Create a database named:

```text
powerplan
```

Using pgAdmin: Databases → Create → Database → name it `powerplan`.

Or with the PostgreSQL command line:

```bash
createdb -U postgres powerplan
```

## 2. Configure environment files

Copy:

```text
server/.env.example
```

to:

```text
server/.env
```

Then replace `YOUR_PASSWORD` in `DATABASE_URL` with your local PostgreSQL password.

Copy:

```text
client/.env.local.example
```

to:

```text
client/.env.local
```

The default frontend API URL is already `http://localhost:4000/api`.

## 3. Install packages

From the root folder:

```bash
npm install
```

## 4. Create the database tables

```bash
npm run db:init
```

Optional demo data:

```bash
npm run db:seed
```

## 5. Start frontend + backend

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Backend health check:

```text
http://localhost:4000/api/health
```

## Repository structure

```text
p01-load-shedding-planner/
├── EVENT.md
├── package.json
├── client/
│   ├── app/
│   ├── components/
│   └── lib/
└── server/
    ├── sql/init.sql
    └── src/
        ├── db.ts
        ├── index.ts
        ├── scheduler.ts
        └── time.ts
```

## Important first Git commit

The required event code is already in `EVENT.md`.

Make that the first event work commit:

```bash
git init
git add EVENT.md
git commit -m "chore: add hackathon event start code"
```

Then commit the implementation:

```bash
git add .
git commit -m "feat: build load-shedding window planner"
```
