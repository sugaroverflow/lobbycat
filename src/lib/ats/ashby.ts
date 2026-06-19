import type { AtsAdapter, NormalisedRole } from "./types";

type AshbyJob = {
  id: string;
  title: string;
  department?: string | null;
  team?: string | null;
  location?: string | null;
  publishedDate?: string | null;
  jobUrl?: string;
  applyUrl?: string;
  isListed?: boolean;
};

type AshbyResponse = {
  apiVersion?: string;
  jobs?: AshbyJob[];
};

/**
 * Ashby public job board API.
 * Token is the company job-board name e.g. "openai" → api.ashbyhq.com/posting-api/job-board/openai
 * Docs: https://developers.ashbyhq.com/reference/publicjobpostings
 */
export const ashbyAdapter: AtsAdapter = async (token) => {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(
    token,
  )}?includeCompensation=false`;
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`ashby ${token}: HTTP ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as AshbyResponse;
  const jobs = (data.jobs ?? []).filter((j) => j.isListed !== false);
  const roles: NormalisedRole[] = jobs.map((j) => ({
    externalId: j.id,
    title: j.title,
    department: j.department?.trim() || j.team?.trim() || null,
    location: j.location?.trim() || null,
    url: j.jobUrl || j.applyUrl || `https://jobs.ashbyhq.com/${token}/${j.id}`,
    postedAt: j.publishedDate ? new Date(j.publishedDate) : null,
    snapshot: j as unknown as Record<string, unknown>,
  }));
  return roles;
};
