"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"

/** Kawaii Hopper face — vector match for Hofladen Radar mascot (pale pink disc, grey–lavender head, pink ears & heart nose). */
export function HopperRabbitFace({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "")

  const headGrad = `hopper-head-${uid}`
  const earOuter = `hopper-ear-outer-${uid}`
  const earInner = `hopper-ear-inner-${uid}`

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("block select-none", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={headGrad} x1="50" y1="28" x2="50" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e4e4e8" />
          <stop offset="55%" stopColor="#d8d0e4" />
          <stop offset="100%" stopColor="#beb3d4" />
        </linearGradient>
        <linearGradient id={earOuter} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8e8ec" />
          <stop offset="100%" stopColor="#c9bfd8" />
        </linearGradient>
        <linearGradient id={earInner} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fce7f3" />
          <stop offset="100%" stopColor="#fbcfe8" />
        </linearGradient>
      </defs>

      {/* Pale pink disc (reference screenshot) */}
      <circle cx="50" cy="50" r="48" fill="#fdf2f7" />

      {/* Ears — behind head */}
      <g transform="translate(0,2)">
        <ellipse cx="31" cy="28" rx="11" ry="21" fill={`url(#${earOuter})`} transform="rotate(-12 31 28)" />
        <ellipse cx="69" cy="28" rx="11" ry="21" fill={`url(#${earOuter})`} transform="rotate(12 69 28)" />
        <ellipse cx="31" cy="30" rx="5.5" ry="13" fill={`url(#${earInner})`} transform="rotate(-12 31 30)" />
        <ellipse cx="69" cy="30" rx="5.5" ry="13" fill={`url(#${earInner})`} transform="rotate(12 69 30)" />
      </g>

      {/* Head */}
      <ellipse cx="50" cy="57" rx="27" ry="25" fill={`url(#${headGrad})`} />

      {/* Cheek blush */}
      <ellipse cx="36" cy="60" rx="6" ry="3.5" fill="#f9a8d4" opacity="0.35" />
      <ellipse cx="64" cy="60" rx="6" ry="3.5" fill="#f9a8d4" opacity="0.35" />

      {/* Whiskers */}
      <g stroke="#b8a3d9" strokeWidth="1.1" strokeLinecap="round" opacity="0.9">
        <line x1="14" y1="52" x2="30" y2="51" />
        <line x1="14" y1="57" x2="30" y2="57" />
        <line x1="14" y1="62" x2="30" y2="63" />
        <line x1="86" y1="52" x2="70" y2="51" />
        <line x1="86" y1="57" x2="70" y2="57" />
        <line x1="86" y1="62" x2="70" y2="63" />
      </g>

      {/* Eyes — vertical dots */}
      <rect x="41.2" y="48" width="2.8" height="7.5" rx="1.4" fill="#141414" />
      <rect x="56" y="48" width="2.8" height="7.5" rx="1.4" fill="#141414" />

      {/* Heart nose */}
      <g transform="translate(50, 59.5) scale(0.36)">
        <path
          fill="#f472b6"
          d="M0 3.2 C-4.2 -2.8 -9 -1 -9 4.2 C-9 8.5 -2 12.5 0 14.5 C2 12.5 9 8.5 9 4.2 C9 -1 4.2 -2.8 0 3.2 Z"
        />
      </g>

      {/* Mouth — small “w” */}
      <path
        d="M 44.5 66.5 L 47.2 70.2 L 50 66.8 L 52.8 70.2 L 55.5 66.5"
        fill="none"
        stroke="#141414"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
