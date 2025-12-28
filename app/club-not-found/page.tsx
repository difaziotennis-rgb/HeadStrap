'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Home } from 'lucide-react'
import { HomeLink } from '@/components/home-link'

export default function ClubNotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle className="text-2xl">Club Not Found</CardTitle>
            <CardDescription>
              The club you're looking for doesn't exist or the URL is incorrect.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => router.push('/ladder')}
              className="w-full"
              size="lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            <Button
              onClick={() => router.push('/admin')}
              variant="outline"
              className="w-full"
            >
              Create a New Club
            </Button>
          </CardContent>
        </Card>
        
        {/* Home Link */}
        <div className="mt-8">
          <HomeLink />
        </div>
      </div>
    </div>
  )
}

