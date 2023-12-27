import { Alert, AlertDescription, AlertTitle } from "./Alert";
import { Button } from "./Button";
import { RefreshIcon } from "./RefreshIcon";

type FallbackComponentProps = {
  resetErrorBoundary: (...args: any[]) => void;
  title: string;
  description: string;
};

export function FallbackComponent({
  resetErrorBoundary,
  title,
  description,
}: FallbackComponentProps) {
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
