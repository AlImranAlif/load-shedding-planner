CREATE TABLE IF NOT EXISTS planner_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  shop_start_minute INTEGER NOT NULL DEFAULT 480 CHECK (shop_start_minute >= 0 AND shop_start_minute < 1440),
  shop_end_minute INTEGER NOT NULL DEFAULT 1320 CHECK (shop_end_minute > 0 AND shop_end_minute <= 1440),
  generator_cost_per_hour NUMERIC(10,2) NOT NULL DEFAULT 180 CHECK (generator_cost_per_hour >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (shop_end_minute > shop_start_minute)
);

INSERT INTO planner_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS power_cuts (
  id BIGSERIAL PRIMARY KEY,
  work_date DATE NOT NULL,
  start_minute INTEGER NOT NULL CHECK (start_minute >= 0 AND start_minute < 1440),
  end_minute INTEGER NOT NULL CHECK (end_minute > 0 AND end_minute <= 1440),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_minute > start_minute)
);

CREATE INDEX IF NOT EXISTS idx_power_cuts_date ON power_cuts(work_date, start_minute);

CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  work_date DATE NOT NULL,
  name VARCHAR(160) NOT NULL CHECK (char_length(trim(name)) > 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 720),
  power_need VARCHAR(24) NOT NULL CHECK (power_need IN ('GRID_REQUIRED', 'GENERATOR_OK', 'NO_POWER')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_date_position ON jobs(work_date, position, id);
