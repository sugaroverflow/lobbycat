import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { MapView } from "@/components/map-view";
import { TrackerTable } from "@/components/tracker-table";
import {
  getMapData,
  getTrackerData,
  getUserProfile,
} from "@/lib/queries";

export default async function HomePage() {
  const [{ companies, scaleFrames }, trackerCompanies, profile] =
    await Promise.all([
      getMapData(),
      getTrackerData(),
      getUserProfile(),
    ]);
  const firstName = profile?.displayName?.split(" ")[0] || null;

  return (
    <SiteShell>
      <section className="max-w-[72rem] mx-auto px-6 pt-12 pb-6">
        <div className="eyebrow mb-6">
          {firstName ? `Welcome back, ${firstName}` : "The map"}
        </div>
        <h1 className="serif text-4xl sm:text-5xl font-medium leading-[1.05] tracking-tight text-ink">
          {companies.length} companies, two axes you choose.
        </h1>
        <p className="serif mt-6 max-w-2xl text-lg text-muted leading-relaxed">
          Pick any pair of your scale-kind frames and watch the field
          rearrange. Tier colour stays put; meaning shifts under your hands.{" "}
          <Link href="/companies" className="text-accent underline">
            See the full tier list →
          </Link>
        </p>
      </section>

      <section className="max-w-[72rem] mx-auto px-6 pb-16">
        <MapView companies={companies} frames={scaleFrames} />
      </section>

      <section className="max-w-[72rem] mx-auto px-6 pb-24">
        <div className="flex items-baseline justify-between border-b border-rule pb-2 mb-4">
          <h2 className="eyebrow">Live tracker</h2>
          <span className="mono text-xs text-whisper">
            {trackerCompanies.length} companies
          </span>
        </div>
        <p className="serif text-base text-muted leading-relaxed mb-6 max-w-2xl">
          Roles and publications across the field, sortable. The map up top
          shows where they sit; this is what they&rsquo;re doing.
        </p>
        <TrackerTable companies={trackerCompanies} />
      </section>
    </SiteShell>
  );
}
