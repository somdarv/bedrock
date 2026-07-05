import { EmptyState } from "@/components/ui/states";

export default function SettingsPage() {
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

      <EmptyState title="Nothing to configure yet" description="Settings arrive as the admin matures." />
    </div>
  );
}
