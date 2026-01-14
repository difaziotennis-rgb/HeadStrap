"use client"

import { Navigation } from "@/components/navigation"
import { AuthGuard } from "@/components/auth-guard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requiredRole="admin">
      <div className="flex h-screen overflow-hidden">
        <Navigation role="admin" />
        <main className="flex-1 overflow-y-auto ml-64">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}

