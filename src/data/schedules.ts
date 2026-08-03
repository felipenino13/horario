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

const workday: ScheduleEntry[] = [
  { time: "7:00 a. m.", duration: "2h 30m", activity: "Trabajo" },
  { time: "9:30 a. m.", duration: "30m", activity: "Pausa" },
  { time: "10:00 a. m.", duration: "2h 30m", activity: "Trabajo" },
  { time: "12:30 p. m.", duration: "1h", activity: "Almuerzo" },
  { time: "1:30 p. m.", duration: "1h 30m", activity: "Trabajo" },
  { time: "3:00 p. m.", duration: "30m", activity: "Pausa" },
  { time: "3:30 p. m.", duration: "1h 30m", activity: "Trabajo" },
];

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
    entries: [
      { time: "4:00 a. m.", duration: "15m", activity: "Despertar" },
      { time: "4:15 a. m.", duration: "15m", activity: "Baño" },
      { time: "4:30 a. m.", duration: "30m", activity: "Desayuno" },
      { time: "5:00 a. m.", duration: "2h", activity: "Desplazamiento al trabajo" },
      ...workday,
      { time: "5:00 p. m.", duration: "2h", activity: "Desplazamiento a casa" },
      { time: "7:00 p. m.", duration: "30m", activity: "Acomodarse en casa" },
      ...evening,
      { time: "10:30 p. m.", duration: "5h 30m", activity: "Dormir" },
    ],
  },
  {
    id: "casa",
    label: "Casa",
    description: "Día de trabajo desde casa",
    entries: [
      { time: "4:00 a. m.", duration: "15m", activity: "Despertar" },
      { time: "4:15 a. m.", duration: "15m", activity: "Baño" },
      { time: "4:30 a. m.", duration: "1h 30m", activity: "Estudio" },
      { time: "6:00 a. m.", duration: "30m", activity: "Desayuno" },
      { time: "6:30 a. m.", duration: "30m", activity: "Ordenar casa" },
      ...workday,
      { time: "5:00 p. m.", duration: "2h", activity: "Tiempo en familia" },
      { time: "7:00 p. m.", duration: "30m", activity: "Tiempo Cris" },
      ...evening,
      { time: "10:30 p. m.", duration: "5h 30m", activity: "Dormir" },
    ],
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
