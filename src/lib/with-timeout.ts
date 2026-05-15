/** Reject if `promise` does not settle within `ms` (used during `next build` and runtime fetches). */
export function withTimeout<T>(promise: PromiseLike<T>, ms: number, label = "operation"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(id)
        resolve(value)
      })
      .catch((error: unknown) => {
        clearTimeout(id)
        reject(error)
      })
  })
}
