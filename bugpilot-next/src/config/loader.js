import { wrapServerComponent } from "@bugpilot/next";
import { jsx as _jsx } from "react/jsx-runtime";
import { redirect } from "next/navigation";
// This case is handled because this function will be wrapped.

export default RedirectPage;
function _RedirectPage({ searchParams }) {
  const redirectParam = searchParams?.redirect;
  if (redirectParam) {
    redirect("/settings");
  }
  return /*#__PURE__*/ _jsx("h1", {
    className: "text-xl font-semibold text-black",
    children: "Redirect page",
  });
}
const RedirectPage = wrapServerComponent(_RedirectPage);
