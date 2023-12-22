import { captureError } from "../core";
import { getSessionContextAsync } from "../context/getSessionContextServer";
import { isNotFoundError, isRedirectError } from "./utils";

export function wrapServerAction(
  fun: (args: [any]) => Promise<void>,
  context: any
) {
  return async (...args: [any]) => {
    try {
      await fun(...args);
    } catch (error) {
      // skip 404 and redirect NEXT errors
      if (!isNotFoundError(error) && !isRedirectError(error)) {
        const sessionContext = await getSessionContextAsync();
        await captureError(error, { ...context, ...sessionContext });
      }

      throw error;
    }
  };
}
