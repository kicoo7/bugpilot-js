import { Alert, AlertDescription, AlertTitle } from "./Alert.mjs";
import { Button } from "./Button.mjs";
import { RefreshIcon } from "./RefreshIcon.mjs";

export function FallbackComponent({
  error,
  resetErrorBoundary,
  title,
  description,
}) {
  function onResetClick() {
    resetErrorBoundary?.();
  }

  return (
    <Alert>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      <div
        // "flex flex-wrap gap-2"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginTop: "0.5rem",
        }}
      >
        <Button variant="default" onClick={onResetClick} size="sm">
          <RefreshIcon
            // "mr-2 h-4 w-4"
            style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }}
          />
          Try again
        </Button>
      </div>
    </Alert>
  );
}
