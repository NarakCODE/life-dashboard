import { ProjectDetailsPage } from "@/components/projects/ProjectDetailsPage"

interface ProjectBacklogPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectBacklogPage({
  params,
}: ProjectBacklogPageProps) {
  const { id } = await params
  return <ProjectDetailsPage projectId={id} />
}
