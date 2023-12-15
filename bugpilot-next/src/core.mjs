import logger from "./logger.mjs";
import { getCookie } from "./utils.mjs";

export async function captureError(error, options = {}) {
  if (error instanceof Error === false) {
    logger.error(
      "Bugpilot.captureError: error must be of type Error. Got: ",
      error
    );
    logger.warn("Bugpilot.captureError: error is not captured");
    return;
  }

  // const ALLOWED_KINDS = [
  //   "error-page",
  //   "error-boundary",
  //   "server-action",
  //   "custom",
  // ];

  // check if clientSide
  if (
    error?.message?.includes(
      "The specific message is omitted in production builds to avoid leaking sensitive details."
    )
  ) {
    logger.warn("Bugpilot.captureError: error is a Next.js server error");
    logger.warn("Bugpilot.captureError: error is not captured");
    return;
  }

  try {
    const { context, kind } = options;
    const DEV_MODE = context?.url?.includes("localhost") || "0";

    console.log("options", JSON.stringify(options, null, 2));

    const response = await fetch(`https://events-error.bugpilot.io/error`, {
      method: "POST",
      headers: {
        Origin: context?.origin,
        "Content-Type": "application/json",
        "X-Dev-Mode": DEV_MODE === true ? "1" : "0",
      },
      body: JSON.stringify({
        error: {
          type: "error-click",
          jsErrors: [
            {
              message: error.message,
              stack: error.stack,
              name: error.name,
              digest: error.digest,
            },
          ],
        },
        reportId: context?.reportId,
        workspaceId: context?.workspaceId,
        userId: context?.anonymousId,
        timestamp: Date.now(),
        url: context?.url,
        kind,
      }),
    });

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

// Returns the client context for client-side errors
export function getClientContext() {
  let context = {};
  try {
    const workspaceIdReportId = getCookie("com.bugpilot.report.id");
    const [workspaceId, reportId] = workspaceIdReportId?.split(":");

    context = {
      origin: window.location.origin,
      url: window.location.href,
      reportId: reportId,
      anonymousId: getCookie("com.bugpilot.user.anonymousid"),
      workspaceId: workspaceId,
    };
  } catch (error) {
    logger.error(
      "Bugpilot.getClientContext: error while getting context",
      error
    );
    logger.error("Bugpilot.getClientContext: returning empty context");
  }

  return context;
}

export const sendReport = ({ email, description }) => {
  const msg = {
    type: "io.bugpilot.events.send-report",
    data: { email, description },
  };

  // @TODO: also send widgetStartTime, widgetFinishTime,
  // and add them to metadata (see Bugpilot.ts)

  window.postMessage(msg, "*");
};
