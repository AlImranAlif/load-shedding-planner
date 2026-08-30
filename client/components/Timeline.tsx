"use client";

import { PlannerState, ScheduledJob } from "../lib/types";

const DAY = 1440;
const hours = Array.from({ length: 25 }, (_, i) => i);

function pos(minute: number) {
  return `${(minute / DAY) * 100}%`;
}

function width(start: number, end: number) {
  return `${((end - start) / DAY) * 100}%`;
}

function clock(minute: number) {
  const h = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, "0")} ${suffix}`;
}

function jobClass(job: ScheduledJob) {
  if (job.powerNeed === "NO_POWER") return "job no-power";
  if (job.source === "GENERATOR" || job.source === "MIXED") return "job generator";
  return "job grid";
}

export default function Timeline({ state }: { state: PlannerState }) {
  return (
    <section className="timeline-card">
      <div className="section-heading">
        <div>
          <p className="kicker">24-hour operational view</p>
          <h2>Today&apos;s timeline</h2>
        </div>
        <div className="legend">
          <span><i className="dot cut-dot" /> Power cut</span>
          <span><i className="dot grid-dot" /> Grid</span>
          <span><i className="dot gen-dot" /> Generator</span>
          <span><i className="dot none-dot" /> No power</span>
        </div>
      </div>

      <div className="timeline-scroll">
        <div className="timeline-shell">
          <div className="hour-row">
            {hours.map((hour) => (
              <span key={hour} style={{ left: `${(hour / 24) * 100}%` }}>
                {hour === 24 ? "24" : String(hour).padStart(2, "0")}
              </span>
            ))}
          </div>

          <div className="timeline-row cut-row">
            <div className="row-label">Power</div>
            <div className="track">
              {hours.map((hour) => <i className="grid-line" key={hour} style={{ left: `${(hour / 24) * 100}%` }} />)}
              {state.powerCuts.map((cut) => (
                <div
                  className="cut-bar"
                  key={cut.id}
                  style={{ left: pos(cut.startMinute), width: width(cut.startMinute, cut.endMinute) }}
                  title={`Power cut: ${clock(cut.startMinute)} to ${clock(cut.endMinute)}`}
                >
                  <span>{clock(cut.startMinute)}–{clock(cut.endMinute)}</span>
                </div>
              ))}
            </div>
          </div>

          {state.scheduled.map((job) => (
            <div className="timeline-row" key={job.id}>
              <div className="row-label" title={job.name}>{job.name}</div>
              <div className="track">
                {hours.map((hour) => <i className="grid-line" key={hour} style={{ left: `${(hour / 24) * 100}%` }} />)}
                <div
                  className={jobClass(job)}
                  style={{ left: pos(job.startMinute), width: width(job.startMinute, job.endMinute) }}
                  title={`${job.name}: ${clock(job.startMinute)}–${clock(job.endMinute)} | ${job.generatorMinutes} generator min`}
                >
                  <span>{job.name}</span>
                </div>
              </div>
            </div>
          ))}

          {state.scheduled.length === 0 && (
            <div className="timeline-empty">Add jobs to generate the plan.</div>
          )}
        </div>
      </div>
    </section>
  );
}
