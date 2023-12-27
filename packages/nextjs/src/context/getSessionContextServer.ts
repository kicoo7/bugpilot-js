"use server";
import { headers, cookies } from "next/headers";
import logger from "../logger";

/*
 * Gets the session context for server-side errors
 */
export async function getSessionContextAsync() {
  let context = {};

  try {
    const workspaceIdReportId = cookies()
      .get("com.bugpilot.report.id")
      ?.value.split(":");

    context = {
      origin: headers().get("origin"),
      url: headers().get("referer") || "unknown url",
      anonymousId: cookies().get("com.bugpilot.user.anonymousid")?.value,
      reportId: workspaceIdReportId && workspaceIdReportId[1],
    };
  } catch (error) {
    logger.error(
      "Bugpilot.getSessionContextAsync: error while getting session context. Returning empty object.",
      error
    );
  }

  return context;
}
