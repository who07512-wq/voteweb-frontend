import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const IS_STUDENT_PORTAL_CLOSED =
  process.env.NEXT_PUBLIC_STUDENT_PORTAL_CLOSED === "true";

const isStudentPortalRoute = createRouteMatcher(["/student(.*)"]);
const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/register(.*)",
  "/admin(.*)",
  "/portal-closed",
  "/email-recovery(.*)",
  "/reset-password(.*)",
  "/verify-email(.*)",
  "/auth/clerk-callback",
  "/api(.*)",
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Student portal block
  if (IS_STUDENT_PORTAL_CLOSED && isStudentPortalRoute(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal-closed";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
