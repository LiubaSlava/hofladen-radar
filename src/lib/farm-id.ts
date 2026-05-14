/** True if `id` looks like a Postgres uuid for a persisted farm (rejects JSON import preview ids, etc.). */
export function isPersistedFarmUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}
