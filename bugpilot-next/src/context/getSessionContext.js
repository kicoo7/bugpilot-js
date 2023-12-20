"use server";
import { headers, cookies } from "next/headers";
import logger from "../logger.mjs";

export async function getSessionContext() {
  let context = {};

  try {
    // todo: get on initializiation
    const workspaceIdReportId = cookies().get("com.bugpilot.report.id").value;
    const [workspaceId, reportId] = workspaceIdReportId?.split(":");

    // console.log all headers
    for (const [key, value] of headers().entries()) {
      console.log(`${key}: ${value}`);
    }

    context = {
      origin: headers().get("origin"),
      url: headers().get("referer") || "to do: unknown url",
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
