import express from "express";
import cors from "cors";
import "dotenv/config";
import { z } from "zod";
import { pool } from "./db.js";
import { buildPlan, Job, Cut } from "./scheduler.js";
import { timeToMinute } from "./time.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const powerNeedSchema = z.enum(["GRID_REQUIRED", "GENERATOR_OK", "NO_POWER"]);

function cutFromRow(row: any) {
  return {
    id: Number(row.id),
    workDate: String(row.work_date).slice(0, 10),
    startMinute: Number(row.start_minute),
    endMinute: Number(row.end_minute)
  };
}

function jobFromRow(row: any): Job {
  return {
    id: Number(row.id),
    workDate: String(row.work_date).slice(0, 10),
    name: row.name,
    durationMinutes: Number(row.duration_minutes),
    powerNeed: row.power_need,
    position: Number(row.position)
  };
}

app.get("/api/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true });
});

app.get("/api/planner", async (req, res) => {
  try {
    const date = dateSchema.parse(req.query.date);
    const [cutsResult, jobsResult, settingsResult] = await Promise.all([
      pool.query("SELECT * FROM power_cuts WHERE work_date = $1 ORDER BY start_minute, id", [date]),
      pool.query("SELECT * FROM jobs WHERE work_date = $1 ORDER BY position, id", [date]),
      pool.query("SELECT * FROM planner_settings WHERE id = 1")
    ]);

    const powerCuts = cutsResult.rows.map(cutFromRow);
    const jobs = jobsResult.rows.map(jobFromRow);
    const settings = settingsResult.rows[0];

    const { scheduled, unscheduled } = buildPlan({
      jobs,
      cuts: powerCuts as Cut[],
      shopStartMinute: Number(settings.shop_start_minute),
      shopEndMinute: Number(settings.shop_end_minute)
    });

    const generatorMinutes = scheduled.reduce((sum, job) => sum + job.generatorMinutes, 0);
    const generatorCostPerHour = Number(settings.generator_cost_per_hour);

    res.json({
      date,
      powerCuts,
      jobs,
      scheduled,
      unscheduled,
      summary: {
        generatorMinutes,
        generatorHours: generatorMinutes / 60,
        estimatedGeneratorCost: (generatorMinutes / 60) * generatorCostPerHour,
        totalScheduledMinutes: scheduled.reduce((sum, job) => sum + job.durationMinutes, 0),
        scheduledCount: scheduled.length,
        unscheduledCount: unscheduled.length
      },
      settings: {
        shopStartMinute: Number(settings.shop_start_minute),
        shopEndMinute: Number(settings.shop_end_minute),
        generatorCostPerHour
      }
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Could not build planner" });
  }
});

app.post("/api/power-cuts", async (req, res) => {
  try {
    const body = z.object({
      workDate: dateSchema,
      startTime: z.string(),
      endTime: z.string()
    }).parse(req.body);

    const start = timeToMinute(body.startTime);
    const end = timeToMinute(body.endTime);
    if (end <= start) throw new Error("End time must be later than start time on the same day.");

    const result = await pool.query(
      "INSERT INTO power_cuts (work_date, start_minute, end_minute) VALUES ($1, $2, $3) RETURNING *",
      [body.workDate, start, end]
    );
    res.status(201).json(cutFromRow(result.rows[0]));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid power cut" });
  }
});

app.delete("/api/power-cuts/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
  await pool.query("DELETE FROM power_cuts WHERE id = $1", [id]);
  res.json({ ok: true });
});

app.post("/api/jobs", async (req, res) => {
  try {
    const body = z.object({
      workDate: dateSchema,
      name: z.string().trim().min(1).max(160),
      durationMinutes: z.number().int().min(1).max(720),
      powerNeed: powerNeedSchema
    }).parse(req.body);

    const posResult = await pool.query("SELECT COALESCE(MAX(position), 0) + 1 AS next FROM jobs WHERE work_date = $1", [body.workDate]);
    const position = Number(posResult.rows[0].next);

    const result = await pool.query(
      "INSERT INTO jobs (work_date, name, duration_minutes, power_need, position) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [body.workDate, body.name, body.durationMinutes, body.powerNeed, position]
    );
    res.status(201).json(jobFromRow(result.rows[0]));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid job" });
  }
});

app.delete("/api/jobs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
  await pool.query("DELETE FROM jobs WHERE id = $1", [id]);
  res.json({ ok: true });
});

app.patch("/api/settings", async (req, res) => {
  try {
    const body = z.object({
      shopStartTime: z.string(),
      shopEndTime: z.string(),
      generatorCostPerHour: z.number().min(0).max(100000)
    }).parse(req.body);

    const start = timeToMinute(body.shopStartTime);
    const end = timeToMinute(body.shopEndTime);
    if (end <= start) throw new Error("Shop closing time must be later than opening time.");

    await pool.query(
      `UPDATE planner_settings
       SET shop_start_minute = $1, shop_end_minute = $2, generator_cost_per_hour = $3, updated_at = NOW()
       WHERE id = 1`,
      [start, end, body.generatorCostPerHour]
    );

    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid settings" });
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`PowerPlan API running at http://localhost:${port}`);
});
