"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/states";
import { login, type LoginState } from "@/lib/auth/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <Field label="Email" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@saharabase.test"
          required
        />
      </Field>
      <Field label="Password" htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      {state.error && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Spinner /> : null}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
