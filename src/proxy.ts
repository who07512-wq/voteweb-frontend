import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

// Next.js 16 renamed middleware to proxy. Clerk's clerkMiddleware returns a
// NextMiddleware-compatible handler; we re-export it as the default proxy
// function so it runs on every navigation.
//
// NOTE: this proxy intentionally does NOT gate routes. The app's real auth is
// the backend session (`cv_sid` httpOnly cookie on the VoteWeb API origin),
// which this middleware cannot verify — requiring a Clerk session here would
// bounce password-logged-in users (who have no Clerk session) back to /login.
// Access control for /candidate/* is enforced client-side in CandidateLayout
// via getMe()/getMyApplication().
const clerk = clerkMiddleware(async () => {});

// Temporary student-portal block. While NEXT_PUBLIC_STUDENT_PORTAL_CLOSED is
// truthy, every /student page is redirected to /portal-closed so students see
// a "temporarily closed" notice instead of the portal. Flip the env var off to
// reopen.
const IS_STUDENT_PORTAL_CLOSED =
  process.env.NEXT_PUBLIC_STUDENT_PORTAL_CLOSED === "true";

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (IS_STUDENT_PORTAL_CLOSED) {
    const { pathname } = request.nextUrl;
    if (pathname === "/student" || pathname.startsWith("/student/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal-closed";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }
  return clerk(request, event);
}