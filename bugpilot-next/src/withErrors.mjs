export function withErrors(fun) {
  return async function (...args) {
    try {
      return await fun(...args);
    } catch (error) {
      if (typeof window !== "undefined") {
        console.log("captureClientError called: ", error);
      } else {
        console.log("captureServerError:", error);

        // cookies will be used to identify the report-id
        const { cookies } = require("next/headers");
        const cookie = cookies().get("bugpilot_anonymous_id");
        console.log("cookie", cookie);
      }

      throw error;
    }
  };
}
