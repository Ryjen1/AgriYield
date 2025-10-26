import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { FarmDetailsContent } from "@/components/farm-details/farm-details-content"
import { farms } from "@/lib/farm-static"
import { notFound } from "next/navigation"

export function generateStaticParams() {
  return (farms ?? []).map((farm) => ({
    id: farm.id,
  }))
}

export default function FarmDetailsPage({ params }: { params: { id: string } }) {
  const farm = (farms ?? []).find((f) => f.id === params.id)

  if (!farm) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <FarmDetailsContent farm={farm} />
      </main>
      <Footer />
    </div>
  )
}
