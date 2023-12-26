import { PHASE_PRODUCTION_BUILD } from "next/constants";

/**
 * Returns true if error is a next 404 not found error
 */
export function isNotFoundError(error: Error & { digest?: string }) {
  return Boolean(error?.digest === "NEXT_NOT_FOUND");
}

/**
 * Returns true if error is a next redirect error
 */
export function isRedirectError(error: Error & { digest?: string }) {
  return Boolean(error?.digest?.startsWith("NEXT_REDIRECT;"));
}

/**
 * Returns true if we are in the build phase. We use this to skip error reporting during the build phase since we require session data from headers, cookies.
 */
export function isBuildPhase() {
  return Boolean(process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD);
}
