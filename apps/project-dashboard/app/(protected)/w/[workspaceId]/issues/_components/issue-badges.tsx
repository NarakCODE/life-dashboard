import { Badge } from "@/components/ui/badge";
import type {
  IssuePriority,
  IssueStatus,
  IssueType,
} from "@/lib/issues/issue-types";

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  return <Badge variant="outline">{status}</Badge>;
}

export function IssuePriorityBadge({ priority }: { priority: IssuePriority }) {
  return <Badge variant="secondary">{priority}</Badge>;
}

export function IssueTypeBadge({ type }: { type: IssueType }) {
  return <Badge>{type}</Badge>;
}
