export type PowerNeed = "GRID_REQUIRED" | "GENERATOR_OK" | "NO_POWER";

export type Job = {
  id: number;
  workDate: string;
  name: string;
  durationMinutes: number;
  powerNeed: PowerNeed;
  position: number;
};

export type Cut = { id: number; startMinute: number; endMinute: number };

type Interval = { start: number; end: number };

export type ScheduledJob = Job & {
  startMinute: number;
  endMinute: number;
  generatorMinutes: number;
  source: "GRID" | "GENERATOR" | "MIXED" | "NONE";
};

function mergeCuts(cuts: Cut[]): Interval[] {
  const sorted = cuts
    .map((c) => ({ start: c.startMinute, end: c.endMinute }))
    .sort((a, b) => a.start - b.start);

  const merged: Interval[] = [];
  for (const cut of sorted) {
    const last = merged.at(-1);
    if (!last || cut.start > last.end) merged.push({ ...cut });
    else last.end = Math.max(last.end, cut.end);
  }
  return merged;
}

function overlapMinutes(start: number, end: number, cuts: Interval[]) {
  return cuts.reduce((sum, cut) => {
    const overlap = Math.max(0, Math.min(end, cut.end) - Math.max(start, cut.start));
    return sum + overlap;
  }, 0);
}

function findGridStart(cursor: number, duration: number, shopEnd: number, cuts: Interval[]) {
  let start = cursor;

  while (start + duration <= shopEnd) {
    const conflict = cuts.find((cut) => start < cut.end && start + duration > cut.start);
    if (!conflict) return start;
    start = Math.max(start, conflict.end);
  }

  return null;
}

export function buildPlan(input: {
  jobs: Job[];
  cuts: Cut[];
  shopStartMinute: number;
  shopEndMinute: number;
}) {
  const cuts = mergeCuts(input.cuts);
  let cursor = input.shopStartMinute;
  const scheduled: ScheduledJob[] = [];
  const unscheduled: Job[] = [];

  for (const job of input.jobs) {
    if (job.powerNeed === "GRID_REQUIRED") {
      const start = findGridStart(cursor, job.durationMinutes, input.shopEndMinute, cuts);
      if (start === null) {
        unscheduled.push(job);
        continue;
      }
      const end = start + job.durationMinutes;
      scheduled.push({ ...job, startMinute: start, endMinute: end, generatorMinutes: 0, source: "GRID" });
      cursor = end;
      continue;
    }

    const start = cursor;
    const end = start + job.durationMinutes;
    if (end > input.shopEndMinute) {
      unscheduled.push(job);
      continue;
    }

    if (job.powerNeed === "NO_POWER") {
      scheduled.push({ ...job, startMinute: start, endMinute: end, generatorMinutes: 0, source: "NONE" });
      cursor = end;
      continue;
    }

    const generatorMinutes = overlapMinutes(start, end, cuts);
    const source = generatorMinutes === 0 ? "GRID" : generatorMinutes === job.durationMinutes ? "GENERATOR" : "MIXED";
    scheduled.push({ ...job, startMinute: start, endMinute: end, generatorMinutes, source });
    cursor = end;
  }

  return { scheduled, unscheduled };
}
