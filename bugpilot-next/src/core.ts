import logger from "./logger";

export async function captureError(
  error: Error & { digest?: string },
  context: any = {}
) {
  if (error instanceof Error === false) {
    logger.error(
      "Bugpilot.captureError: error must be of type Error. Got: ",
      error
    );
    logger.warn("Bugpilot.captureError: error is not captured");
    return;
  }

  if (
    error.digest &&
    error?.message?.includes(
      "The specific message is omitted in production builds to avoid leaking sensitive details."
    )
  ) {
    logger.warn("Bugpilot.captureError: error is a Next.js server error");
    return;
  }

  try {
    const DEV_MODE = context?.url?.includes("localhost") || "0";

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
      // build: context?.buildId,
      // nextRuntime: context?.nextRuntime,
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

    console.log("context", context, response);

    if (response.ok === true) {
      logger.debug("Bugpilot.captureError: error sent successfully");
      return;
    } else {
      const result = await response.json();
      logger.error("Bugpilot.captureError: error failed to send", result);
    }
  } catch (error) {
    logger.error("Bugpilot.captureError: error failed to send", error);
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
