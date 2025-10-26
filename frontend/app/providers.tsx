"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { useState, useEffect } from "react";
import config from "@/rainbowKitConfig";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import '@rainbow-me/rainbowkit/styles.css';


export function Providers(props: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  // Delay RainbowKit rendering until after client hydration to avoid
  // "setState in render" warnings involving ConnectModal/Hydrate.
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {mounted ? (
          <RainbowKitProvider>
            {props.children}
          </RainbowKitProvider>
        ) : (
          // Render children without RainbowKit until mounted
          props.children
        )}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
