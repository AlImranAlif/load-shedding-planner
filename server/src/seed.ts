import { pool } from "./db.js";

function todayDhaka() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

const date = todayDhaka();

try {
  await pool.query("DELETE FROM jobs WHERE work_date = $1", [date]);
  await pool.query("DELETE FROM power_cuts WHERE work_date = $1", [date]);

  await pool.query(
    "INSERT INTO power_cuts (work_date, start_minute, end_minute) VALUES ($1, $2, $3), ($1, $4, $5)",
    [date, 660, 780, 1020, 1110]
  );

  const jobs = [
    ["A1 poster printing", 75, "GRID_REQUIRED", 1],
    ["300 photocopies", 90, "GENERATOR_OK", 2],
    ["Thesis binding", 45, "NO_POWER", 3],
    ["Business card print", 60, "GENERATOR_OK", 4],
    ["Large format banner", 90, "GRID_REQUIRED", 5],
    ["Cutting and packing", 35, "NO_POWER", 6]
  ];

  for (const job of jobs) {
    await pool.query(
      "INSERT INTO jobs (work_date, name, duration_minutes, power_need, position) VALUES ($1, $2, $3, $4, $5)",
      [date, ...job]
    );
  }

  console.log(`Demo data added for ${date}.`);
} finally {
  await pool.end();
}
