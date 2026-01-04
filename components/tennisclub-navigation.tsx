'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Home, Calendar, Users, MessageSquare, BookOpen, Trophy } from 'lucide-react'
import Link from 'next/link'

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()

  const isClubAdmin = pathname?.startsWith('/tennisclub/admin')

  return (
    <nav className="bg-white border-b border-gray-200 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo/Brand */}
          <Link href="/tennisclub/members" className="flex items-center gap-3">
            <div className="p-2 bg-primary-700 rounded-lg">
              <Trophy className="w-6 h-6 text-accent-500" />
            </div>
            <div>
              <span className="font-elegant font-semibold text-xl text-primary-800 tracking-refined">Long Island</span>
              <span className="block font-elegant text-sm text-primary-600 tracking-refined">Tennis Club</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {isClubAdmin ? (
              // Club Admin Navigation
              <>
                <Button
                  variant={pathname === '/tennisclub/admin' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => router.push('/tennisclub/admin')}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant={pathname === '/tennisclub/admin/members' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => router.push('/tennisclub/admin/members')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Members
                </Button>
                <Button
                  variant={pathname === '/tennisclub/admin/calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => router.push('/tennisclub/admin/calendar')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar
                </Button>
                <Button
                  variant={pathname === '/tennisclub/admin/messages' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => router.push('/tennisclub/admin/messages')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Messages
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/tennisclub/members')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Member Portal
                </Button>
              </>
            ) : (
              // Member Portal Navigation
              <>
                <Button
                  variant={pathname === '/tennisclub/members' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => router.push('/tennisclub/members')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Events
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/tennisclub/admin')}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

