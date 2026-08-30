# PowerPlan

## P01 - Load-Shedding Window Planner

PowerPlan is a full-stack scheduling application for small print and photocopy businesses that need to organize daily work around power cuts.

The application allows users to enter load-shedding windows, add jobs with different electricity requirements, automatically generate a valid daily schedule, and calculate the generator usage required to complete the work.

## Live Demo

Frontend:

```text
https://load-shedding-planner-client.vercel.app
```

Backend API:

```text
https://load-shedding-planner.onrender.com
```

Backend health check:

```text
https://load-shedding-planner.onrender.com/api/health
```

---

## Problem

A small print and photocopy shop may lose grid electricity at different times each day.

Different jobs have different power requirements:

* some jobs require grid electricity
* some jobs can continue using a generator
* some jobs require no electricity

Manually planning these jobs can create delays, unnecessary generator usage, and conflicts between jobs and power-cut periods.

PowerPlan automatically builds a daily work schedule based on the outage windows and job requirements.

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
* Neon PostgreSQL for production
* `pg` PostgreSQL driver

### Validation

* Zod

### Deployment

* Vercel for the frontend
* Render for the backend
* Neon for PostgreSQL

---

## Hackathon Requirements

PowerPlan implements all four required P01 features.

### 1. Power-Cut Window Input

Users can enter:

* power-cut start time
* power-cut end time

The outage is displayed on a 24-hour timeline.

The application also supports multiple outage windows for the same date.

### 2. Job Management

Each job contains:

* job name
* duration in minutes
* power requirement

Supported power requirements:

```text
GRID_REQUIRED
GENERATOR_OK
NO_POWER
```

### 3. Automatic Job Scheduling

Jobs are automatically placed on the daily timeline.

The scheduler ensures that jobs requiring grid electricity are never scheduled inside a power-cut period.

### 4. Generator Minute Calculation

The application calculates the total generator minutes required by the finished schedule.

The value is recalculated whenever:

* a job is added
* a job is removed
* a power cut is added
* a power cut is removed
* planner settings change

---

## Scheduling Rules

Jobs are processed in queue order.

### GRID_REQUIRED

These jobs require grid electricity.

If a job would overlap a power cut, the scheduler moves it forward until the complete job fits inside a continuous grid-powered period.

Example:

```text
Power Cut:
12:00 PM - 3:00 PM

Large Format Printing:
Duration: 90 minutes
Power Requirement: GRID_REQUIRED
```

The job is moved outside the outage period.

### GENERATOR_OK

These jobs can run using either grid electricity or the generator.

If any part of the job overlaps a power cut, the overlapping portion is counted as generator usage.

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

Examples include:

* binding
* cutting
* packaging
* customer collection

They can continue during a power cut without increasing generator usage.

---

## Additional Features

PowerPlan also includes:

* PostgreSQL persistence
* multiple outage windows
* date-based planning
* configurable shop opening and closing times
* generator cost per hour
* estimated generator operating cost
* unscheduled-job detection
* REST API
* API request validation
* automatic schedule recalculation
* 24-hour visual timeline
* production deployment

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
  +----------------------+
  |                      |
  v                      v
Neon PostgreSQL     Scheduling Engine
                           |
                           v
                    Generated Daily Plan
                           |
                           v
                    24-Hour Timeline
```

---

## Repository Structure

```text
load-shedding-planner/
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

# Local Installation

## Prerequisites

Install:

* Node.js
* npm
* PostgreSQL

pgAdmin can optionally be used for PostgreSQL management.

---

## 1. Clone the Repository

```bash
git clone https://github.com/AlImranAlif/load-shedding-planner.git
```

Enter the project directory:

```bash
cd load-shedding-planner
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

Database name:

```text
powerplan
```

Alternatively:

```bash
createdb -U postgres powerplan
```

---

## 3. Configure Backend Environment Variables

Inside the `server` directory, copy:

```text
.env.example
```

and create:

```text
.env
```

Example:

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

Do not commit `server/.env` to GitHub.

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

For local development, use:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
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

Optional sample data:

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

* large-format printing is placed outside the outage
* photocopying may continue using the generator
* binding can continue without electricity
* generator usage is calculated automatically

---

## API Endpoints

### Health Check

```text
GET /api/health
```

### Planner

```text
GET /api/planner?date=YYYY-MM-DD
```

### Add Power Cut

```text
POST /api/power-cuts
```

### Delete Power Cut

```text
DELETE /api/power-cuts/:id
```

### Add Job

```text
POST /api/jobs
```

### Delete Job

```text
DELETE /api/jobs/:id
```

### Update Planner Settings

```text
PATCH /api/settings
```

---

## Event Requirement

The required hackathon event start code is stored in:

```text
EVENT.md
```

---

## Security

Sensitive configuration files are excluded from GitHub.

The following files should remain ignored:

```text
.env
server/.env
client/.env.local
node_modules/
.next/
```

Only example environment files should be committed.

Never place real database credentials, passwords, or secret keys inside the repository.

---

## Project Goal

PowerPlan helps small businesses organize daily work around load shedding, avoid scheduling grid-dependent jobs during outages, reduce unnecessary generator use, and understand the operational cost of completing the day's work.
