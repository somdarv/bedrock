import { redirect } from "next/navigation";
import { BrandLockup } from "@/components/brand-mark";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  // Already authenticated? Skip the form.
  if (await getSession()) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <BrandLockup />
        </div>
        <div className="rounded-xl border bg-surface p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage clients, packages, and delivery.
          </p>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-subtle">
          SaharaBase Technologies · Bedrock Admin
        </p>
      </div>
    </div>
  );
}
