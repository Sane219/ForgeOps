import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
          ForgeOps
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          The internal developer platform
          <br />
          with an AI copilot built in.
        </h1>
        <p className="mx-auto max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
          Scaffold services, generate Kubernetes &amp; GitOps artifacts, run DevSecOps checks, and
          monitor rollouts from one place.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium transition hover:bg-accent"
        >
          Create workspace
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        Day-1 scaffold. Auth pages and the workspace dashboard arrive in Phase 4 (Days 6–7).
      </p>
    </main>
  );
}
