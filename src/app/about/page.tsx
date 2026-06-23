export const dynamic = "force-dynamic";

import { SiteShell } from "@/components/site-shell";
import { ProfileEditor } from "@/components/profile-editor";
import { ReplayOnboardingLink } from "@/components/replay-onboarding-link";
import { CompanyNotesIndex } from "@/components/company-notes-index";
import { getUserProfile, getAllCompanyNotes } from "@/lib/queries";

type LocationPrefs = {
  uk?: boolean;
  eu?: boolean;
  us?: boolean;
  remoteOk?: boolean;
  notes?: string;
};

type OpenTextAnswer = {
  question: string;
  answer: string;
  answeredAt?: string;
};

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

  const locationPreferences =
    ((profile.locationPreferences as LocationPrefs) ?? {}) as LocationPrefs;
  const openTextAnswers = (
    (profile.openTextAnswers as OpenTextAnswer[]) ?? []
  ).map((a) => ({
    question: a.question ?? "",
    answer: a.answer ?? "",
    answeredAt: a.answeredAt,
  }));

  return (
    <SiteShell>
      <ProfileEditor
        displayName={profile.displayName}
        currentRoleOneLiner={profile.currentRoleOneLiner ?? null}
        exploringText={profile.exploringText ?? null}
        locationPreferences={locationPreferences}
        openTextAnswers={openTextAnswers}
      />
      <CompanyNotesIndex notes={notes} />
      <div className="max-w-[42rem] mx-auto px-6 pb-16">
        <ReplayOnboardingLink />
      </div>
    </SiteShell>
  );
}
