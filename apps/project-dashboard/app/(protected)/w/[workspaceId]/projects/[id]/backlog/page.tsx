import { ProjectDetailsPage } from "@/components/projects/ProjectDetailsPage";

interface WorkspaceProjectBacklogPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkspaceProjectBacklogPage({
  params,
}: WorkspaceProjectBacklogPageProps) {
  const { id } = await params;
  return <ProjectDetailsPage projectId={id} />;
}
