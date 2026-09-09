import { NextResponse, type NextRequest } from "next/server";

const IS_STUDENT_PORTAL_CLOSED =
  process.env.NEXT_PUBLIC_STUDENT_PORTAL_CLOSED === "true";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Student portal block
  if (IS_STUDENT_PORTAL_CLOSED && pathname.startsWith("/student")) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal-closed";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Public routes — no auth check needed
  const PUBLIC_PREFIXES = [
    "/",
    "/login",
    "/register",
    "/admin",
    "/portal-closed",
    "/email-recovery",
    "/reset-password",
    "/verify-email",
    "/api",
    "/_next",
    "/favicon",
  ];

  const isPublic = PUBLIC_PREFIXES.some((prefix) => {
    if (prefix === "/") return pathname === "/";
    return pathname.startsWith(prefix);
  });

  if (isPublic) {
    return NextResponse.next();
  }

  // For protected routes, check for the campusvote_auth cookie.
  // This is a soft check — the backend enforces real auth via cv_sid.
  // If no auth cookie exists, redirect to login.
  const authCookie = request.cookies.get("campusvote_auth");
  if (!authCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login/any";
    url.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
