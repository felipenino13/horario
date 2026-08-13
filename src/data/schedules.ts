export type ScheduleEntry = {
  time: string;
  duration: string;
  activity: string;
};

export type Schedule = {
  id: string;
  label: string;
  description: string;
  entries: ScheduleEntry[];
};

const evening: ScheduleEntry[] = [
  { time: "7:30 p. m.", duration: "1h", activity: "Preparar comida" },
  { time: "8:30 p. m.", duration: "1h", activity: "Cenar" },
  { time: "9:30 p. m.", duration: "1h", activity: "Acomodarse para dormir" },
];

const workdayUntilSix: ScheduleEntry[] = [
  { time: "8:00 a. m.", duration: "2h 30m", activity: "Trabajo" },
  { time: "10:30 a. m.", duration: "30m", activity: "Pausa" },
  { time: "11:00 a. m.", duration: "2h 30m", activity: "Trabajo" },
  { time: "1:30 p. m.", duration: "1h", activity: "Almuerzo" },
  { time: "2:30 p. m.", duration: "1h 30m", activity: "Trabajo" },
  { time: "4:00 p. m.", duration: "30m", activity: "Pausa" },
  { time: "4:30 p. m.", duration: "1h 30m", activity: "Trabajo" },
];

const workdayUntilFive: ScheduleEntry[] = [
  ...workdayUntilSix.slice(0, -1),
  { time: "4:30 p. m.", duration: "30m", activity: "Trabajo" },
];

const lateOfficeEvening: ScheduleEntry[] = [
  { time: "8:30 p. m.", duration: "30m", activity: "Preparar comida" },
  { time: "9:00 p. m.", duration: "30m", activity: "Cenar" },
  { time: "9:30 p. m.", duration: "1h", activity: "Acomodarse para dormir" },
];

function createOfficeEntries(endsAtFive = false): ScheduleEntry[] {
  return [
    { time: "5:00 a. m.", duration: "15m", activity: "Despertar" },
    { time: "5:15 a. m.", duration: "15m", activity: "Baño" },
    { time: "5:30 a. m.", duration: "30m", activity: "Desayuno" },
    { time: "6:00 a. m.", duration: "2h", activity: "Desplazamiento al trabajo" },
    ...(endsAtFive ? workdayUntilFive : workdayUntilSix),
    { time: endsAtFive ? "5:00 p. m." : "6:00 p. m.", duration: "2h", activity: "Desplazamiento a casa" },
    { time: endsAtFive ? "7:00 p. m." : "8:00 p. m.", duration: "30m", activity: "Acomodarse en casa" },
    ...(endsAtFive ? evening : lateOfficeEvening),
    { time: "10:30 p. m.", duration: "6h 30m", activity: "Dormir" },
  ];
}

function createHomeEntries(endsAtFive = false): ScheduleEntry[] {
  return [
    { time: "5:00 a. m.", duration: "15m", activity: "Despertar" },
    { time: "5:15 a. m.", duration: "15m", activity: "Baño" },
    { time: "5:30 a. m.", duration: "1h 30m", activity: "Estudio" },
    { time: "7:00 a. m.", duration: "30m", activity: "Desayuno" },
    { time: "7:30 a. m.", duration: "30m", activity: "Ordenar casa" },
    ...(endsAtFive ? workdayUntilFive : workdayUntilSix),
    { time: endsAtFive ? "5:00 p. m." : "6:00 p. m.", duration: endsAtFive ? "2h" : "1h", activity: "Tiempo en familia" },
    { time: "7:00 p. m.", duration: "30m", activity: "Tiempo Cris" },
    ...evening,
    { time: "10:30 p. m.", duration: "6h 30m", activity: "Dormir" },
  ];
}

const weekend: ScheduleEntry[] = [
  { time: "6:00 a. m.", duration: "15m", activity: "Despertar" },
  { time: "6:15 a. m.", duration: "15m", activity: "Baño" },
  { time: "6:30 a. m.", duration: "30m", activity: "Pausa para café" },
  { time: "7:00 a. m.", duration: "1h", activity: "Desayuno" },
  { time: "8:00 a. m.", duration: "1h 30m", activity: "Ordenar casa" },
  { time: "9:30 a. m.", duration: "30m", activity: "Pausa" },
  { time: "10:00 a. m.", duration: "1h 30m", activity: "Tiempo en familia" },
  { time: "11:30 a. m.", duration: "1h", activity: "Preparar comida" },
  { time: "12:30 p. m.", duration: "1h", activity: "Almuerzo" },
  { time: "1:30 p. m.", duration: "1h 30m", activity: "Tiempo en familia" },
  { time: "3:00 p. m.", duration: "30m", activity: "Pausa" },
  { time: "3:30 p. m.", duration: "3h", activity: "Tiempo en familia" },
  { time: "6:30 p. m.", duration: "1h", activity: "Tiempo Cris" },
  ...evening,
];

export const schedules: Schedule[] = [
  {
    id: "oficina",
    label: "Oficina",
    description: "Día de trabajo presencial",
    entries: createOfficeEntries(),
  },
  {
    id: "casa",
    label: "Casa",
    description: "Día de trabajo desde casa",
    entries: createHomeEntries(),
  },
  {
    id: "sabado",
    label: "Sábado",
    description: "Rutina del sábado",
    entries: [...weekend, { time: "10:30 p. m.", duration: "7h 30m", activity: "Dormir" }],
  },
  {
    id: "domingo",
    label: "Domingo y festivos",
    description: "Rutina de domingos y días festivos",
    entries: [...weekend, { time: "10:30 p. m.", duration: "5h 30m", activity: "Dormir" }],
  },
];

export function getScheduleForDay(schedule: Schedule, dayIndex: number): Schedule {
  const endsAtFive = dayIndex >= 3 && dayIndex <= 5;
  if (!endsAtFive || (schedule.id !== "oficina" && schedule.id !== "casa")) return schedule;

  return {
    ...schedule,
    description: `${schedule.description} · miércoles a viernes`,
    entries: schedule.id === "oficina" ? createOfficeEntries(true) : createHomeEntries(true),
  };
}
