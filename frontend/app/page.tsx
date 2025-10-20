"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/landing/hero-section"
import { HowItWorks } from "@/components/landing/how-it-works"
import { WhyAgriYield } from "@/components/landing/why-agriyield"
import { JoinRevolution } from "@/components/landing/join-revolution"
import { StatsSection } from "@/components/landing/stats-section"
import { TransactionDemo } from "@/components/demo/transaction-demo"
import { useAuth } from "@/lib/auth-context"


export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user?.isVerified && user?.walletConnected) {
      const dashboard = user.role === "farmer" ? "/farmer" : "/investor"
      router.push(dashboard)
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen">
      
      <Navigation />
      <main>
        <HeroSection />
        <StatsSection />
        <HowItWorks />
        <WhyAgriYield />
        <JoinRevolution />
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-md">
            <TransactionDemo />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
