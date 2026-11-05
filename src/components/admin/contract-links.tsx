"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { ContractLink } from "@/lib/api";
import { acceptedWhen, phoneWords } from "@/lib/documents/acceptance";

/**
 * Our side of a contract signed online: the private link to send, and who has accepted it. The
 * link appears only here, behind the sign-in, because it is the key to signing.
 */
export function ContractLinks({
  contracts,
  origin,
}: {
  contracts: ContractLink[];
  origin: string;
}) {
  const { toast } = useToast();

  const copy = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast("Link copied.", "success");
  };

  return (
    <section>
      <h2 className="font-display text-xl font-semibold">Contracts to sign</h2>
      <ul className="divide-border border-border bg-surface mt-3 divide-y overflow-hidden rounded-xl border">
        {contracts.map((c) => {
          const link = `${origin}/c/${c.token}`;
          return (
            <li
              key={c.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6"
            >
              <div className="min-w-0">
                <div className="font-medium">{c.title}</div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {c.party} · {c.reference}
                </div>
                <div className="mt-1.5 text-sm">
                  {c.acceptance ? (
                    <>
                      Accepted by <strong>{c.acceptance.name}</strong>
                      {c.acceptance.phone && `, ${phoneWords(c.acceptance.phone)}`},{" "}
                      {acceptedWhen(c.acceptance.at)}
                    </>
                  ) : (
                    <span className="text-muted-foreground">Not yet accepted</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => copy(link)}>
                  Copy link
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    Open
                  </a>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
