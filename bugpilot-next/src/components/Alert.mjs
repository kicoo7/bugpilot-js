export function AlertTitle({ children }) {
  return (
    <h3
      //"text-base font-semibold"
      style={{
        fontSize: "1rem",
        fontWeight: "600",
      }}
    >
      {children}
    </h3>
  );
}

export function AlertDescription({ children }) {
  return (
    <p
      //"text-sm tracking-tight"
      style={{
        fontSize: "0.875rem",
        letterSpacing: "-0.025em",
      }}
    >
      {children}
    </p>
  );
}

export function Alert({ title, description, children }) {
  return (
    <div
      // "flex w-full flex-col gap-4 rounded-md border border-red-900 p-4"
      style={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        gap: "1rem",
        borderRadius: "0.375rem",
        border: "1px solid",
        borderColor: "#7f1d1d",
        padding: "1rem",
      }}
    >
      <div
        // "flex flex-col gap-1 text-red-900"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          color: "#7f1d1d",
        }}
      >
        {children}
      </div>
    </div>
  );
}
