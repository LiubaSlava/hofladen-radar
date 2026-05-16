"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import type { ComponentProps } from "react"

const BunnyWidget = dynamic(() => import("@/components/public/bunny-widget").then((m) => m.BunnyWidget), {
  ssr: false,
  loading: () => null,
})

type DeferredBunnyWidgetProps = ComponentProps<typeof BunnyWidget>

export function DeferredBunnyWidget(props: DeferredBunnyWidgetProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const onReady = () => setReady(true)
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(onReady, { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    }
    const timer = window.setTimeout(onReady, 800)
    return () => window.clearTimeout(timer)
  }, [])

  if (!ready) return null
  return <BunnyWidget {...props} />
}
