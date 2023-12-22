import logger from "../logger";

/**
 * Helper function that gets the cookie value by name
 */
export function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

/**
 * Gets the session context for client-side errors
 */
export function getSessionContext() {
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
