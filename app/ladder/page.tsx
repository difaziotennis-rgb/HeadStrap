'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LadderPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect directly to Rhinebeck Tennis Club ladder
    router.replace('/club/rhinebeck-tennis-club')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
      <div className="text-center text-muted-foreground">Redirecting...</div>
    </div>
  )
}
