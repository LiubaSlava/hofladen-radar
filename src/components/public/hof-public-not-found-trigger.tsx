import { notFound } from "next/navigation"

/** Renders once so Next/React dev perf marks exist before `notFound()` (avoids negative timestamp). */
export function HofPublicNotFoundTrigger() {
  notFound()
}
