import { runWithServerContext } from "./runWithServerContext.mjs";
import { isNotFoundError, isRedirectError } from "./utils.mjs";
import { captureError } from "./core.mjs";

export function wrapServerAction(fun) {
  return async (...args) =>
    runWithServerContext(async (context) => {
      try {
        await fun(...args);
      } catch (error) {
        // skip 404 and redirect NEXT errors
        if (!isNotFoundError(error) && !isRedirectError(error)) {
          captureError(error, { context, kind: "server-action" });
        }

        throw error;
      }
    });
}