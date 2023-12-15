"use server";
import { headers, cookies } from "next/headers";
import logger from "./logger.mjs";

export async function runWithServerContext(fun) {
  let context = {};

  try {
    const workspaceIdReportId = cookies().get("com.bugpilot.report.id").value;
    const [workspaceId, reportId] = workspaceIdReportId?.split(":");

    context = {
      origin: headers().get("origin"),
      url: headers().get("referer"),
      anonymousId: cookies().get("com.bugpilot.user.anonymousid").value,
      workspaceId,
      reportId,
    };
  } catch (error) {
    logger.error(
      "Bugpilot.runWithServerContext: error while getting context",
      error
    );
    logger.warn(
      "Bugpilot.runWithServerContext: running with empty ({}) context"
    );
  }

  return await fun(context);
}
