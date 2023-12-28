import { captureError } from "../core";
import { getSessionContextAsync } from "../context/getSessionContextServer";
import { isBuildPhase, isNotFoundError, isRedirectError } from "./utils";

export function wrapServerAction(
  fun: (args: [any]) => Promise<void>,
  buildContext: any
) {
  return async (...args: [any]) => {
    try {
      const result = await fun(...args);
      return result;
    } catch (error) {
      // skip 404 and redirect NEXT errors. We also skip errors that are thrown during the build phase.
      if (
        !isNotFoundError(error as Error & { digest?: string }) &&
        !isRedirectError(error as Error & { digest?: string }) &&
        !isBuildPhase()
      ) {
        const sessionContext = await getSessionContextAsync();
        await captureError(error as Error & { digest?: string }, {
          ...buildContext,
          ...sessionContext,
        });
      }

      throw error;
    }
  };
}
