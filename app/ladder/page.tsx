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
    <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
      <div className="text-[13px] text-[#7a756d]">Redirecting...</div>
    </div>
  )
}
