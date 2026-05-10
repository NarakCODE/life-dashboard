"use client";

import * as React from "react";
import type { ApiContext } from "./issue-types";

export function useIssueAuthContext(): ApiContext {
  const [context, setContext] = React.useState<ApiContext>({
    accessToken: null,
    workspaceId: null,
  });

  React.useEffect(() => {
    const accessToken =
      localStorage.getItem("accessToken") ??
      localStorage.getItem("access_token") ??
      localStorage.getItem("token");

    const workspaceId =
      localStorage.getItem("workspaceId") ??
      localStorage.getItem("activeWorkspaceId") ??
      localStorage.getItem("x-workspace-id");

    setContext({
      accessToken,
      workspaceId,
    });
  }, []);

  return context;
}
