"use client";

import { useMemo, useState } from "react";
import { getScheduleForDay, schedules, type ScheduleEntry } from "@/data/schedules";

const DAY_MINUTES = 24 * 60;

const categoryStyles: Record<string, string> = {
  Descanso: "#86a7ff",
  "Trabajo y estudio": "#5fc58a",
  Traslados: "#f0a35e",
  Familia: "#e879b9",
  Alimentación: "#f0d06a",
  Hogar: "#66c8c4",
  Pausas: "#b98ce6",
  "Cuidado personal": "#95a7b1",
  "Sin asignar": "#40574a",
  Otros: "#789183",
};

function durationToMinutes(duration: string) {
  const hours = Number(duration.match(/(\d+)h/)?.[1] ?? 0);
  const minutes = Number(duration.match(/(\d+)m/)?.[1] ?? 0);
  return hours * 60 + minutes;
}

function getCategory(activity: string) {
  const value = activity.toLocaleLowerCase("es");
  if (value.includes("dormir")) return "Descanso";
  if (value.includes("trabajo") || value.includes("estudio")) return "Trabajo y estudio";
  if (value.includes("desplazamiento")) return "Traslados";
  if (value.includes("familia")) return "Familia";
  if (["desayuno", "almuerzo", "cenar", "comida", "café"].some((word) => value.includes(word))) return "Alimentación";
  if (value.includes("ordenar casa")) return "Hogar";
  if (value.includes("pausa")) return "Pausas";
  if (["despertar", "baño", "acomodarse", "tiempo cris"].some((word) => value.includes(word))) return "Cuidado personal";
  return "Otros";
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} min`;
  if (!remainder) return `${hours} h`;
  return `${hours} h ${remainder} min`;
}

function percentage(minutes: number) {
  return (minutes / DAY_MINUTES) * 100;
}

type Metric = { name: string; minutes: number; color: string };

function aggregateCategories(entries: ScheduleEntry[]) {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    const category = getCategory(entry.activity);
    totals.set(category, (totals.get(category) ?? 0) + durationToMinutes(entry.duration));
  }
  const scheduled = [...totals.values()].reduce((sum, value) => sum + value, 0);
  if (scheduled < DAY_MINUTES) totals.set("Sin asignar", DAY_MINUTES - scheduled);
  return [...totals.entries()]
    .map(([name, minutes]) => ({ name, minutes, color: categoryStyles[name] }))
    .sort((a, b) => b.minutes - a.minutes);
}

function aggregateActivities(entries: ScheduleEntry[]) {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    totals.set(entry.activity, (totals.get(entry.activity) ?? 0) + durationToMinutes(entry.duration));
  }
  return [...totals.entries()]
    .map(([name, minutes]) => ({ name, minutes, color: categoryStyles[getCategory(name)] }))
    .sort((a, b) => b.minutes - a.minutes);
}

function createConicGradient(metrics: Metric[]) {
  let cursor = 0;
  const stops = metrics.map((metric) => {
    const start = cursor;
    cursor += percentage(metric.minutes);
    return `${metric.color} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export function MetricsDashboard() {
  const [scheduleId, setScheduleId] = useState("oficina");
  const [dayIndex] = useState(() => {
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Bogota",
      weekday: "short",
    }).format(new Date());
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  });
  const baseSchedule = schedules.find((item) => item.id === scheduleId) ?? schedules[0];
  const schedule = useMemo(() => getScheduleForDay(baseSchedule, dayIndex), [baseSchedule, dayIndex]);
  const metrics = useMemo(() => aggregateCategories(schedule.entries), [schedule]);
  const activities = useMemo(() => aggregateActivities(schedule.entries), [schedule]);
  const scheduledMinutes = schedule.entries.reduce((sum, entry) => sum + durationToMinutes(entry.duration), 0);
  const sleepMinutes = metrics.find((item) => item.name === "Descanso")?.minutes ?? 0;
  const productiveMinutes = metrics.find((item) => item.name === "Trabajo y estudio")?.minutes ?? 0;
  const freeMinutes = Math.max(0, DAY_MINUTES - scheduledMinutes);
  const dominant = metrics.find((item) => item.name !== "Sin asignar") ?? metrics[0];
  const chartLabel = metrics.map((item) => `${item.name}: ${formatDuration(item.minutes)}`).join(", ");

  return (
    <main className="metrics-shell">
      <header className="metrics-intro">
        <div>
          <p className="eyebrow">Métricas del día</p>
          <h1>Así se distribuye tu tiempo</h1>
          <p>Una lectura de tus 24 horas para entender dónde está tu atención.</p>
        </div>
        <div className="schedule-selector" aria-label="Seleccionar horario">
          {schedules.map((item) => (
            <button key={item.id} type="button" data-active={item.id === scheduleId} onClick={() => setScheduleId(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <section className="metric-kpis" aria-label="Resumen del día">
        <article><span>Tiempo programado</span><strong>{formatDuration(Math.min(scheduledMinutes, DAY_MINUTES))}</strong><small>{percentage(Math.min(scheduledMinutes, DAY_MINUTES)).toFixed(0)}% del día</small></article>
        <article><span>Trabajo y estudio</span><strong>{formatDuration(productiveMinutes)}</strong><small>{percentage(productiveMinutes).toFixed(0)}% del día</small></article>
        <article><span>Descanso</span><strong>{formatDuration(sleepMinutes)}</strong><small>{percentage(sleepMinutes).toFixed(0)}% del día</small></article>
        <article><span>Sin asignar</span><strong>{formatDuration(freeMinutes)}</strong><small>{freeMinutes ? "Espacio disponible" : "Día completamente cubierto"}</small></article>
      </section>

      <section className="metrics-grid">
        <article className="distribution-panel">
          <div className="metric-heading"><div><p className="eyebrow">Distribución general</p><h2>Composición del día</h2></div><span>{schedule.label}</span></div>
          <div className="distribution-content">
            <div className="donut" role="img" aria-label={chartLabel} style={{ background: createConicGradient(metrics) }}>
              <div><strong>24 h</strong><span>un día</span></div>
            </div>
            <div className="metric-legend">
              {metrics.map((metric) => (
                <div key={metric.name}><i style={{ background: metric.color }} /><span>{metric.name}</span><strong>{formatDuration(metric.minutes)}</strong><small>{percentage(metric.minutes).toFixed(0)}%</small></div>
              ))}
            </div>
          </div>
        </article>

        <aside className="insight-panel">
          <p className="eyebrow">Lectura rápida</p>
          <h2>Lo más relevante</h2>
          <div className="primary-insight"><span>Mayor inversión de tiempo</span><strong>{dominant.name}</strong><p>{formatDuration(dominant.minutes)}, equivalente al {percentage(dominant.minutes).toFixed(0)}% de tu día.</p></div>
          <ul>
            <li><span>Actividades distintas</span><strong>{activities.length}</strong></li>
            <li><span>Bloques en el horario</span><strong>{schedule.entries.length}</strong></li>
            <li><span>Tiempo activo sin dormir</span><strong>{formatDuration(DAY_MINUTES - sleepMinutes)}</strong></li>
          </ul>
        </aside>
      </section>

      <section className="day-strip-panel">
        <div className="metric-heading"><div><p className="eyebrow">Panorama completo</p><h2>Las 24 horas de un vistazo</h2></div></div>
        <div className="day-strip" role="img" aria-label={chartLabel}>
          {metrics.map((metric) => <span key={metric.name} title={`${metric.name}: ${formatDuration(metric.minutes)}`} style={{ background: metric.color, flexGrow: metric.minutes }} />)}
        </div>
        <div className="strip-scale"><span>0 h</span><span>6 h</span><span>12 h</span><span>18 h</span><span>24 h</span></div>
      </section>

      <section className="activity-ranking">
        <div className="metric-heading"><div><p className="eyebrow">Detalle por actividad</p><h2>¿A qué dedicas más tiempo?</h2></div><span>{activities.length} actividades</span></div>
        <div className="ranking-list">
          {activities.map((activity, index) => (
            <div className="ranking-row" key={activity.name}>
              <span className="ranking-number">{String(index + 1).padStart(2, "0")}</span>
              <div><div className="ranking-label"><strong>{activity.name}</strong><span>{formatDuration(activity.minutes)} · {percentage(activity.minutes).toFixed(0)}%</span></div><div className="ranking-track"><span style={{ background: activity.color, width: `${percentage(activity.minutes)}%` }} /></div></div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
