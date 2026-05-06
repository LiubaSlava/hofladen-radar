interface RadarPulseProps {
  intensity?: "full" | "subtle"
}

export function RadarPulse({ intensity = "full" }: RadarPulseProps) {
  const baseSize = intensity === "full" ? "h-32 w-32 md:h-48 md:w-48" : "h-24 w-24"
  const opacity = intensity === "full" ? "opacity-100" : "opacity-50"

  return (
    <div
      className={`pointer-events-none absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2 ${opacity}`}
      aria-hidden="true"
    >
      <div className={`relative ${baseSize}`}>
        {/* Outer pulses */}
        <span className="absolute inset-0 animate-ping rounded-full border-2 border-primary/40" />
        <span
          className="absolute inset-0 animate-ping rounded-full border border-primary/30"
          style={{ animationDelay: "0.6s", animationDuration: "2.5s" }}
        />
        <span
          className="absolute inset-0 animate-ping rounded-full border border-primary/20"
          style={{ animationDelay: "1.2s", animationDuration: "3s" }}
        />
        {/* Soft glow */}
        <span className="absolute inset-[20%] rounded-full bg-primary/15 blur-2xl" />
        {/* Center dot */}
        <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-lg shadow-primary/50" />
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground" />
      </div>
    </div>
  )
}
