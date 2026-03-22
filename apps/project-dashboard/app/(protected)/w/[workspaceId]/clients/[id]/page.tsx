import { ClientDetailsPage } from "@/components/clients/ClientDetailsPage";

interface WorkspaceClientPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkspaceClientPage({
  params,
}: WorkspaceClientPageProps) {
  const { id } = await params;
  return <ClientDetailsPage clientId={id} />;
}
