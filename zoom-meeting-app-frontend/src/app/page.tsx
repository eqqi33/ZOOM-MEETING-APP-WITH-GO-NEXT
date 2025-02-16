import Calendar from "@/components/Calendar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col p-4 bg-slate-100 dark:bg-gray-900">
      <Calendar />
    </div>
  );
}