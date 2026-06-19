import { EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of clients, packages, and money.</p>
        </div>
        <Badge variant="warning">Phase 0 · scaffold</Badge>
      </div>
      <EmptyState
        title="Nothing here yet"
        description="Clients and Work Packages land in Phase 2–3. This is the wired-up admin shell."
      />
    </div>
  );
}
