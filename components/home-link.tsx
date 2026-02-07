'use client'

import { useRouter } from 'next/navigation'
import { Home } from 'lucide-react'

export function HomeLink() {
  const router = useRouter()

  const handleGoHome = () => {
    router.push('/club/rhinebeck-tennis-club')
  }

  return (
    <div className="mt-12 pt-8 border-t border-[#e8e5df] flex justify-center">
      <button
        onClick={handleGoHome}
        className="flex items-center gap-2 text-[12px] text-[#7a756d] hover:text-[#1a1a1a] transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        Back to Home
      </button>
    </div>
  )
}
