import { useState } from "react";
import { Button } from "./Button";
import { RefreshIcon } from "./RefreshIcon";
import { XIcon } from "./XIcon";
import { sendReport } from "../../core";

type FallbackDialogProps = {
  reset: () => void;
  title?: string;
  description?: string;
  successMessage?: string;
};

export function FallbackDialog({
  reset,
  title = "OOPS! SOMETHING WENT WRONG",
  description = "We have encountered an unexpected error. Please try again.",
  successMessage = "Issue reported. Thank you!",
}: FallbackDialogProps) {
  const [status, setStatus] = useState("default");

  function onCloseClick() {
    setStatus("closed");
  }

  function onResetClick() {
    reset?.();
  }

  function onReportClick() {
    setStatus("report");
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submit");
    // old code: event.target. Changed it because of typescript
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const description = String(formData.get("description"));

    sendReport({ email, description });
    setStatus("submitted");
  }

  return status === "closed" ? null : (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backdropFilter: "blur(4px)",
        display: "flex",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 999999999,
      }}
    >
      <div
        style={{
          margin: "auto",
          marginTop: "8%",
          maxWidth: "640px",
          width: "100%",
          padding: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderRadius: "0.375rem",
            borderTop: "4px solid",
            borderTopColor: "rgb(220 38 38)",
            backgroundColor: "#ffff",
            padding: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "1rem",
            }}
            id="bugpilot-report-issue"
          >
            <p
              style={{
                flexGrow: 1,
                color: "rgb(220 38 38)",
                fontSize: "0.875rem",
                lineHeight: "1.25rem",
              }}
            >
              Error
            </p>
            <Button
              onClick={onCloseClick}
              style={{ marginLeft: "auto" }}
              size="icon"
            >
              <XIcon style={{ height: "1rem", width: "1rem", color: "#111" }} />
            </Button>
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              lineHeight: "2rem",
              fontWeight: 600,
              marginTop: "1rem",
              color: "#111",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: "1.125rem",
              lineHeight: "1.75rem",
              marginTop: "0.5rem",
              color: "rgb(220 38 38)",
            }}
          >
            {description}
          </p>

          {status === "submitted" && (
            <h3
              style={{
                fontSize: "1.125rem",
                lineHeight: "1.75rem",
                fontWeight: "600",
                marginTop: "2rem",
                marginBottom: "0.5rem",
                color: "#111",
              }}
            >
              {successMessage}
            </h3>
          )}

          {status === "default" && (
            <div
              style={{
                marginTop: "1.5rem",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <Button onClick={onResetClick}>
                <RefreshIcon
                  style={{
                    width: "1rem",
                    height: "1rem",
                    marginRight: "0.5rem",
                  }}
                />
                Try again
              </Button>
              <Button onClick={onReportClick}>Report issue</Button>
            </div>
          )}

          {status === "report" && (
            <>
              <h3
                style={{
                  fontSize: "1.125rem",
                  lineHeight: "1.75rem",
                  fontWeight: "600",
                  marginTop: "2rem",
                  marginBottom: "0.5rem",
                  color: "#111",
                }}
              >
                Report issue
              </h3>
              <form
                onSubmit={onSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <textarea
                  name="description"
                  style={{
                    width: "100%",
                    background: "#111",
                    padding: "0.5rem",
                    paddingLeft: "1.25rem",
                    borderRadius: "0.375rem",
                    border: "1px solid",
                  }}
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={4}
                  placeholder="Please describe in your own words what you were doing when the error occurred. The more details you provide, the better we can understand and fix the issue."
                />
                <input
                  name="email"
                  type="email"
                  style={{
                    width: "100%",
                    background: "#111",
                    padding: "0.5rem",
                    paddingLeft: "1.25rem",
                    borderRadius: "0.375rem",
                    border: "1px solid",
                  }}
                  required
                  placeholder="Email"
                />
                <Button type="submit">Submit</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
