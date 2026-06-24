import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Wordmark } from "@/components/wordmark";

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") || "");
  const from = String(formData.get("from") || "/");
  if (password === process.env.LOBBYCAT_PASSWORD) {
    const jar = await cookies();
    jar.set("lc_auth", password, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    redirect(from || "/");
  }
  redirect(`/login?from=${encodeURIComponent(from)}&err=1`);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; err?: string }>;
}) {
  const { from = "/", err } = await searchParams;
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-bg">
      <div className="max-w-sm w-full">
        <div className="eyebrow mb-6">Locked</div>
        <div className="serif text-3xl text-ink tracking-tight flex items-center">
          <Wordmark size={40} />
        </div>
        <p className="serif text-base text-muted mt-3">
          A quiet dashboard. Password, please.
        </p>
        <form action={login} className="mt-8 space-y-3">
          <input type="hidden" name="from" value={from} />
          <input
            type="password"
            name="password"
            autoFocus
            autoComplete="current-password"
            placeholder="password"
            className="serif w-full px-4 py-3 bg-surface border border-rule rounded-sm placeholder:text-whisper focus:outline-none focus:border-accent"
          />
          {err && (
            <p className="mono text-xs text-warm">that&apos;s not it. try again.</p>
          )}
          <button
            type="submit"
            className="mono text-xs uppercase tracking-[0.14em] w-full py-3 bg-ink text-white rounded-sm hover:bg-accent transition"
          >
            Enter
          </button>
        </form>
      </div>
    </main>
  );
}
