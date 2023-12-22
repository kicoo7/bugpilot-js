import { captureError } from "../core";
import { getSessionContextAsync } from "../context/getSessionContextServer";
import { isNotFoundError, isRedirectError } from "./utils";

export function wrapServerComponent(serverComponent: () => {}, context: any) {
  return new Proxy(serverComponent, {
    apply: (originalFunction, thisArg, args) => {
      let maybePromiseResult;

      const handleErrorCase = (error: Error) => {
        // skip 404 and redirect NEXT errors
        if (!isNotFoundError(error) && !isRedirectError(error)) {
          Promise.resolve(getSessionContextAsync()).then((sessionContext) => {
            captureError(error, { ...context, ...sessionContext });
          });
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
            handleErrorCase(e);
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
