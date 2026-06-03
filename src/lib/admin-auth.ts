export const ADMIN_AUTH_HEADER = "x-admin-auth"
export const ADMIN_AUTH_VALUE = "Gloryadmin:Glory27041958"

export function isAdminAuthorized(request: Request): boolean {
  return request.headers.get(ADMIN_AUTH_HEADER) === ADMIN_AUTH_VALUE
}
