import { captureError } from "../core";
import { isBuildPhase, isNotFoundError, isRedirectError } from "./utils";
import { BugpilotBuildContext } from "../types";
import { getSessionContext } from "../context/getSessionContext";

export function wrapServerComponent(
  serverComponent: () => {},
  buildContext: BugpilotBuildContext
) {
  return new Proxy(serverComponent, {
    apply: (originalFunction: () => {}, thisArg: any, args: any) => {
      let maybePromiseResult;

      const handleErrorCase = async (error: Error & { digest?: string }) => {
        // skip 404 and redirect NEXT errors. We also skip errors that are thrown during the build phase.
        if (
          !isNotFoundError(error) &&
          !isRedirectError(error) &&
          !isBuildPhase()
        ) {
          const sessionContext = getSessionContext();
          await captureError(error, { ...buildContext, ...sessionContext });
        }
      };

      try {
        maybePromiseResult = originalFunction.apply(thisArg, args);
      } catch (e) {
        handleErrorCase(e as Error & { digest?: string });
        throw e;
      }

      if (
        typeof maybePromiseResult === "object" &&
        maybePromiseResult !== null &&
        "then" in maybePromiseResult
      ) {
        Promise.resolve(maybePromiseResult).then(
          () => {},
          (e) => {
            handleErrorCase(e as Error & { digest?: string });
          }
        );
        // It is very important that we return the original promise here, because Next.js attaches various properties
        // to that promise and will throw if they are not on the returned value.
        return maybePromiseResult;
      } else {
        return maybePromiseResult;
      }
    },
  });
}
