'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    try {
      sessionStorage.setItem('s27_admin', '1')
    } catch {
      // ignore
    }
    router.replace('/Summer27/admin')
  }, [router])

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
      <p className="text-[13px] text-[#7a756d]">Opening director desk…</p>
    </div>
  )
}
