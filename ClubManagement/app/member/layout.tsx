"use client"

import { Navigation } from "@/components/navigation"
import { AuthGuard } from "@/components/auth-guard"

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requiredRole="member">
      <div className="flex h-screen overflow-hidden">
        <Navigation role="member" />
        <main className="flex-1 overflow-y-auto ml-64">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}

