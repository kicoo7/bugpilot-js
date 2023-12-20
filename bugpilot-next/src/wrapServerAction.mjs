import { isNotFoundError, isRedirectError } from "./utils.mjs";
import { captureError } from "./core.mjs";
import { getSessionContext } from "./context/getSessionContext";

export function wrapServerAction(fun, context) {
  return async (...args) => {
    try {
      await fun(...args);
    } catch (error) {
      // i want to check if it's called during build time

      // skip 404 and redirect NEXT errors
      if (!isNotFoundError(error) && !isRedirectError(error)) {
        const sessionContext = await getSessionContext();
        await captureError(error, { ...context, ...sessionContext });
      }

      throw error;
    }
  };
}
