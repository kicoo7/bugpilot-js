import { isNotFoundError, isRedirectError } from "./utils.mjs";
import { captureError } from "./core.mjs";

export function wrapServerAction(fun, context) {
  return async (...args) => {
    try {
      await fun(...args);
    } catch (error) {
      // skip 404 and redirect NEXT errors
      if (!isNotFoundError(error) && !isRedirectError(error)) {
        await captureError(error, context);
      }

      throw error;
    }
  };
}
