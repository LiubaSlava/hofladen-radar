import Image from "next/image"
import { BRAND_LOGO_SRC } from "@/lib/brand-assets"
import { cn } from "@/lib/utils"

type BrandLogoMarkProps = {
  size?: "sm" | "md"
  className?: string
  priority?: boolean
}

/** Circular logo frame — same as main radar sidebar / mobile bar. */
export function BrandLogoMark({ size = "md", className, priority }: BrandLogoMarkProps) {
  const box = size === "sm" ? "h-9 w-9" : "h-11 w-11"
  const px = size === "sm" ? 64 : 80

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/15 bg-card shadow-sm",
        box,
        className,
      )}
    >
      <Image
        src={BRAND_LOGO_SRC}
        alt="Hofladen Radar"
        width={px}
        height={px}
        className="h-full w-full object-contain"
        priority={priority}
      />
    </div>
  )
}
