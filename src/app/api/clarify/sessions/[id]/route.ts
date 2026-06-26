/**
 * v0.8 Step 9 — Tiny GET forwarder so the /about Conversations index
 * can lazy-load a single session's transcript without a full page nav.
 *
 * Why a route handler instead of letting the component import the
 * query: React Client Components can't call DB code directly. We
 * could expose the query via a Server Action, but server actions
 * default to POST and we want GET semantics for cacheability and a
 * sensible URL the user can paste into devtools. Tiny route handler
 * is the lighter touch. (A9.2)
 */

import { NextResponse } from "next/server";
import { getClarifySessionWithMessages } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }
  const detail = await getClarifySessionWithMessages(id);
  if (!detail) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
