import { getSessionContext } from "./context/getSessionContext";
import logger from "./logger";

export async function captureError(
  error: Error & { digest?: string },
  context: any = { debug: "false" }
) {
  if (context.debug === "true") {
    logger.setDebug(true);
  }

  if (error instanceof Error === false) {
    logger.debug(
      "Bugpilot.captureError: error must be of type Error. Got: ",
      error
    );
    logger.debug("Bugpilot.captureError: error is not captured.");
    return;
  }

  if (
    error.digest &&
    error?.message?.includes(
      "The specific message is omitted in production builds to avoid leaking sensitive details."
    )
  ) {
    logger.debug("Bugpilot.captureError: error is a Next.js server error");
    return;
  }

  const errorContext = { ...context, ...getSessionContext() };

  try {
    const body = JSON.stringify(
      {
        error: {
          type: "error-click",
          jsErrors: [
            {
              message: error.message,
              stack: error.stack,
              name: error.name,
              digest: error?.digest,
              filePath: errorContext?.filePath,
              functionName: errorContext?.functionName,
            },
          ],
        },
        build: errorContext?.buildId,
        nextRuntime: errorContext?.nextRuntime,
        workspaceId: errorContext?.workspaceId,
        userId: errorContext?.anonymousId,
        reportId: errorContext?.reportId,
        timestamp: Date.now(),
        url: errorContext?.url,
        kind: errorContext?.kind,
      },
      null,
      2
    );

    logger.debug("Bugpilot.captureError: reporting error \n", body);

    const DEV_MODE =
      errorContext?.dev === "true" ||
      errorContext?.url?.includes("localhost") ||
      "0";

    if (DEV_MODE === true) {
      logger.info("Errors are not captured in dev mode.");
      return;
    }

    const response = await fetch(`https://events-error.bugpilot.io/error`, {
      method: "POST",
      headers: {
        Origin: context?.origin,
        "Content-Type": "application/json",
        "X-Dev-Mode": DEV_MODE === true ? "1" : "0",
      },
      body,
    });

    const result = await response.json();

    if (response.ok === true) {
      logger.debug("Bugpilot.captureError: error sent successfully", result);
      return;
    } else {
      logger.debug("Bugpilot.captureError: error failed to send", result);
      // TODO: report an error that Bugpilot failed.
    }
  } catch (error) {
    logger.debug("Bugpilot.captureError: error failed to send", error);
    // TODO: report an error that Bugpilot failed.
  }
}
