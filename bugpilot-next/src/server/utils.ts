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

export function isDynamicServerUsageError(error: Error & { digest?: string }) {
  return Boolean(error?.digest === "DYNAMIC_SERVER_USAGE");
}
