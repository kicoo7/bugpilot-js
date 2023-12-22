import React, { FC, PropsWithChildren } from "react";
import {
  Metadata as MetadataBase,
  ReportData as ReportDataBase,
  User as UserBase,
} from "./imported_types";

interface Metadata extends MetadataBase {}
interface ReportData extends ReportDataBase {}
interface User extends UserBase {}

interface BugpilotProviderProps {
  workspaceId: string;
  user?: Partial<User> | null;
  enabled?: boolean;
}

export const Bugpilot: FC<PropsWithChildren<BugpilotProviderProps>>;

export const useBugpilot: () => {
  saveBugReport: (
    metadata?: Partial<Metadata>,
    reportDataOverride?: Partial<ReportData>
  ) => void;
  identify: (user: User) => void;
  logout: () => void;
};

type BugpilotErrorPageProps = {
  error: Error | { digest: string };
  reset: () => void;
};

export const BugpilotErrorPage: FC<BugpilotErrorPageProps>;

type BugpilotErrorBoundaryProps = {
  children: React.ReactNode;
  onReset: () => {};
  FallbackComponent: React.ReactNode;
};

export const BugpilotErrorBoundary: FC<BugpilotErrorBoundaryProps>;

type useBugpilotErrorBoundaryResult = {
  showBoundary: () => {};
  resetBoundary: () => {};
};

export const useBugpilotErrorBoundary: () => useBugpilotErrorBoundaryResult;

export const wrapServerAction: (
  func: (...params: any) => Promise<any | void>
) => (...params: any) => Promise<any | void>;

export const BugpilotReportBugComponent: FC<any>;

export const wrapServerComponent: (Component: any) => FC<any>;
export const wrapPageComponent: (Component: any) => FC<any>;

export const withBugpilotConfig: (nextConfig: any) => any;
