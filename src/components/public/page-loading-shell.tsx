import { cn } from "@/lib/utils"

type PageLoadingShellProps = {
  variant?: "radar" | "hof"
  className?: string
}

export function PageLoadingShell({ variant = "radar", className }: PageLoadingShellProps) {
  if (variant === "hof") {
    return (
      <main
        className={cn("hr-hof-landing min-h-screen animate-pulse bg-background", className)}
        aria-busy="true"
        aria-live="polite"
      >
        <div className="h-14 border-b border-border/60 bg-card/80" />
        <div className="mx-auto max-w-4xl space-y-4 px-4 py-8 sm:px-6">
          <div className="h-40 rounded-3xl bg-muted/50" />
          <div className="aspect-[16/9] rounded-2xl bg-muted/40" />
          <div className="h-28 rounded-2xl bg-muted/35" />
          <div className="h-48 rounded-2xl bg-muted/30" />
        </div>
      </main>
    )
  }

  return (
    <div
      className={cn("relative h-screen w-full overflow-hidden bg-background", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="absolute inset-0 animate-pulse bg-muted/35" />
      <div className="absolute left-4 top-4 hidden h-[calc(100vh-2rem)] w-[340px] animate-pulse rounded-2xl bg-muted/45 lg:block" />
      <div className="absolute left-3 right-3 top-3 h-36 animate-pulse rounded-2xl bg-muted/40 lg:hidden" />
      <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
        Hofladen Radar wird geladen…
      </p>
    </div>
  )
}
