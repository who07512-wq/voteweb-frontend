import { clerkMiddleware } from "@clerk/nextjs/server";

// Next.js 16 renamed middleware to proxy. Clerk's clerkMiddleware returns a
// NextMiddleware-compatible handler; we re-export it as the default proxy
// function so it runs before candidate routes are rendered.
export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const isCandidateRoute =
    pathname === "/candidate" || pathname.startsWith("/candidate/");

  if (isCandidateRoute) {
    const session = await auth();
    if (!session.userId) {
      return session.redirectToSignIn();
    }
  }
});

export const config = {
  matcher: [
    // Run on everything except static assets and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
