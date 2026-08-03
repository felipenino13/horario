"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { schedules, type Schedule, type ScheduleEntry } from "@/data/schedules";

const TIME_ZONE = "America/Bogota";

type ClockInfo = {
  dateLabel: string;
  dayIndex: number;
  dayOfMonth: number;
  isoDate: string;
  timeLabel: string;
  minuteOfDay: number;
  second: number;
  year: number;
};

type Holiday = { date: string; localName: string; name: string };
type HolidayStatus = "idle" | "loading" | "ready" | "error";
type WorkScheduleId = "oficina" | "casa";
type NotificationState = NotificationPermission | "unsupported";

type CurrentActivity = {
  entry: ScheduleEntry;
  index: number;
  secondsLeft: number;
};

function getClockInfo(date: Date): ClockInfo {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "0";
  const weekday = value("weekday");
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  const hour = Number(value("hour"));
  const minute = Number(value("minute"));
  const second = Number(value("second"));
  const year = Number(value("year"));
  const month = value("month");
  const day = value("day");

  return {
    dateLabel: new Intl.DateTimeFormat("es-CO", {
      timeZone: TIME_ZONE,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date),
    dayIndex,
    dayOfMonth: Number(day),
    isoDate: `${year}-${month}-${day}`,
    timeLabel: new Intl.DateTimeFormat("es-CO", {
      timeZone: TIME_ZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date),
    minuteOfDay: hour * 60 + minute,
    second,
    year,
  };
}

function parseStartMinutes(time: string) {
  const [clock] = time.split(" ");
  const [hourText, minuteText] = clock.split(":");
  let hour = Number(hourText);
  const minute = Number(minuteText);
  const isPm = time.includes("p.");
  if (isPm && hour !== 12) hour += 12;
  if (!isPm && hour === 12) hour = 0;
  return hour * 60 + minute;
}

function parseDurationMinutes(duration: string) {
  const hours = Number(duration.match(/(\d+)h/)?.[1] ?? 0);
  const minutes = Number(duration.match(/(\d+)m/)?.[1] ?? 0);
  return hours * 60 + minutes;
}

function findCurrentActivity(schedule: Schedule, minuteOfDay: number, second: number): CurrentActivity | null {
  const secondOfDay = minuteOfDay * 60 + second;

  for (let index = 0; index < schedule.entries.length; index += 1) {
    const entry = schedule.entries[index];
    const start = parseStartMinutes(entry.time) * 60;
    const end = start + parseDurationMinutes(entry.duration) * 60;
    const comparableSecond = end > 86400 && secondOfDay < start ? secondOfDay + 86400 : secondOfDay;

    if (comparableSecond >= start && comparableSecond < end) {
      return { entry, index, secondsLeft: end - comparableSecond };
    }
  }
  return null;
}

function findNextActivity(schedule: Schedule, current: CurrentActivity | null, minuteOfDay: number) {
  if (current) {
    return schedule.entries[(current.index + 1) % schedule.entries.length] ?? null;
  }

  const nextToday = schedule.entries.find((entry) => parseStartMinutes(entry.time) > minuteOfDay);
  return nextToday ?? schedule.entries[0] ?? null;
}

function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function getAutomaticScheduleId(clock: ClockInfo, holiday: Holiday | null) {
  if (clock.dayIndex === 6) return "sabado";
  if (clock.dayIndex === 0 || holiday) return "domingo";
  return clock.dayOfMonth % 2 === 0 ? "oficina" : "casa";
}

type ScheduleViewProps = {
  mode?: "overview" | "detail";
  scheduleId?: string;
};

export function ScheduleView({ mode = "overview", scheduleId }: ScheduleViewProps) {
  const [clock, setClock] = useState<ClockInfo | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayStatus, setHolidayStatus] = useState<HolidayStatus>("idle");
  const [manualOverride, setManualOverride] = useState<WorkScheduleId | null>(null);
  const [notificationState, setNotificationState] = useState<NotificationState>("default");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const loadedOverrideDate = useRef<string | null>(null);
  const lastActivityKey = useRef<string | null>(null);
  const lastNotificationSchedule = useRef<string | null>(null);

  const holiday = useMemo(
    () => clock ? holidays.find((item) => item.date === clock.isoDate) ?? null : null,
    [clock, holidays],
  );
  const automaticId = clock ? getAutomaticScheduleId(clock, holiday) : "oficina";
  const canOverrideWorkMode = Boolean(clock && clock.dayIndex > 0 && clock.dayIndex < 6 && !holiday);
  const activeId = scheduleId ?? (canOverrideWorkMode && manualOverride ? manualOverride : automaticId);
  const activeSchedule = schedules.find((schedule) => schedule.id === activeId);
  const currentActivity = useMemo(
    () => activeSchedule && clock ? findCurrentActivity(activeSchedule, clock.minuteOfDay, clock.second) : null,
    [activeSchedule, clock],
  );
  const nextActivity = useMemo(
    () => activeSchedule && clock ? findNextActivity(activeSchedule, currentActivity, clock.minuteOfDay) : null,
    [activeSchedule, clock, currentActivity],
  );

  useEffect(() => {
    const updateClock = () => {
      const nextClock = getClockInfo(new Date());
      setClock(nextClock);

      if (!scheduleId && loadedOverrideDate.current !== nextClock.isoDate) {
        const saved = window.localStorage.getItem(`schedule-override:${nextClock.isoDate}`);
        setManualOverride(saved === "oficina" || saved === "casa" ? saved : null);
        loadedOverrideDate.current = nextClock.isoDate;
      }
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, [scheduleId]);

  useEffect(() => {
    if (mode !== "overview" || !clock?.year) return;

    let cancelled = false;
    const loadHolidays = async () => {
      setHolidayStatus("loading");
      try {
        const response = await fetch(`/api/holidays/${clock.year}`);
        if (!response.ok) throw new Error("Holiday API request failed");
        const data = (await response.json()) as Holiday[];
        if (!cancelled) {
          setHolidays(data);
          setHolidayStatus("ready");
        }
      } catch {
        if (!cancelled) setHolidayStatus("error");
      }
    };

    void loadHolidays();
    return () => { cancelled = true; };
  }, [clock?.year, mode]);

  useEffect(() => {
    if (mode !== "overview") return;
    const readNotificationState = () => {
      if (!("Notification" in window)) {
        setNotificationState("unsupported");
        return;
      }
      setNotificationState(Notification.permission);
      setNotificationsEnabled(
        Notification.permission === "granted" &&
        window.localStorage.getItem("schedule-notifications") === "true",
      );
    };
    readNotificationState();
  }, [mode]);

  useEffect(() => {
    if (mode !== "overview" || !clock || !currentActivity || !activeSchedule) return;
    const activityKey = `${activeSchedule.id}:${currentActivity.index}`;

    if (lastNotificationSchedule.current !== activeSchedule.id) {
      lastNotificationSchedule.current = activeSchedule.id;
      lastActivityKey.current = activityKey;
      return;
    }

    if (lastActivityKey.current === null) {
      lastActivityKey.current = activityKey;
      return;
    }

    if (lastActivityKey.current !== activityKey) {
      lastActivityKey.current = activityKey;
      if (notificationsEnabled && notificationState === "granted") {
        try {
          const notification = new Notification(`Ahora: ${currentActivity.entry.activity}`, {
            body: `${activeSchedule.label} · ${currentActivity.entry.time} · ${currentActivity.entry.duration}`,
            icon: "/icon.svg",
            tag: "schedule-current-activity",
          });
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch {
          // Algunos navegadores móviles solo permiten notificaciones desde una PWA.
        }
      }
    }
  }, [activeSchedule, clock, currentActivity, mode, notificationState, notificationsEnabled]);

  const selectWorkMode = (nextMode: WorkScheduleId) => {
    if (!clock || !canOverrideWorkMode) return;
    const storageKey = `schedule-override:${clock.isoDate}`;
    if (nextMode === automaticId) {
      setManualOverride(null);
      window.localStorage.removeItem(storageKey);
      return;
    }
    setManualOverride(nextMode);
    window.localStorage.setItem(storageKey, nextMode);
  };

  const toggleNotifications = async () => {
    if (!("Notification" in window) || notificationState === "unsupported" || notificationState === "denied") return;

    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      window.localStorage.setItem("schedule-notifications", "false");
      return;
    }

    const permission = Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();
    setNotificationState(permission);
    if (permission === "granted") {
      setNotificationsEnabled(true);
      window.localStorage.setItem("schedule-notifications", "true");
    }
  };

  if (!activeSchedule) {
    return <p className="empty-state">No hay horarios disponibles.</p>;
  }

  return (
    <section aria-label={mode === "overview" ? "Actividad actual" : `Horario ${activeSchedule.label}`}>
      {mode === "overview" && <div className="now-card">
        <div className="current-task">
          <div className="current-task-heading">
            <p className="eyebrow">Actividad actual</p>
            <Link className="schedule-badge" href={`/horario/${activeSchedule.id}`}>
              {activeSchedule.label}
            </Link>
          </div>
          {currentActivity ? (
            <>
              <h2>{currentActivity.entry.activity}</h2>
              <p>
                Desde las {currentActivity.entry.time} · {currentActivity.entry.duration}
              </p>
              <div className="countdown-block">
                <span>Tiempo restante</span>
                <strong aria-label={`${currentActivity.secondsLeft} segundos restantes`}>
                  {formatCountdown(currentActivity.secondsLeft)}
                </strong>
              </div>
            </>
          ) : (
            <>
              <h2>Tiempo sin actividad asignada</h2>
              <p>En este momento no hay una actividad programada en este horario.</p>
            </>
          )}

          {nextActivity && (
            <div className="next-activity">
              <div>
                <span className="next-label">Próxima actividad</span>
                <strong>{nextActivity.activity}</strong>
              </div>
              <time>{nextActivity.time}</time>
            </div>
          )}
        </div>

        <div className="clock-block">
          <p className="eyebrow">Ahora en Bogotá</p>
          {clock ? (
            <>
              <time className="clock" dateTime={new Date().toISOString()}>{clock.timeLabel}</time>
              <p className="current-date">{clock.dateLabel}</p>
              <div className="calendar-status" data-status={holidayStatus}>
                {holidayStatus === "loading" && "Verificando festivos…"}
                {holidayStatus === "error" && "No se pudo verificar si hoy es festivo."}
                {holidayStatus === "ready" && holiday && `Festivo: ${holiday.localName}`}
                {holidayStatus === "ready" && !holiday && clock.dayIndex > 0 && clock.dayIndex < 6 && manualOverride && (
                  `Cambio manual · ${manualOverride === "oficina" ? "Oficina" : "Casa"}`
                )}
                {holidayStatus === "ready" && !holiday && clock.dayIndex > 0 && clock.dayIndex < 6 && !manualOverride && (
                  clock.dayOfMonth % 2 === 0 ? "Día par · Oficina" : "Día impar · Casa"
                )}
                {holidayStatus === "ready" && clock.dayIndex === 6 && "Horario de sábado"}
                {holidayStatus === "ready" && clock.dayIndex === 0 && "Horario de domingo"}
              </div>

              <div className="work-mode-control" aria-label="Cambiar modalidad de trabajo">
                <span>Modalidad de hoy</span>
                <div className="work-mode-switch" role="group" aria-label="Oficina o casa">
                  <button type="button" data-active={activeId === "oficina"} disabled={!canOverrideWorkMode} onClick={() => selectWorkMode("oficina")}>Oficina</button>
                  <button type="button" data-active={activeId === "casa"} disabled={!canOverrideWorkMode} onClick={() => selectWorkMode("casa")}>Casa</button>
                </div>
                {!canOverrideWorkMode && clock && (
                  <small>Disponible únicamente en días laborales no festivos.</small>
                )}
              </div>

              <div className="notification-control">
                <div>
                  <span>Notificaciones</span>
                  <small>
                    {notificationState === "unsupported" && "Este navegador no admite notificaciones."}
                    {notificationState === "denied" && "Están bloqueadas en la configuración del navegador."}
                    {notificationState !== "unsupported" && notificationState !== "denied" && notificationsEnabled && "Te avisaremos al comenzar una actividad nueva."}
                    {notificationState !== "unsupported" && notificationState !== "denied" && !notificationsEnabled && "Recibe avisos mientras la app permanezca abierta."}
                  </small>
                </div>
                <button
                  type="button"
                  data-enabled={notificationsEnabled}
                  disabled={notificationState === "unsupported" || notificationState === "denied"}
                  onClick={toggleNotifications}
                >
                  {notificationsEnabled ? "Pausar" : "Activar"}
                </button>
              </div>
            </>
          ) : (
            <div className="clock-placeholder" aria-label="Cargando hora actual" />
          )}
        </div>
      </div>}

      {mode === "detail" && <div className="schedule-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">Horario completo</p>
            <h2>{activeSchedule.label}</h2>
            <p>{activeSchedule.description}</p>
          </div>
          <span className="activity-count">{activeSchedule.entries.length} actividades</span>
        </div>

        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Hora</th><th scope="col">Duración</th><th scope="col">Actividad</th></tr></thead>
            <tbody>
              {activeSchedule.entries.map((entry, index) => {
                const isCurrent = currentActivity?.index === index;
                return (
                  <tr className={isCurrent ? "current-row" : undefined} key={`${entry.time}-${entry.activity}-${index}`} aria-current={isCurrent ? "time" : undefined}>
                    <td className="time">{entry.time}</td>
                    <td><span className="duration">{entry.duration}</span></td>
                    <td>{entry.activity}{isCurrent && <span className="now-badge">Ahora</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>}
    </section>
  );
}
