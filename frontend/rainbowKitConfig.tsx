"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import type { Config as WagmiConfig } from "wagmi"
import { liskSepolia } from "viem/chains"

const config = getDefaultConfig({
  appName: "Cross-Credit Lending",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [liskSepolia],
  ssr: false,
}) as WagmiConfig

export default config