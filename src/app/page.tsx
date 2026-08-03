import { ScheduleView } from "@/components/schedule-view";

export default function Home() {
  return (
    <main>
      <div className="page-shell home-shell">
        <ScheduleView mode="overview" />
      </div>
    </main>
  );
}
