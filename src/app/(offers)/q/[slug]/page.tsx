import { notFound } from "next/navigation";
import { Configurator } from "@/components/quote/configurator";
import { decodeConfig } from "@/lib/school-mis/config";
import { getProspect } from "@/lib/school-mis/prospects";
import { ALL_ITEMS } from "@/lib/school-mis/catalogue";

/**
 * Rendered per request, never prerendered: a shared link carries its configuration in
 * `?c=`, and a static shell would silently drop it back to the preset.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prospect = getProspect(slug);
  return {
    title: prospect
      ? `School Management System · ${prospect.school}`
      : "School Management System",
    description: prospect
      ? `A school management system configured for ${prospect.school}, ${prospect.town}.`
      : undefined,
    robots: { index: false, follow: false },
  };
}

const PRINCIPLES = [
  {
    title: "One record, one lifetime",
    body: "A pupil is created once at application and the same record carries them through every class, term, payment and report card, out to graduation or transfer.",
  },
  {
    title: "No structural limits, no structural billing",
    body: "The school defines its own sections, levels and classes without limit. Adding the JHS is a configuration change, not a purchase.",
  },
  {
    title: "Built for poor power and network",
    body: "Core operations survive a dropped connection. Nothing is lost mid-save, and the register can be marked when the network is not there at all.",
  },
  {
    title: "SMS as the guaranteed channel",
    body: "Every parent has a phone. WhatsApp and the portal are enhancements, never assumptions.",
  },
];

export default async function ConfiguratorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { slug } = await params;
  const { c } = await searchParams;
  const prospect = getProspect(slug);
  if (!prospect) notFound();

  // A link carries its configuration. Without one, open on what we recommend.
  const initialConfig = c ? decodeConfig(c, prospect.preset) : prospect.preset;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      {/* Opening */}
      <header className="max-w-3xl">
        <div className="eyebrow">Prepared for {prospect.school}</div>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tightest md:text-5xl">
          A school management system,
          <br />
          built the shape of your school.
        </h1>
        <p className="mt-6 text-base leading-8 text-muted-foreground">{prospect.situation}</p>
        <p className="mt-4 text-base leading-8 text-muted-foreground">
          Below is the whole system, {ALL_ITEMS.length} features across fifteen categories. Choose
          the foundation, add the modules that earn their keep, and leave the rest for later. The
          price moves as you go, and the link at the end is the quote.
        </p>
      </header>

      {/* The four principles the whole thing rests on */}
      <div className="mt-12 grid gap-x-10 gap-y-8 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {PRINCIPLES.map((p, i) => (
          <div key={p.title}>
            <div className="text-xs font-medium tabular-nums text-subtle">
              {String(i + 1).padStart(2, "0")}
            </div>
            <h2 className="mt-2 font-display text-sm font-semibold leading-snug">{p.title}</h2>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </div>

      {/* What we would choose, and why */}
      <div className="mt-12 rounded-lg border border-border bg-surface p-6">
        <div className="eyebrow">What we recommend</div>
        <p className="mt-2.5 max-w-3xl text-base leading-8 text-muted-foreground">
          {prospect.recommendation}
        </p>
        <p className="mt-3 text-xs text-subtle">
          The page opens on that recommendation. Everything on it is yours to change.
        </p>
      </div>

      <div className="mt-16">
        <Configurator prospect={prospect} initialConfig={initialConfig} />
      </div>
    </div>
  );
}
