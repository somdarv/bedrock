"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { ClientNotifyEvent, ReminderSettings } from "@/lib/api";
import { saveReminderRules } from "@/lib/settings/actions";

const EVENT_LABEL: Record<ClientNotifyEvent, string> = {
  account_statement: "Account statement",
  payment_reminder: "Payment reminder",
};

interface Draft {
  dayOfMonth: number;
  event: ClientNotifyEvent;
  enabled: boolean;
}

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
};

export function ReminderCalendar({ initial }: { initial: ReminderSettings }) {
  const { toast } = useToast();
  const [pending, startSave] = React.useTransition();
  const [rules, setRules] = React.useState<Draft[]>(
    initial.rules.map((r) => ({ dayOfMonth: r.dayOfMonth, event: r.event, enabled: r.enabled })),
  );
  const events = initial.events;

  function addRule() {
    setRules((r) => [...r, { dayOfMonth: 1, event: events[0] ?? "payment_reminder", enabled: true }]);
  }

  function update(i: number, patch: Partial<Draft>) {
    setRules((r) => r.map((rule, idx) => (idx === i ? { ...rule, ...patch } : rule)));
  }

  function remove(i: number) {
    setRules((r) => r.filter((_, idx) => idx !== i));
  }

  function save() {
    startSave(async () => {
      const res = await saveReminderRules(rules);
      if (res.error) toast(res.error, "danger");
      else toast("Reminder schedule saved.", "success");
    });
  }

  return (
    <div className="space-y-4 rounded-lg border bg-surface p-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Reminder schedule</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          On each chosen day of the month, the selected message is sent to every active account with
          an outstanding balance. Runs automatically at 09:00 (Accra). Days beyond a month&apos;s length
          (e.g. the 31st in April) fire on the last day.
        </p>
      </div>

      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No scheduled reminders. Add one below, or keep using the manual “Send statement” buttons.
        </p>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-2 rounded-md border bg-background p-3"
            >
              <span className="text-sm text-muted-foreground">On the</span>
              <Select
                aria-label="Day of month"
                className="w-24"
                value={rule.dayOfMonth}
                onChange={(e) => update(i, { dayOfMonth: Number(e.target.value) })}
              >
                {Array.from({ length: 31 }, (_, d) => d + 1).map((d) => (
                  <option key={d} value={d}>
                    {ordinal(d)}
                  </option>
                ))}
              </Select>
              <span className="text-sm text-muted-foreground">send a</span>
              <Select
                aria-label="Message"
                className="w-52"
                value={rule.event}
                onChange={(e) => update(i, { event: e.target.value as ClientNotifyEvent })}
              >
                {events.map((ev) => (
                  <option key={ev} value={ev}>
                    {EVENT_LABEL[ev] ?? ev}
                  </option>
                ))}
              </Select>
              <label className="ml-1 inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={(e) => update(i, { enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                Active
              </label>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-danger"
                onClick={() => remove(i)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={addRule} disabled={pending}>
          Add reminder
        </Button>
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save schedule"}
        </Button>
      </div>
    </div>
  );
}
