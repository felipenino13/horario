import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScheduleView } from "@/components/schedule-view";
import { schedules } from "@/data/schedules";

type SchedulePageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return schedules.map((schedule) => ({ id: schedule.id }));
}

export async function generateMetadata({ params }: SchedulePageProps): Promise<Metadata> {
  const { id } = await params;
  const schedule = schedules.find((item) => item.id === id);
  return { title: schedule ? `${schedule.label} | Mi horario` : "Horario no encontrado" };
}

export default async function SchedulePage({ params }: SchedulePageProps) {
  const { id } = await params;
  const schedule = schedules.find((item) => item.id === id);
  if (!schedule) notFound();

  return (
    <main>
      <div className="page-shell detail-shell">
        <Link className="back-link" href="/">← Volver al inicio</Link>
        <ScheduleView mode="detail" scheduleId={schedule.id} />
      </div>
    </main>
  );
}
