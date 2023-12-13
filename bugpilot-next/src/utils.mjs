const BUGPILOT_CHECK_INTERVAL_MS = 1.5 * 1000;
const BUGPILOT_CHECK_MAX_ATTEMPTS = 3;

import logger from "./logger.mjs";

export const waitUntilBugpilotAvailable = (cb, attempts_ = 0) => {
  if (typeof window === "undefined") {
    return;
  }

  if (attempts_ >= BUGPILOT_CHECK_MAX_ATTEMPTS) {
    logger.warn(
      `Bugpilot not available after ${attempts_} attempts. Giving up.`
    );
    return;
  }

  if (!window.Bugpilot) {
    logger.debug(
      `Bugpilot not available yet. Waiting ${BUGPILOT_CHECK_INTERVAL_MS}ms...`
    );

    setTimeout(
      () => waitUntilBugpilotAvailable(cb, attempts_ + 1),
      BUGPILOT_CHECK_INTERVAL_MS
    );

    return;
  }

  cb();
};

export const sendReport = ({ email, description }) => {
  const msg = {
    type: "io.bugpilot.events.send-report",
    data: { email, description },
  };

  // @TODO: also send widgetStartTime, widgetFinishTime,
  // and add them to metadata (see Bugpilot.ts)

  window.postMessage(msg, "*");
};

export function hasArrayChanged(a = [], b = []) {
  return (
    a.length !== b.length || a.some((item, index) => !Object.is(item, b[index]))
  );
}

export async function captureError({ error, context, kind }) {
  if (error instanceof Error === false) {
    throw new Error("Bugpilot.captureError: error must be of type Error");
  }

  // TODO: check if all params in context are available
  if (typeof context !== "object") {
    throw new Error("Bugpilot.captureError: context must be of type object");
  }

  const ALLOWED_KINDS = ["error-page", "server-action", "custom"];

  if (!ALLOWED_KINDS.find((val) => val === kind)) {
    throw new Error(
      "Bugpilot.captureError: kind must be one of " + ALLOWED_KINDS.join(", ")
    );
  }

  const DEV_MODE = context?.url.includes("localhost");

  const result = await fetch(`https://events-error.bugpilot.io/error`, {
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
          },
        ],
      },
      reportId: context?.reportId,
      workspaceId: context?.workspaceId,
      userId: context?.anonymousId,
      timestamp: Date.now(),
      url: context?.url,
      kind: "error-page",
    }),
  });

  if (result.ok === true) {
    console.debug("Bugpilot.captureError: error sent successfully");
  } else {
    console.error("Bugpilot.captureError: error failed to send");
  }
}

export function isNotFoundError(error) {
  return Boolean(error?.digest?.startsWith("NEXT_NOT_FOUND"));
}

export function isRedirectError(error) {
  return Boolean(error?.digest?.startsWith("NEXT_REDIRECT;"));
}

export function getClientContext() {
  const context = {
    origin: window?.location?.origin,
    url: window?.location?.href,
    // TODO: generate reportId?
    reportId: "reportId-k" + Date.now(), //window?.localStorage?.getItem("Bugpilot::reportId"),
    anonymousId: window?.localStorage?.getItem("Bugpilot::anonymousId"),
    // TODO: get workspaceId
    workspaceId: "71e2aba3-108e-43dd-8459-6b462dc01253",
  };
  return context;
}
