import { PlannerState, PowerNeed } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    },
    cache: "no-store"
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? "Request failed");
  }
  return body;
}

export const api = {
  state(date: string) {
    return request<PlannerState>(`/planner?date=${encodeURIComponent(date)}`);
  },
  addPowerCut(input: { workDate: string; startTime: string; endTime: string }) {
    return request("/power-cuts", { method: "POST", body: JSON.stringify(input) });
  },
  deletePowerCut(id: number) {
    return request(`/power-cuts/${id}`, { method: "DELETE" });
  },
  addJob(input: { workDate: string; name: string; durationMinutes: number; powerNeed: PowerNeed }) {
    return request("/jobs", { method: "POST", body: JSON.stringify(input) });
  },
  deleteJob(id: number) {
    return request(`/jobs/${id}`, { method: "DELETE" });
  },
  updateSettings(input: {
    shopStartTime: string;
    shopEndTime: string;
    generatorCostPerHour: number;
  }) {
    return request("/settings", { method: "PATCH", body: JSON.stringify(input) });
  }
};
