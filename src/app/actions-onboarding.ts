"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { frames as framesTable } from "@/db/schema";

/**
 * Three starter question-kind frames suggested by the onboarding overlay.
 * Kept here (not in the seed) because they're an *onboarding* gesture — the
 * cat handing Aadi three places to start thinking — not a permanent fixture
 * of the dashboard's default state.
 */
export const DEFAULT_ONBOARDING_QUESTIONS: ReadonlyArray<{
  name: string;
  description: string;
  prompt: string;
}> = [
  {
    name: "Where do they get policy leverage?",
    description:
      "What does this company actually *do* in policy — submit consultations, hire ex-government, run convenings, write op-eds?",
    prompt:
      "What is this company's primary mechanism for influencing AI policy outcomes, and how visible is it?",
  },
  {
    name: "Could I add value here on day one?",
    description:
      "Honest read on whether your background fills a gap they have, or duplicates capacity they already own.",
    prompt:
      "Given the existing policy team, what would I uniquely bring in the first 3 months that they don't already have?",
  },
  {
    name: "Two-year bet vs. five-year bet?",
    description:
      "Some roles pay off fast (regulatory window open, hiring lead-in role); others compound slowly. Which is this?",
    prompt:
      "Is joining this company a near-term tactical bet or a long-arc compounding one, and which am I optimising for right now?",
  },
];

/**
 * Insert the three default onboarding questions as question-kind frames.
 * Idempotent: skips any whose `name` already exists. Returns the count of
 * frames actually created so the UI can render an honest "added N" message.
 */
export async function addDefaultOnboardingQuestions(): Promise<{
  added: number;
}> {
  const existing = await db.select().from(framesTable);
  const existingNames = new Set(existing.map((f) => f.name.toLowerCase()));
  const maxSort = existing.reduce(
    (m, f) => (f.sortIndex > m ? f.sortIndex : m),
    -1,
  );

  const toInsert = DEFAULT_ONBOARDING_QUESTIONS.filter(
    (q) => !existingNames.has(q.name.toLowerCase()),
  );

  if (toInsert.length === 0) return { added: 0 };

  await db.insert(framesTable).values(
    toInsert.map((q, i) => ({
      name: q.name,
      description: q.description,
      kind: "question" as const,
      scale: 5,
      highLabel: null,
      lowLabel: null,
      prompt: q.prompt,
      sortIndex: maxSort + 1 + i,
    })),
  );

  revalidatePath("/frames");
  revalidatePath("/");
  return { added: toInsert.length };
}
