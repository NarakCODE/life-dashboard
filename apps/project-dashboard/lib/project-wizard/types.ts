import { ProjectData, ProjectDeliverable, ProjectMetric } from "@/components/project-wizard/types"

// API input type for creating a project with full wizard data
export interface CreateProjectWizardInput {
  name: string
  status?: "backlog" | "planned" | "active" | "cancelled" | "completed"
  priority?: "urgent" | "high" | "medium" | "low"
  
  // Wizard-specific fields
  mode?: "quick" | "guided"
  intent?: "delivery" | "experiment" | "internal"
  successType?: "deliverable" | "metric" | "undefined"
  deliverables?: ProjectDeliverable[]
  metrics?: ProjectMetric[]
  description?: string
  deadlineType?: "none" | "target" | "fixed"
  deadlineDate?: string
  ownerId?: string
  contributorIds?: string[]
  stakeholderIds?: string[]
  structure?: "linear" | "milestones" | "multistream"
  addStarterTasks?: boolean
  clientId?: string
}

// Response from creating a project via wizard
export interface CreateProjectWizardResponse {
  id: string
  workspaceId: string
  name: string
  status: string
  createdAt: string
  updatedAt: string
}

// Mock data examples for StepOutcome testing/development
export const stepOutcomeMockData = {
  // Full example with deliverables
  deliverableBased: {
    mode: "guided" as const,
    intent: "delivery" as const,
    successType: "deliverable" as const,
    deliverables: [
      {
        id: "dlv-1742812345678-abc123",
        title: "Complete UI mockups",
        dueDate: "2025-04-15",
      },
      {
        id: "dlv-1742812349999-def456",
        title: "API integration",
        dueDate: "2025-04-30",
      },
      {
        id: "dlv-1742812355555-ghi789",
        title: "Final documentation",
        dueDate: undefined,
      },
    ],
    metrics: [],
    description:
      "<p>Build a comprehensive <strong>project dashboard</strong> with real-time analytics and team collaboration features.</p><ul><li>Drag-and-drop task management</li><li>Timeline visualization</li><li>AI-powered insights</li></ul>",
    deadlineType: "target" as const,
    deadlineDate: "2025-06-30",
    contributorIds: [],
    stakeholderIds: [],
    addStarterTasks: true,
  } satisfies Partial<ProjectData>,

  // Metric-based success example
  metricBased: {
    mode: "guided" as const,
    intent: "experiment" as const,
    successType: "metric" as const,
    deliverables: [],
    metrics: [
      {
        id: "mt-1742812345678-xyz",
        name: "User Engagement",
        target: "75%",
      },
      {
        id: "mt-1742812349999-uvw",
        name: "Page Load Time",
        target: "< 2s",
      },
    ],
    description: "<p>Improve platform performance metrics through optimization initiatives.</p>",
    deadlineType: "fixed" as const,
    deadlineDate: "2025-05-01",
    contributorIds: [],
    stakeholderIds: [],
    addStarterTasks: false,
  } satisfies Partial<ProjectData>,

  // Undefined success type (minimal data)
  undefinedSuccess: {
    mode: "guided" as const,
    intent: "internal" as const,
    successType: "undefined" as const,
    deliverables: [],
    metrics: [],
    description: "",
    deadlineType: "none" as const,
    deadlineDate: undefined,
    contributorIds: [],
    stakeholderIds: [],
    addStarterTasks: false,
  } satisfies Partial<ProjectData>,

  // Empty initial state
  empty: {
    mode: undefined,
    successType: "undefined" as const,
    deliverables: [],
    metrics: [],
    description: "",
    deadlineType: "none" as const,
    contributorIds: [],
    stakeholderIds: [],
    addStarterTasks: false,
  } satisfies Partial<ProjectData>,
}

// Helper to convert ProjectData to API input
export function toCreateProjectInput(
  data: ProjectData,
  projectName: string
): CreateProjectWizardInput {
  return {
    name: projectName,
    status: "planned",
    priority: "medium",
    mode: data.mode,
    intent: data.intent,
    successType: data.successType,
    deliverables: data.deliverables,
    metrics: data.metrics,
    description: data.description,
    deadlineType: data.deadlineType,
    deadlineDate: data.deadlineDate,
    ownerId: data.ownerId,
    contributorIds: data.contributorIds,
    stakeholderIds: data.stakeholderIds,
    structure: data.structure,
    addStarterTasks: data.addStarterTasks,
    clientId: data.clientId,
  }
}
