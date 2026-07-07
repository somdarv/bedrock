import { ReminderCalendar } from "@/components/admin/reminder-calendar";
import { WipeTestData } from "@/components/admin/wipe-test-data";
import { api } from "@/lib/api";

export default async function SettingsPage() {
  const reminders = await api.settings.getReminders();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <div className="eyebrow">Admin</div>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tightest md:text-4xl">
          Settings
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Workspace, branding, payment and notification configuration.
        </p>
      </header>

      <ReminderCalendar initial={reminders} />
      <WipeTestData />
    </div>
  );
}
