"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { PackageFormModal } from "@/components/admin/package-form-modal";

/** "New work package" for a specific client — opens the package form with the client pinned. */
export function NewPackageButton({
  clientId,
  clientName,
  size,
}: {
  clientId: string;
  clientName: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [creating, setCreating] = React.useState(false);

  function handleDone(message: string, packageId?: string) {
    setCreating(false);
    toast(message, "success");
    if (packageId) router.push(`/admin/packages/${packageId}`);
    else router.refresh();
  }

  return (
    <>
      <Button size={size} onClick={() => setCreating(true)}>
        New work package
      </Button>
      {creating && (
        <PackageFormModal
          open
          lockedClient={{ id: clientId, name: clientName }}
          onClose={() => setCreating(false)}
          onDone={handleDone}
        />
      )}
    </>
  );
}
