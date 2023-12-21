import { getCookie } from "../utils.mjs";

// Returns the client context for client-side error
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
