import { captureError } from "../core";
import { getSessionContextAsync } from "../context/getSessionContextServer";
import { isBuildPhase, isNotFoundError, isRedirectError } from "./utils";

export function wrapServerComponent(
  serverComponent: () => {},
  buildContext: any
) {
  return new Proxy(serverComponent, {
    apply: (originalFunction, thisArg, args) => {
      let maybePromiseResult;

      const handleErrorCase = async (error: Error & { digest?: string }) => {
        // skip 404 and redirect NEXT errors. We also skip errors that are thrown during the build phase.
        if (
          !isNotFoundError(error) &&
          !isRedirectError(error) &&
          !isBuildPhase()
        ) {
          const sessionContext = await getSessionContextAsync();
          await captureError(error, { ...buildContext, ...sessionContext });
        }
      };

      try {
        maybePromiseResult = originalFunction.apply(thisArg, args);
      } catch (e) {
        handleErrorCase(e);
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