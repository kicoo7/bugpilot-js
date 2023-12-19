import { runWithServerContext } from "./runWithServerContext.mjs";
import { isNotFoundError, isRedirectError } from "./utils.mjs";
import { captureError } from "./core.mjs";

// no idea why Sentry do sth like this... if page is async, it will be wrapped in a proxy
export function wrapPageComponent(appDirPageComponent) {
  // handles function components
  return new Proxy(appDirPageComponent, {
    apply: (target, thisArg, args) => {
      return runWithServerContext((context) => {
        try {
          console.log("1");
          return target.apply(thisArg, args);
        } catch (e) {
          console.log("error in error");
          console.log("2", error);
          if (!isNotFoundError(error) && !isRedirectError(error)) {
            captureError(error, { context, kind: "server-page" });
          }
          throw e;
        }
      });
    },
  });
}
