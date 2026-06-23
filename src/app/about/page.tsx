import { SiteShell } from "@/components/site-shell";
import { ProfileEditor } from "@/components/profile-editor";
import { ReplayOnboardingLink } from "@/components/replay-onboarding-link";
import { CompanyNotesIndex } from "@/components/company-notes-index";
import { getUserProfile, getAllCompanyNotes } from "@/lib/queries";

export default async function AboutPage() {
  const [profile, notes] = await Promise.all([
    getUserProfile(),
    getAllCompanyNotes(),
  ]);
  if (!profile) {
    return (
      <SiteShell>
        <section className="max-w-[42rem] mx-auto px-6 pt-12 pb-24">
          <p className="serif text-muted">No profile yet.</p>
        </section>
      </SiteShell>
    );
  }

  const concerns = (profile.concerns as string[]) || [];
  const rawWeights = (profile.weights as Record<string, unknown>) || {};
  const weights: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawWeights)) {
    weights[k] = v == null ? "" : String(v);
  }
  const sources = (profile.sources as string[]) || [];

  return (
    <SiteShell>
      <ProfileEditor
        displayName={profile.displayName}
        headline={profile.headline ?? null}
        bio={profile.bio ?? null}
        concerns={concerns}
        weights={weights}
        sources={sources}
      />
      <CompanyNotesIndex notes={notes} />
      <div className="max-w-[42rem] mx-auto px-6 pb-16">
        <ReplayOnboardingLink />
      </div>
    </SiteShell>
  );
}
