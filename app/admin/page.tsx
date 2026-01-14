'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminPanel } from '@/components/admin-panel'

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/site-admin/check')
      const data = await response.json()
      if (data.authenticated) {
        setIsAuthenticated(true)
      } else {
        router.push('/club/rhinebeck-tennis-club')
      }
    } catch (error) {
      router.push('/club/rhinebeck-tennis-club')
    } finally {
      setCheckingAuth(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <AdminPanel />
        </div>
      </div>
    </div>
  )
}
