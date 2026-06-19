import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicHome() {
  return (
    <div className="mx-auto max-w-2xl py-12 text-center">
      <p className="text-sm font-medium text-primary">SaharaBase Technologies</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Work, delivered the moment payment clears.
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Bedrock keeps your project, price, and files in one place. Open the link your provider sent
        you to see scope, previews, and pay securely.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <Button asChild>
          <Link href="/lookup">Find my packages</Link>
        </Button>
      </div>
      <p className="mt-10 text-xs text-subtle">
        Have a package link? Open it directly — no account needed.
      </p>
    </div>
  );
}
