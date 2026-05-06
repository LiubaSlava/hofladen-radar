"use client"

import { useEffect, useState } from "react"
import { AdminView } from "@/components/admin/admin-view"
import type { Farm } from "@/lib/data"

const ADMIN_LOGIN = "Gloryadmin"
const ADMIN_PASSWORD = "Glory27041958"
const ADMIN_AUTH_VALUE = `${ADMIN_LOGIN}:${ADMIN_PASSWORD}`
const ADMIN_AUTH_STORAGE_KEY = "glory_admin_auth"

function normalizeSecret(value: string): string {
  return value.trim().replace(/\s+/g, "").toLowerCase()
}

interface GloryAdminGateProps {
  farms: Farm[]
}

export function GloryAdminGate({ farms }: GloryAdminGateProps) {
  const [authorized, setAuthorized] = useState(false)
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const stored = window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY)
    setAuthorized(stored === ADMIN_AUTH_VALUE)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedLogin = normalizeSecret(login)
    const normalizedPassword = normalizeSecret(password)
    if (
      normalizedLogin === normalizeSecret(ADMIN_LOGIN) &&
      normalizedPassword === normalizeSecret(ADMIN_PASSWORD)
    ) {
      window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, ADMIN_AUTH_VALUE)
      setAuthorized(true)
      setError("")
      return
    }
    setError("Zugriff verweigert")
  }

  if (authorized) return <AdminView initialFarms={farms} />

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border border-border/60 bg-card/95 p-6 shadow-xl"
      >
        <h1 className="text-xl font-semibold text-foreground">Glory</h1>
        <p className="mt-1 text-sm text-muted-foreground">Administrationszugang</p>

        <div className="mt-5 space-y-3">
          <input
            value={login}
            onChange={(e) => {
              setLogin(e.target.value)
              if (error) setError("")
            }}
            placeholder="Login"
            className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground"
            autoComplete="username"
          />
          <input
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError("")
            }}
            placeholder="Passwort"
            type="password"
            className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground"
            autoComplete="current-password"
          />
        </div>

        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

        <button
          type="submit"
          className="mt-5 h-11 w-full rounded-2xl bg-primary text-sm font-medium text-primary-foreground"
        >
          Anmelden
        </button>
      </form>
    </main>
  )
}
