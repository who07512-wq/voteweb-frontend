import { clerkMiddleware } from "@clerk/nextjs/server";

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
export default clerkMiddleware(async () => {});