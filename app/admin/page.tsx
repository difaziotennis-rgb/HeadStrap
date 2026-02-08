'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    // Set admin session and redirect to /book in admin mode
    sessionStorage.setItem('adminAuth', 'true')
    router.replace('/book')
  }, [router])

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
      <p className="text-[13px] text-[#7a756d]">Loading admin…</p>
    </div>
  )
}
