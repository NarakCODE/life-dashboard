import { ProjectDetailsPage } from "@/components/projects/ProjectDetailsPage";

interface WorkspaceProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkspaceProjectPage({
  params,
}: WorkspaceProjectPageProps) {
  const { id } = await params;
  return <ProjectDetailsPage projectId={id} />;
}
