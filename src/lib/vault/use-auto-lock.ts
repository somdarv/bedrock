"use client";

import * as React from "react";

/** Minutes of inactivity before the vault relocks. "off" is offered but discouraged. */
export const AUTO_LOCK_CHOICES = [1, 5, 15, 30, 0] as const;

const STORAGE_KEY = "bedrock:vault-autolock";
const DEFAULT_MINUTES = 5;

/** Only the timeout preference is persisted. The data key never is. */
export function readAutoLockPreference(): number {
  if (typeof window === "undefined") return DEFAULT_MINUTES;
  const raw = Number(window.localStorage.getItem(STORAGE_KEY));
  return AUTO_LOCK_CHOICES.includes(raw as (typeof AUTO_LOCK_CHOICES)[number])
    ? raw
    : DEFAULT_MINUTES;
}

export function writeAutoLockPreference(minutes: number) {
  window.localStorage.setItem(STORAGE_KEY, String(minutes));
}

/**
 * Relock the vault after a stretch of no activity. Activity means real user input, not the tab
 * merely being open, so leaving an unlocked vault on screen and walking away still locks it.
 *
 * The timer is one of three locks. The others are the manual button and the fact that the data
 * key lives in React state only, so a reload or a closed tab drops it regardless.
 */
export function useAutoLock(active: boolean, minutes: number, onLock: () => void) {
  // Held in a ref so the effect does not resubscribe every render when the parent re-renders.
  const lockRef = React.useRef(onLock);
  lockRef.current = onLock;

  React.useEffect(() => {
    if (!active || minutes <= 0) return;

    const ms = minutes * 60_000;
    let timer: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => lockRef.current(), ms);
    };

    const events: (keyof DocumentEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];
    events.forEach((e) => document.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => document.removeEventListener(e, reset));
    };
  }, [active, minutes]);
}

/**
 * Copy a secret and wipe it from the clipboard afterwards. Best effort: browsers refuse
 * clipboard writes from a tab that has lost focus, so the wipe can silently fail if the user
 * has switched away. It shortens the exposure window rather than guaranteeing anything.
 */
export async function copySecret(value: string, clearAfterMs = 30_000): Promise<void> {
  await navigator.clipboard.writeText(value);

  window.setTimeout(async () => {
    try {
      const current = await navigator.clipboard.readText();
      if (current === value) await navigator.clipboard.writeText("");
    } catch {
      // Clipboard read denied or the tab is in the background. Nothing to do.
    }
  }, clearAfterMs);
}
