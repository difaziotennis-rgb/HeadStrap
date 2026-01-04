'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Home, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Club Admin Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100 flex items-center justify-center px-4">
      <Card className="p-8 max-w-md w-full border-2 border-primary-100 shadow-xl bg-white text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="font-elegant text-2xl font-semibold text-primary-800 mb-2">
            Something went wrong!
          </h2>
          <p className="text-primary-600 font-light">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-primary-700 hover:bg-primary-800 text-white border-0 shadow-lg"
          >
            Try again
          </Button>
          <Button
            onClick={() => router.push('/club-admin')}
            variant="outline"
            className="border-primary-300 text-primary-700 hover:bg-primary-50"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  )
}

