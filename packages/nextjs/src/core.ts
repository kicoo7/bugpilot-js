import logger from "./logger";

export async function captureError(
  error: Error & { digest?: string },
  context: any = {}
) {
  const DEV_MODE =
    context?.dev === "true" || context?.url?.includes("localhost") || "0";

  if (DEV_MODE === true) {
    logger.info("Bugpilot.captureError: errors in dev mode are not captured.");
    return;
  }

  if (error instanceof Error === false) {
    logger.warn(
      "Bugpilot.captureError: error must be of type Error. Got: ",
      error
    );
    logger.warn("Bugpilot.captureError: error is not captured.");
    return;
  }

  if (
    error.digest &&
    error?.message?.includes(
      "The specific message is omitted in production builds to avoid leaking sensitive details."
    )
  ) {
    // logger.warn("Bugpilot.captureError: error is a Next.js server error");
    return;
  }

  try {
    const body = JSON.stringify({
      error: {
        type: "error-click",
        jsErrors: [
          {
            message: error.message,
            stack: error.stack,
            name: error.name,
            digest: error?.digest,
            filePath: context?.filePath,
            functionName: context?.functionName,
          },
        ],
      },
      build: context?.buildId,
      nextRuntime: context?.nextRuntime,
      workspaceId: context?.workspaceId,
      userId: context?.anonymousId,
      reportId: context?.reportId,
      timestamp: Date.now(),
      url: context?.url,
      kind: context?.kind,
    });

    const response = await fetch(`https://events-error.bugpilot.io/error`, {
      method: "POST",
      headers: {
        Origin: context?.origin,
        "Content-Type": "application/json",
        "X-Dev-Mode": DEV_MODE === true ? "1" : "0",
      },
      body,
    });

    if (response.ok === true) {
      logger.debug("Bugpilot.captureError: error sent successfully");
      return;
    } else {
      const result = await response.json();
      logger.error("Bugpilot.captureError: error failed to send", result);
      // TODO: report an error that Bugpilot failed.
    }
  } catch (error) {
    logger.error("Bugpilot.captureError: error failed to send", error);
    // TODO: report an error that Bugpilot failed.
  }
}

export const sendReport = ({
  email,
  description,
}: {
  email: string;
  description: string;
}) => {
  const msg = {
    type: "io.bugpilot.events.send-report",
    data: { email, description },
  };

  // @TODO: also send widgetStartTime, widgetFinishTime,
  // and add them to metadata (see Bugpilot.ts)

  window.postMessage(msg, "*");
};
