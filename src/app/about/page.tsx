import { SiteShell } from "@/components/site-shell";
import { ProfileEditor } from "@/components/profile-editor";
import { ReplayOnboardingLink } from "@/components/replay-onboarding-link";
import { NextRoleForm } from "@/components/next-role-form";
import { getUserProfile } from "@/lib/queries";

export default async function AboutPage() {
  const profile = await getUserProfile();
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
      <NextRoleForm />
      <div className="max-w-[42rem] mx-auto px-6 pb-16">
        <ReplayOnboardingLink />
      </div>
    </SiteShell>
  );
}
