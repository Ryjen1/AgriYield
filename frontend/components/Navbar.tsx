"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";


export default function Navbar() {

    return (
      <nav className="w-full flex items-center justify-between py-6 px-8 border-b border-border bg-background sticky top-0 z-20">
        <span className="text-xl font-bold tracking-tight">
          Cross-Credit
        </span>
        
        <div className="flex items-center gap-4">
          <ConnectButton />
        </div>
      </nav>
    );
} 