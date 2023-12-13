import { runWithAsyncContext } from "./runWithAsyncContext.mjs";
import { captureError, isNotFoundError, isRedirectError } from "./utils.mjs";

export function wrapServerComponent(appDirComponent) {
  return new Proxy(appDirComponent, {
    apply: (originalFunction, thisArg, args) => {
      return runWithAsyncContext((context) => {
        let maybePromiseResult;

        const handleErrorCase = (e) => {
          // skip 404 and redirect NEXT errors
          if (!isNotFoundError(e) && !isRedirectError(e)) {
            captureError({ error: e, context, kind: "server-component" });
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
      });
    },
  });
}
