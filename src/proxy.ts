import { NextResponse, type NextRequest } from "next/server"

/**
 * Admin-Routen: vorübergehend freier Zugang (kein Redirect auf `/?admin=forbidden`).
 * Später hier wieder Auth einhängen.
 */
export function proxy(request: NextRequest) {
  void request
  return NextResponse.next()
}

export const config = {
  matcher: ["/Glory/:path*"],
}
