# PowerPlan

## P01 - Load-Shedding Window Planner

PowerPlan is a full-stack scheduling application for small print and photocopy businesses that need to manage daily work during scheduled power cuts.

The system allows the user to enter load-shedding windows, add jobs with different electricity requirements, automatically schedule those jobs, and calculate how many minutes the generator needs to run.

---

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript

### Backend

* Node.js
* Express
* TypeScript

### Database

* PostgreSQL
* `pg` PostgreSQL driver

### Validation

* Zod

---

## Core Features

### 1. Power-Cut Management

Users can:

* Add a power-cut start time
* Add a power-cut end time
* Add multiple outage windows
* Remove outage windows
* View outages on a 24-hour timeline

### 2. Job Management

Each job contains:

* Job name
* Duration in minutes
* Power requirement

Supported power requirements:

* `GRID_REQUIRED`
* `GENERATOR_OK`
* `NO_POWER`

### 3. Automatic Scheduling

The application automatically places jobs on the daily timeline.

The scheduling engine ensures that grid-dependent jobs never overlap a power-cut window.

### 4. Generator Usage

The application calculates the total number of generator minutes required for the finished schedule.

Generator usage updates whenever:

* a job is added
* a job is removed
* a power cut is added
* a power cut is removed

---

## Scheduling Rules

### GRID_REQUIRED

These jobs require grid electricity.

If a grid-required job would overlap a power cut, the scheduler moves it forward until the full job fits inside a continuous grid-powered period.

Example:

```text
Power Cut:
12:00 PM - 3:00 PM

Large Format Printing:
Duration: 90 minutes
Power: GRID_REQUIRED
```

The job will be placed outside the outage window.

### GENERATOR_OK

These jobs can run using either grid electricity or the generator.

If part of the job overlaps a power cut, the overlapping time is counted as generator usage.

Example:

```text
Power Cut:
12:00 PM - 3:00 PM

Photocopy Job:
11:30 AM - 12:30 PM
```

Generator usage:

```text
12:00 PM - 12:30 PM
```

Total generator usage:

```text
30 minutes
```

### NO_POWER

These jobs do not require electricity.

Examples:

* Binding
* Cutting
* Packaging
* Customer collection

They can continue during a power cut without increasing generator usage.

---

## Additional Features

PowerPlan also includes:

* PostgreSQL persistence
* Multiple outage windows
* Date-based planning
* Configurable shop opening and closing times
* Generator cost per hour
* Estimated generator operating cost
* Detection of jobs that cannot fit into the working day
* REST API
* API input validation
* Automatic schedule recalculation
* 24-hour visual timeline

---

## System Architecture

```text
User
  |
  v
Next.js Frontend
  |
  | REST API
  v
Node.js + Express Backend
  |
  +-------------------+
  |                   |
  v                   v
PostgreSQL      Scheduling Engine
                       |
                       v
                Generated Plan
                       |
                       v
                24-Hour Timeline
```

---

## Repository Structure

```text
p01-load-shedding-planner/
|
├── EVENT.md
├── README.md
├── package.json
├── package-lock.json
|
├── client/
|   ├── app/
|   ├── components/
|   └── lib/
|
└── server/
    ├── sql/
    |   └── init.sql
    |
    └── src/
        ├── db.ts
        ├── index.ts
        ├── scheduler.ts
        └── time.ts
```

---

# Installation

## Prerequisites

Install:

* Node.js
* npm
* PostgreSQL

pgAdmin can also be used to manage the PostgreSQL database.

---

## 1. Clone the Repository

```bash
git clone YOUR_REPOSITORY_URL
```

Enter the project folder:

```bash
cd p01-load-shedding-planner
```

---

## 2. Create the PostgreSQL Database

Create a database named:

```text
powerplan
```

Using pgAdmin:

```text
Servers
→ PostgreSQL
→ Databases
→ Create
→ Database
```

Set the database name to:

```text
powerplan
```

Or use the PostgreSQL command line:

```bash
createdb -U postgres powerplan
```

---

## 3. Configure Backend Environment Variables

Inside the `server` folder, copy:

```text
.env.example
```

and create:

```text
.env
```

Use:

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/powerplan
```

Replace:

```text
YOUR_PASSWORD
```

with your local PostgreSQL password.

Do not commit the `.env` file to GitHub.

---

## 4. Configure Frontend Environment Variables

Copy:

```text
client/.env.local.example
```

to:

```text
client/.env.local
```

The default backend API URL is:

```text
http://localhost:4000/api
```

---

## 5. Install Dependencies

From the project root:

```bash
npm install
```

---

## 6. Initialize the Database

Run:

```bash
npm run db:init
```

This creates the required PostgreSQL tables.

Optional demo data:

```bash
npm run db:seed
```

---

## 7. Start the Application

Run:

```bash
npm run dev
```

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:4000
```

Backend health check:

```text
http://localhost:4000/api/health
```

---

## Example Workflow

Suppose the shop has a power cut:

```text
12:00 PM - 3:00 PM
```

The owner adds:

```text
Large Format Printing
Duration: 90 minutes
Power: GRID_REQUIRED
```

```text
Photocopy Order
Duration: 60 minutes
Power: GENERATOR_OK
```

```text
Binding
Duration: 30 minutes
Power: NO_POWER
```

PowerPlan automatically creates a valid schedule.

* Large-format printing is placed outside the outage.
* Photocopying can continue using the generator.
* Binding can continue without electricity.
* Generator minutes are calculated automatically.

---

## Hackathon Requirements

PowerPlan implements all four required P01 features:

1. Enter power-cut start and end times and display them on a 24-hour timeline.
2. Add jobs with a name, duration, and power requirement.
3. Automatically schedule jobs so grid-required jobs do not overlap power cuts.
4. Calculate total generator minutes and update them immediately when jobs are added or removed.

---

## Event

The required hackathon event start code is stored in:

```text
EVENT.md
```

---

## Security

Sensitive configuration files are excluded from GitHub.

The following should remain ignored:

```text
.env
server/.env
client/.env.local
node_modules/
.next/
```

Only example environment files should be committed.

Never place a real PostgreSQL password inside the README or `.env.example`.

---

## Project Goal

PowerPlan helps small businesses organize daily work around load shedding, avoid scheduling grid-dependent jobs during outages, and understand how much generator operation is required to complete the day's work.
