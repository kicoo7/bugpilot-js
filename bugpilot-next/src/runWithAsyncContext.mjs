"use server";
import { headers, cookies } from "next/headers";

export async function runWithAsyncContext(fun) {
  const headersList = headers();
  const referer = headersList.get("referer");
  const url = headersList.get("origin");
  const anonymousId = cookies().get("com.bugpilot.user.anonymousId");
  const reportId = cookies().get("com.bugpilot.report.id");
  const workspaceId = reportId?.split(":")[1];

  const context = {
    url,
    referer,
    anonymousId,
    workspaceId,
    reportId,
  };
  return await fun(context);
}
