import { runWithAsyncContext } from "./runWithAsyncContext.mjs";
import { captureError, isRedirectError } from "./utils.mjs";

export function withErrors(fun) {
  return async (...args) =>
    runWithAsyncContext(async (context) => {
      try {
        await fun(...args);
      } catch (error) {
        // skip 404 and redirect NEXT errors
        if (!isNotFoundError(error) && !isRedirectError(error)) {
          captureError({ error, context, kind: "server-action" });
        }

        throw error;
      }
    });
}
