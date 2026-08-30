export type PowerNeed = "GRID_REQUIRED" | "GENERATOR_OK" | "NO_POWER";

export type PowerCut = {
  id: number;
  workDate: string;
  startMinute: number;
  endMinute: number;
};

export type Job = {
  id: number;
  workDate: string;
  name: string;
  durationMinutes: number;
  powerNeed: PowerNeed;
  position: number;
};

export type ScheduledJob = Job & {
  startMinute: number;
  endMinute: number;
  generatorMinutes: number;
  source: "GRID" | "GENERATOR" | "MIXED" | "NONE";
};

export type PlannerState = {
  date: string;
  powerCuts: PowerCut[];
  jobs: Job[];
  scheduled: ScheduledJob[];
  unscheduled: Job[];
  summary: {
    generatorMinutes: number;
    generatorHours: number;
    estimatedGeneratorCost: number;
    totalScheduledMinutes: number;
    scheduledCount: number;
    unscheduledCount: number;
  };
  settings: {
    shopStartMinute: number;
    shopEndMinute: number;
    generatorCostPerHour: number;
  };
};
