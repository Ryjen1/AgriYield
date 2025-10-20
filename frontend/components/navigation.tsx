"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Leaf, Menu, X, Wallet, LogOut, User, Coins } from "lucide-react"
import { useState } from "react"
import { WalletConnectModal } from "@/components/wallet/wallet-connect-modal"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const { user, signOut } = useAuth()

  const agtBalance = user?.walletConnected ? 120.5 : 0

  const handleConnectWallet = () => {
    setWalletModalOpen(true)
  }

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark transition-transform group-hover:scale-105">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">
                AgriYield
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-8">
              {user && (
                <Link
                  href="/farm-listings"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground relative group"
                >
                  Farm Listing
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                </Link>
              )}
              <Link
                href="/marketplace"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground relative group"
              >
                Marketplace
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
              {user?.role === "farmer" && (
                <Link
                  href="/dashboard/farmer"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground relative group"
                >
                  Dashboard
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                </Link>
              )}
              {user?.role === "investor" && (
                <Link
                  href="/dashboard/investor"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground relative group"
                >
                  Dashboard
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                </Link>
              )}
              {!user && (
                <>
                  <Link
                    href="/dashboard/farmer"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground relative group"
                  >
                    For Farmers
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                  </Link>
                  <Link
                    href="/dashboard/investor"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground relative group"
                  >
                    For Investors
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                  </Link>
                </>
              )}
              <Link
                href="/about"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground relative group"
              >
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
            </div>

            <div className="hidden md:flex md:items-center md:gap-3">
              {/* <ThemeToggle /> */}

              {!user ? (
                // Not signed in - show Sign In and Sign Up
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/signin">Sign In</Link>
                  </Button>
                  <Button
                    size="sm"
                    className="gradient-primary text-white"
                    asChild
                  >
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                  <ConnectButton />
                </>
              ) : !user.walletConnected ? (
                // Signed in but wallet not connected - show Connect Wallet
                <ConnectButton />
              ) : (
                // Wallet connected - show AGT balance and user menu
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      {agtBalance.toFixed(2)} AGT
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 h-auto py-2"
                      >
                        <Badge
                          variant={
                            user.role === "farmer" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {user.role === "farmer" ? "Farmer" : "Investor"}
                        </Badge>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {getUserInitials(user.email)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.walletAddress?.substring(0, 6)}...
                            {user.walletAddress?.substring(38)}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          href={
                            user.role === "farmer"
                              ? "/dashboard/farmer"
                              : "/dashboard/investor"
                          }
                        >
                          <User className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={signOut}
                        className="text-red-600 dark:text-red-400"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 space-y-4"
            >
              {user && (
                <Link
                  href="/farm-listings"
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Farm Listing
                </Link>
              )}
              <Link
                href="/marketplace"
                className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Marketplace
              </Link>
              {user?.role === "farmer" && (
                <Link
                  href="/dashboard/farmer"
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              {user?.role === "investor" && (
                <Link
                  href="/dashboard/investor"
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              {!user && (
                <>
                  <Link
                    href="/dashboard/farmer"
                    className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    For Farmers
                  </Link>
                  <Link
                    href="/dashboard/investor"
                    className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    For Investors
                  </Link>
                </>
              )}
              <Link
                href="/about"
                className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>

              <div className="flex flex-col gap-2 pt-4">
                {!user ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      asChild
                    >
                      <Link href="/signin">Sign In</Link>
                    </Button>
                    <Button
                      size="sm"
                      className="w-full gradient-primary text-white"
                      asChild
                    >
                      <Link href="/signup">Sign Up</Link>
                    </Button>
                  </>
                ) : !user.walletConnected ? (
                  <ConnectButton />
                ) : (
                  <>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getUserInitials(user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.email}
                        </p>
                        <Badge
                          variant={
                            user.role === "farmer" ? "default" : "secondary"
                          }
                          className="text-xs mt-1"
                        >
                          {user.role === "farmer" ? "Farmer" : "Investor"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        {agtBalance.toFixed(2)} AGT
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 dark:text-red-400 bg-transparent"
                      onClick={signOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>

      <WalletConnectModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </>
  );
}
