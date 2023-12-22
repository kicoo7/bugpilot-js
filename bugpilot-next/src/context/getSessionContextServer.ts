"use server";
import { headers, cookies } from "next/headers";
import logger from "../logger";

/*
 * Gets the session context for server-side errors
 */
export async function getSessionContextAsync() {
  let context = {};

  try {
    // todo: get on initializiation
    const workspaceIdReportId = cookies().get("com.bugpilot.report.id").value;
    const [workspaceId, reportId] = workspaceIdReportId?.split(":");

    context = {
      origin: headers().get("origin"),
      url: headers().get("referer") || "unknown url",
      anonymousId: cookies().get("com.bugpilot.user.anonymousid").value,
      workspaceId,
      reportId,
    };
  } catch (error) {
    logger.error(
      "Bugpilot.getSessionContext: error while getting context. returning empty context.",
      error
    );
  }

  return context;
}
