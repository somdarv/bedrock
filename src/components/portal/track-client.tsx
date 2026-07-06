"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { balance, type TrackResult } from "@/lib/api";
import { statusMeta } from "@/lib/status";
import { formatCedis } from "@/lib/utils";
import { sendTrackingCode, verifyTrackingCode } from "@/lib/track/actions";

type Step = "phone" | "code" | "done";

export function TrackClient() {
  const [step, setStep] = React.useState<Step>("phone");
  const [phone, setPhone] = React.useState("");
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();
  const [result, setResult] = React.useState<TrackResult | null>(null);
  const [pending, start] = React.useTransition();

  function requestCode() {
    setError(undefined);
    start(async () => {
      const res = await sendTrackingCode(phone);
      if (res.error) setError(res.error);
      else setStep("code");
    });
  }

  function verify() {
    setError(undefined);
    start(async () => {
      const res = await verifyTrackingCode(phone, code);
      if (res.error) setError(res.error);
      else if (res.result) {
        setResult(res.result);
        setStep("done");
      }
    });
  }

  if (step === "done" && result) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Hi {result.client.name.split(" ")[0]}, here are your projects
        </h1>
        {result.packages.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">You have no projects yet.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {result.packages.map((pkg) => {
              const meta = statusMeta(pkg.status);
              const due = Math.max(0, balance(pkg));
              return (
                <li key={pkg.id}>
                  <Link
                    href={`/p/${pkg.publicSlug}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{pkg.title}</div>
                      <div className="mt-1">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs text-muted-foreground">
                        {due > 0 ? "Balance" : "Settled"}
                      </div>
                      <div className="font-display text-sm font-semibold tabular-nums">
                        {formatCedis(due)}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setCode("");
            setResult(null);
          }}
          className="mt-6 text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Use a different number
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Track your projects</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {step === "phone"
          ? "Enter your phone number and we'll send a one-time code on WhatsApp to view all your projects."
          : `Enter the 6-digit code we sent to ${phone} on WhatsApp.`}
      </p>

      <div className="mt-8 space-y-4">
        {step === "phone" ? (
          <>
            <Field label="Phone number" htmlFor="phone" error={error}>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="024 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && phone && requestCode()}
                disabled={pending}
              />
            </Field>
            <Button onClick={requestCode} disabled={pending || !phone.trim()} className="w-full">
              {pending ? "Sending…" : "Send code"}
            </Button>
          </>
        ) : (
          <>
            <Field label="One-time code" htmlFor="code" error={error}>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && code.length === 6 && verify()}
                disabled={pending}
              />
            </Field>
            <Button onClick={verify} disabled={pending || code.length !== 6} className="w-full">
              {pending ? "Checking…" : "View my projects"}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setError(undefined);
                  setCode("");
                }}
                className="text-muted-foreground underline-offset-4 hover:underline"
              >
                Change number
              </button>
              <button
                type="button"
                onClick={requestCode}
                disabled={pending}
                className="text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
