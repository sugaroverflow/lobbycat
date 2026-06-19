import type { AtsAdapter, NormalisedRole } from "./types";

type GreenhouseJob = {
  id: number;
  title: string;
  absolute_url: string;
  updated_at?: string;
  location?: { name?: string } | null;
  departments?: Array<{ name?: string }>;
};

/**
 * Greenhouse public job board API.
 * Token is the company board slug e.g. "anthropic" → boards-api.greenhouse.io/v1/boards/anthropic/jobs
 * Docs: https://developers.greenhouse.io/job-board.html
 */
export const greenhouseAdapter: AtsAdapter = async (token) => {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
    token,
  )}/jobs?content=false`;
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    // Greenhouse is generally fast; 15s cap for cron predictability.
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(
      `greenhouse ${token}: HTTP ${res.status} ${res.statusText}`,
    );
  }
  const data = (await res.json()) as { jobs?: GreenhouseJob[] };
  const jobs = data.jobs ?? [];
  const roles: NormalisedRole[] = jobs.map((j) => ({
    externalId: String(j.id),
    title: j.title,
    department: j.departments?.[0]?.name?.trim() || null,
    location: j.location?.name?.trim() || null,
    url: j.absolute_url,
    postedAt: j.updated_at ? new Date(j.updated_at) : null,
    snapshot: j as unknown as Record<string, unknown>,
  }));
  return roles;
};
