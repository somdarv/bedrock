import { FxSettings } from "@/components/admin/fx-settings";
import { ReminderCalendar } from "@/components/admin/reminder-calendar";
import { SavingsSettings } from "@/components/admin/savings-settings";
import { WipeTestData } from "@/components/admin/wipe-test-data";
import { api, type FxState, type SavingsState } from "@/lib/api";

export default async function SettingsPage() {
  const [reminders, fx, savings] = await Promise.all([
    api.settings.getReminders(),
    // A rate outage must not take the whole settings page down with it.
    api.invoices.fx().catch(
      (): FxState => ({
        midRate: null,
        marginPercent: 11.5,
        validityDays: 7,
        effectiveRate: null,
        manualRate: null,
        ratedAt: null,
        stale: true,
        error: "The exchange rate could not be read.",
      }),
    ),
    api.savings.get().catch(
      (): SavingsState => ({
        ratePercent: 0,
        accrued: 0,
        moved: 0,
        pending: 0,
        receivedTotal: 0,
        entries: [],
      }),
    ),
  ]);

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

      <FxSettings state={fx} />
      <SavingsSettings state={savings} />
      <ReminderCalendar initial={reminders} />
      <WipeTestData />
    </div>
  );
}
