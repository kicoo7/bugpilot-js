const BUGPILOT_CHECK_INTERVAL_MS = 1.5 * 1000;
const BUGPILOT_CHECK_MAX_ATTEMPTS = 3;

import logger from "./logger.mjs";

export const waitUntilBugpilotAvailable = (cb, attempts_ = 0) => {
  if (typeof window === "undefined") {
    return;
  }

  if (attempts_ >= BUGPILOT_CHECK_MAX_ATTEMPTS) {
    logger.warn(
      `Bugpilot not available after ${attempts_} attempts. Giving up.`
    );
    return;
  }

  if (!window.Bugpilot) {
    logger.debug(
      `Bugpilot not available yet. Waiting ${BUGPILOT_CHECK_INTERVAL_MS}ms...`
    );

    setTimeout(
      () => waitUntilBugpilotAvailable(cb, attempts_ + 1),
      BUGPILOT_CHECK_INTERVAL_MS
    );

    return;
  }

  cb();
};

export function hasArrayChanged(a = [], b = []) {
  return (
    a.length !== b.length || a.some((item, index) => !Object.is(item, b[index]))
  );
}

// Checks if error is a next not found 404 error
export function isNotFoundError(error) {
  return Boolean(error?.digest === "NEXT_NOT_FOUND");
}

// Checks if error is a next redirect error
export function isRedirectError(error) {
  return Boolean(error?.digest?.startsWith("NEXT_REDIRECT;"));
}

export function isDynamicServerUsageError(error) {
  return Boolean(error?.digest === "DYNAMIC_SERVER_USAGE");
}

// Returns the cookie value for the given name
export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}
