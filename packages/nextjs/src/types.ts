export type BugpilotSessionContext = {
  origin: string;
  url: string;
  reportId: string;
  anonymousId: string;
  workspaceId?: string;
};

export type BugpilotBuildContext = {
  workspaceId: string;
  kind:
    | "error-boundary"
    | "error-page"
    | "page-component"
    | "server-component"
    | "server-action"
    | "middleware";
  buildId: string;
  dev: string;
  nextRuntime: string;
  filePath: string;
  functionName: string;
  debug: string;
};

export type BugpilotErrorContext = any;
