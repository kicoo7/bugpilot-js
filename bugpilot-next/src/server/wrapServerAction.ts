import { captureError } from "../core";
import { getSessionContextAsync } from "../context/getSessionContextServer";
import { isBuildPhase, isNotFoundError, isRedirectError } from "./utils";

export function wrapServerAction(
  fun: (args: [any]) => Promise<void>,
  buildContext: any
) {
  return async (...args: [any]) => {
    try {
      await fun(...args);
    } catch (error) {
      // skip 404 and redirect NEXT errors. We also skip errors that are thrown during the build phase.
      if (
        !isNotFoundError(error) &&
        !isRedirectError(error) &&
        !isBuildPhase()
      ) {
        const sessionContext = await getSessionContextAsync();
        await captureError(error, { ...buildContext, ...sessionContext });
      }

      throw error;
    }
  };
}
