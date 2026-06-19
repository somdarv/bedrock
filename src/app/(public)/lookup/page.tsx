import { EmptyState } from "@/components/ui/states";

export const metadata = { title: "Find my packages" };

export default function LookupPage() {
  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Find my packages</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your phone number to receive a one-time code and view all your work packages.
      </p>
      <div className="mt-8">
        <EmptyState
          title="OTP lookup lands later"
          description="Phone + one-time-code lookup is built with the client portal block, after the admin phases."
        />
      </div>
    </div>
  );
}
