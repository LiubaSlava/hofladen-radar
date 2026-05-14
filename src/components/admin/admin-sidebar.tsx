"use client"

import { useState } from "react"
import Image from "next/image"
import {
  LayoutDashboard,
  Store,
  Package,
  Users,
  Settings,
  ChevronLeft,
  MessageSquareText,
  Smartphone,
  Sparkles,
  FileJson2,
} from "lucide-react"

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "hofladen", label: "Hofladen", icon: Store },
  { key: "json-import", label: "JSON-Import", icon: FileJson2 },
  { key: "ki-ueberblick", label: "KI-Überblick", icon: Sparkles },
  { key: "kommentare", label: "Kommentare", icon: MessageSquareText },
  { key: "app-verwaltung", label: "App-Verwaltung", icon: Smartphone },
  { key: "produkte", label: "Produkte", icon: Package },
  { key: "benutzer", label: "Benutzer", icon: Users },
  { key: "einstellungen", label: "Einstellungen", icon: Settings },
]

interface AdminSidebarProps {
  active: string
  onChange: (key: string) => void
}

export function AdminSidebar({ active, onChange }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-border bg-card transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[240px]"
      }`}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
          <Image
            src="/logo.png"
            alt="Hofladen Radar"
            width={72}
            height={72}
            className="h-full w-full object-contain"
            priority
          />
        </div>
        {!collapsed && (
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">
              Hofladen Radar
            </p>
            <p className="truncate text-[10px] text-muted-foreground">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = active === item.key
            return (
              <li key={item.key}>
                <button
                  onClick={() => onChange(item.key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && <span>Einklappen</span>}
        </button>
      </div>
    </aside>
  )
}
