import { ClientDetailsPage } from "@/components/clients/ClientDetailsPage"

interface ClientPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params
  return <ClientDetailsPage clientId={id} />
}
