import { buildWorkspacePath } from "@/lib/workspaces/workspace-routing"

export function isOnboardingPath(pathname: string | null | undefined) {
  return pathname === "/onboarding" || pathname?.startsWith("/onboarding/")
}

export function normalizeNextTarget(nextTarget: string | null | undefined) {
  if (!nextTarget || !nextTarget.startsWith("/")) {
    return "/"
  }

  return nextTarget
}

export function resolvePostOnboardingPath(
  nextTarget: string | null | undefined,
  workspaceId: string | null | undefined,
) {
  const safeNextTarget = normalizeNextTarget(nextTarget)

  if (!workspaceId) {
    return isOnboardingPath(safeNextTarget) ? "/" : safeNextTarget
  }

  if (safeNextTarget === "/" || isOnboardingPath(safeNextTarget)) {
    return buildWorkspacePath(workspaceId, "/")
  }

  const targetUrl = new URL(safeNextTarget, "http://localhost")
  const segments = targetUrl.pathname.split("/").filter(Boolean)

  if (segments[0] === "w" && segments[1]) {
    const childSegments = segments.slice(2)
    const childPath =
      childSegments.length > 0 ? `/${childSegments.join("/")}` : "/"
    return `${buildWorkspacePath(workspaceId, childPath)}${targetUrl.search}`
  }

  return `${buildWorkspacePath(workspaceId, targetUrl.pathname)}${targetUrl.search}`
}
