export const dynamic = "force-dynamic";

import { SiteShell } from "@/components/site-shell";
import { ProfileEditor } from "@/components/profile-editor";
import { ReplayOnboardingLink } from "@/components/replay-onboarding-link";
import { CompanyNotesIndex } from "@/components/company-notes-index";
import { ClarifyConversationsIndex } from "@/components/clarify-conversations-index";
import {
  getUserProfile,
  getAllCompanyNotes,
  getClarifySessionsForAbout,
} from "@/lib/queries";

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
  const [profile, notes, clarifySessions] = await Promise.all([
    getUserProfile(),
    getAllCompanyNotes(),
    getClarifySessionsForAbout(),
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
      <div className="max-w-[42rem] mx-auto px-6 pb-6 flex justify-end">
        <ReplayOnboardingLink />
      </div>
      <ProfileEditor
        displayName={profile.displayName}
        currentRoleOneLiner={profile.currentRoleOneLiner ?? null}
        exploringText={profile.exploringText ?? null}
        locationPreferences={locationPreferences}
        openTextAnswers={openTextAnswers}
      />
      <CompanyNotesIndex notes={notes} />
      <ClarifyConversationsIndex sessions={clarifySessions} />
    </SiteShell>
  );
}
