"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError, type ReminderRuleInput } from "@/lib/api";

export interface SettingsActionState {
  ok?: boolean;
  error?: string;
}

export async function saveReminderRules(
  rules: ReminderRuleInput[],
): Promise<SettingsActionState> {
  try {
    await api.settings.saveReminders(rules);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not save reminders." };
  }
  revalidatePath("/admin/settings");
  return { ok: true };
}
