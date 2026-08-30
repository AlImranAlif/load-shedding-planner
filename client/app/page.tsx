"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Timeline from "../components/Timeline";
import { api } from "../lib/api";
import { PlannerState, PowerNeed } from "../lib/types";

function localDate() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function clock(minute: number) {
  const h = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, "0")} ${suffix}`;
}

function minuteToInput(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

const labels: Record<PowerNeed, string> = {
  GRID_REQUIRED: "Needs grid power",
  GENERATOR_OK: "Can run on generator",
  NO_POWER: "Needs no power"
};

export default function Home() {
  const [date, setDate] = useState(localDate());
  const [state, setState] = useState<PlannerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cutStart, setCutStart] = useState("12:00");
  const [cutEnd, setCutEnd] = useState("15:00");

  const [jobName, setJobName] = useState("");
  const [duration, setDuration] = useState(30);
  const [powerNeed, setPowerNeed] = useState<PowerNeed>("GENERATOR_OK");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setState(await api.state(date));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load planner");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { void load(); }, [load]);

  async function addCut(e: FormEvent) {
    e.preventDefault();
    try {
      await api.addPowerCut({ workDate: date, startTime: cutStart, endTime: cutEnd });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add power cut");
    }
  }

  async function addJob(e: FormEvent) {
    e.preventDefault();
    if (!jobName.trim()) return;
    try {
      await api.addJob({ workDate: date, name: jobName.trim(), durationMinutes: Number(duration), powerNeed });
      setJobName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add job");
    }
  }

  async function removeCut(id: number) {
    await api.deletePowerCut(id);
    await load();
  }

  async function removeJob(id: number) {
    await api.deleteJob(id);
    await load();
  }

  async function saveSettings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!state) return;
    const form = new FormData(e.currentTarget);
    await api.updateSettings({
      shopStartTime: String(form.get("shopStart")),
      shopEndTime: String(form.get("shopEnd")),
      generatorCostPerHour: Number(form.get("cost"))
    });
    await load();
  }

  const cutMinutes = useMemo(() => {
    if (!state) return 0;
    return state.powerCuts.reduce((sum, c) => sum + (c.endMinute - c.startMinute), 0);
  }, [state]);

  return (
    <main>
      <header className="hero">
        <div>
          <p className="kicker"> Load-Shedding Window Planner</p>
          <h1>PowerPlan</h1>
          <p className="hero-copy">
            Plan print-shop jobs around today&apos;s outages, protect grid-only work, and see exactly how many generator minutes the day will consume.
          </p>
        </div>
        <label className="date-control">
          <span>Planning date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </header>

      {error && <div className="error-banner">{error}</div>}
      {loading && !state && <div className="loading">Loading planner…</div>}

      {state && (
        <>
          <section className="summary-grid">
            <div className="summary-card important">
              <span>Generator required</span>
              <strong>{state.summary.generatorMinutes} min</strong>
              <small>{state.summary.generatorHours.toFixed(2)} hours today</small>
            </div>
            <div className="summary-card">
              <span>Estimated generator cost</span>
              <strong>৳{state.summary.estimatedGeneratorCost.toFixed(0)}</strong>
              <small>At ৳{state.settings.generatorCostPerHour}/hour</small>
            </div>
            <div className="summary-card">
              <span>Power cut</span>
              <strong>{cutMinutes} min</strong>
              <small>{state.powerCuts.length} outage window{state.powerCuts.length === 1 ? "" : "s"}</small>
            </div>
            <div className="summary-card">
              <span>Jobs scheduled</span>
              <strong>{state.summary.scheduledCount}</strong>
              <small>{state.summary.unscheduledCount} could not fit</small>
            </div>
          </section>

          <section className="control-grid">
            <form className="control-card" onSubmit={addCut}>
              <div className="card-heading">
                <div><p className="kicker">Input 01</p><h2>Add power cut</h2></div>
              </div>
              <div className="two-cols">
                <label><span>Start time</span><input type="time" value={cutStart} onChange={(e) => setCutStart(e.target.value)} required /></label>
                <label><span>End time</span><input type="time" value={cutEnd} onChange={(e) => setCutEnd(e.target.value)} required /></label>
              </div>
              <button className="primary" type="submit">Add outage window</button>

              <div className="saved-list">
                {state.powerCuts.map((cut) => (
                  <div className="saved-item" key={cut.id}>
                    <div><strong>{clock(cut.startMinute)}–{clock(cut.endMinute)}</strong><small>{cut.endMinute - cut.startMinute} minutes</small></div>
                    <button type="button" className="icon-button" onClick={() => void removeCut(cut.id)}>Remove</button>
                  </div>
                ))}
                {state.powerCuts.length === 0 && <p className="empty-copy">No outage entered for this date.</p>}
              </div>
            </form>

            <form className="control-card" onSubmit={addJob}>
              <div className="card-heading">
                <div><p className="kicker">Input 02</p><h2>Add print-shop job</h2></div>
              </div>
              <label><span>Job name</span><input value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder="e.g. 500 colour photocopies" required /></label>
              <div className="two-cols">
                <label><span>Duration</span><input type="number" min="1" max="720" value={duration} onChange={(e) => setDuration(Number(e.target.value))} required /></label>
                <label><span>Power need</span>
                  <select value={powerNeed} onChange={(e) => setPowerNeed(e.target.value as PowerNeed)}>
                    <option value="GRID_REQUIRED">Needs grid power</option>
                    <option value="GENERATOR_OK">Can run on generator</option>
                    <option value="NO_POWER">Needs no power</option>
                  </select>
                </label>
              </div>
              <button className="primary" type="submit">Add job & recalculate</button>
            </form>

            <form className="control-card" onSubmit={saveSettings}>
              <div className="card-heading">
                <div><p className="kicker">Operations</p><h2>Shop settings</h2></div>
              </div>
              <div className="two-cols">
                <label><span>Opens</span><input name="shopStart" type="time" defaultValue={minuteToInput(state.settings.shopStartMinute)} required /></label>
                <label><span>Closes</span><input name="shopEnd" type="time" defaultValue={minuteToInput(state.settings.shopEndMinute)} required /></label>
              </div>
              <label><span>Generator cost / hour (BDT)</span><input name="cost" type="number" min="0" step="1" defaultValue={state.settings.generatorCostPerHour} required /></label>
              <button className="secondary" type="submit">Save settings</button>
            </form>
          </section>

          <Timeline state={state} />

          <section className="jobs-card">
            <div className="section-heading">
              <div><p className="kicker">Automatic plan</p><h2>Job queue and decisions</h2></div>
              <span className="rule-chip">Queue order is preserved</span>
            </div>

            <div className="table-wrap">
              <table>
                <thead><tr><th>Job</th><th>Duration</th><th>Power need</th><th>Scheduled</th><th>Source</th><th>Generator</th><th></th></tr></thead>
                <tbody>
                  {state.jobs.map((job) => {
                    const planned = state.scheduled.find((x) => x.id === job.id);
                    return (
                      <tr key={job.id}>
                        <td><strong>{job.name}</strong></td>
                        <td>{job.durationMinutes} min</td>
                        <td>{labels[job.powerNeed]}</td>
                        <td>{planned ? `${clock(planned.startMinute)}–${clock(planned.endMinute)}` : <span className="danger-text">Could not fit</span>}</td>
                        <td>{planned?.source ?? "—"}</td>
                        <td>{planned ? `${planned.generatorMinutes} min` : "—"}</td>
                        <td><button className="icon-button" onClick={() => void removeJob(job.id)}>Remove</button></td>
                      </tr>
                    );
                  })}
                  {state.jobs.length === 0 && <tr><td colSpan={7} className="empty-row">No jobs yet. Add the first job above.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
