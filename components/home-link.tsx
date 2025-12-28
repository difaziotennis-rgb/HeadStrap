'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export function HomeLink() {
  const router = useRouter()

  const handleGoHome = () => {
    router.push('/ladder')
  }

  return (
    <div className="mt-12 pt-8 border-t flex justify-center">
      <Button
        variant="ghost"
        onClick={handleGoHome}
        className="text-muted-foreground hover:text-foreground"
      >
        <Home className="w-4 h-4 mr-2" />
        Back to Home
      </Button>
    </div>
  )
}

