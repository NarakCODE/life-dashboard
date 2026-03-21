import { ProjectDetailsPage } from "@/components/projects/ProjectDetailsPage"

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  return <ProjectDetailsPage projectId={id} />
}
