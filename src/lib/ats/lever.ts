import type { AtsAdapter, NormalisedRole } from "./types";

type LeverJob = {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl?: string;
  createdAt?: number; // ms epoch
  categories?: {
    team?: string;
    department?: string;
    location?: string;
    commitment?: string;
  };
};

/**
 * Lever public postings API.
 * Token is the company board slug e.g. "mistral" → api.lever.co/v0/postings/mistral
 * Docs: https://help.lever.co/hc/en-us/articles/360022880914
 */
export const leverAdapter: AtsAdapter = async (token) => {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(
    token,
  )}?mode=json`;
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`lever ${token}: HTTP ${res.status} ${res.statusText}`);
  }
  const jobs = (await res.json()) as LeverJob[];
  const roles: NormalisedRole[] = jobs.map((j) => ({
    externalId: j.id,
    title: j.text,
    department:
      j.categories?.department?.trim() || j.categories?.team?.trim() || null,
    location: j.categories?.location?.trim() || null,
    url: j.hostedUrl,
    postedAt: j.createdAt ? new Date(j.createdAt) : null,
    snapshot: j as unknown as Record<string, unknown>,
  }));
  return roles;
};
