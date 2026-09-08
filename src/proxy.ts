import { NextResponse, type NextRequest } from "next/server";

// Temporary student-portal block. While NEXT_PUBLIC_STUDENT_PORTAL_CLOSED is
// truthy, every /student page is redirected to /portal-closed so students see
// a "temporarily closed" notice instead of the portal. Flip the env var off to
// reopen.
const IS_STUDENT_PORTAL_CLOSED =
  process.env.NEXT_PUBLIC_STUDENT_PORTAL_CLOSED === "true";

export default function proxy(request: NextRequest) {
  if (IS_STUDENT_PORTAL_CLOSED) {
    const { pathname } = request.nextUrl;
    if (pathname === "/student" || pathname.startsWith("/student/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal-closed";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}
