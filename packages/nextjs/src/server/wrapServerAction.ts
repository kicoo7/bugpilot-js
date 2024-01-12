import { captureError } from "../core";
import { isBuildPhase, isNotFoundError, isRedirectError } from "./utils";
import { BugpilotBuildContext } from "../types";

export function wrapServerAction(
  fun: (args: [any]) => Promise<void>,
  buildContext: BugpilotBuildContext
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
        await captureError(error as Error & { digest?: string }, {
          ...buildContext,
        });
      }

      throw error;
    }
  };
}
