'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Calendar, Mail, MessageSquare, Settings, Plus, Activity } from 'lucide-react'
import Link from 'next/link'
import { getMembers, getEvents, getActivities, initializeData, type Activity as ActivityType } from '@/lib/club-data'

export default function ClubAdminDashboard() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    upcomingClinics: 0,
    upcomingLessons: 0,
    unreadMessages: 0
  })
  const [activities, setActivities] = useState<ActivityType[]>([])

  useEffect(() => {
    initializeData()
    loadStats()
    loadActivities()
    
    // Refresh stats every 5 seconds
    const interval = setInterval(() => {
      loadStats()
      loadActivities()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const loadStats = () => {
    const members = getMembers()
    const events = getEvents()
    const today = new Date().toISOString().split('T')[0]
    
    const upcomingEvents = events.filter(e => e.date >= today)
    const clinics = upcomingEvents.filter(e => e.type === 'clinic')
    const lessons = upcomingEvents.filter(e => e.type === 'lesson')
    
    setStats({
      totalMembers: members.filter(m => m.status === 'active').length,
      upcomingClinics: clinics.length,
      upcomingLessons: lessons.length,
      unreadMessages: 0 // Can be enhanced later
    })
  }

  const loadActivities = () => {
    const recentActivities = getActivities(5)
    setActivities(recentActivities)
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Page Header */}
        <div className="mb-10 pb-6 border-b-2 border-primary-200">
          <h1 className="font-elegant text-4xl font-semibold text-primary-800 mb-2 tracking-refined">Club Management Dashboard</h1>
          <p className="text-primary-600 font-light">Long Island Tennis Club • 5 Courts</p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
          <Card className="p-8 bg-white border-2 border-primary-100 hover:border-primary-300 transition-all shadow-lg hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-primary-600 mb-2 font-medium">Total Members</p>
                <p className="text-4xl font-elegant font-semibold text-primary-800">{stats.totalMembers}</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-lg">
                <Users className="w-8 h-8 text-primary-700" />
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-white border-2 border-primary-100 hover:border-primary-300 transition-all shadow-lg hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-primary-600 mb-2 font-medium">Upcoming Clinics</p>
                <p className="text-4xl font-elegant font-semibold text-primary-800">{stats.upcomingClinics}</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-lg">
                <Calendar className="w-8 h-8 text-primary-700" />
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-white border-2 border-primary-100 hover:border-primary-300 transition-all shadow-lg hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-primary-600 mb-2 font-medium">Upcoming Lessons</p>
                <p className="text-4xl font-elegant font-semibold text-primary-800">{stats.upcomingLessons}</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-lg">
                <Activity className="w-8 h-8 text-primary-700" />
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-white border-2 border-primary-100 hover:border-primary-300 transition-all shadow-lg hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-primary-600 mb-2 font-medium">Unread Messages</p>
                <p className="text-4xl font-elegant font-semibold text-primary-800">{stats.unreadMessages}</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-lg">
                <Mail className="w-8 h-8 text-primary-700" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="font-elegant text-2xl font-semibold text-primary-800 mb-6 tracking-refined">Quick Actions</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/club-admin/members">
              <Card className="p-6 bg-white border-2 border-primary-100 hover:border-primary-400 hover:shadow-xl transition-all cursor-pointer group">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl group-hover:from-primary-100 group-hover:to-primary-200 transition-all">
                    <Users className="w-7 h-7 text-primary-700" />
                  </div>
                  <div>
                    <h3 className="font-elegant font-semibold text-lg text-primary-800 mb-1">Manage Members</h3>
                    <p className="text-sm text-primary-600 font-light">View and edit member list</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/club-admin/calendar">
              <Card className="p-6 bg-white border-2 border-primary-100 hover:border-primary-400 hover:shadow-xl transition-all cursor-pointer group">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl group-hover:from-primary-100 group-hover:to-primary-200 transition-all">
                    <Calendar className="w-7 h-7 text-primary-700" />
                  </div>
                  <div>
                    <h3 className="font-elegant font-semibold text-lg text-primary-800 mb-1">View Calendar</h3>
                    <p className="text-sm text-primary-600 font-light">Lessons and clinics schedule</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/club-admin/messages">
              <Card className="p-6 bg-white border-2 border-primary-100 hover:border-primary-400 hover:shadow-xl transition-all cursor-pointer group">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl group-hover:from-primary-100 group-hover:to-primary-200 transition-all">
                    <MessageSquare className="w-7 h-7 text-primary-700" />
                  </div>
                  <div>
                    <h3 className="font-elegant font-semibold text-lg text-primary-800 mb-1">Send Messages</h3>
                    <p className="text-sm text-primary-600 font-light">Reach out to members</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/club-admin/add-event">
              <Card className="p-6 bg-white border-2 border-primary-100 hover:border-primary-400 hover:shadow-xl transition-all cursor-pointer group">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl group-hover:from-accent-100 group-hover:to-accent-200 transition-all">
                    <Plus className="w-7 h-7 text-accent-700" />
                  </div>
                  <div>
                    <h3 className="font-elegant font-semibold text-lg text-primary-800 mb-1">Add Event</h3>
                    <p className="text-sm text-primary-600 font-light">Create new lesson or clinic</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="font-elegant text-2xl font-semibold text-primary-800 mb-6 tracking-refined">Recent Activity</h2>
          <Card className="p-8 bg-white border-2 border-primary-100 shadow-lg">
            {activities.length > 0 ? (
              <div className="space-y-5">
                {activities.map((activity, index) => (
                  <div 
                    key={activity.id} 
                    className={`flex items-center justify-between ${index < activities.length - 1 ? 'pb-5 border-b border-cream-200' : ''}`}
                  >
                    <div>
                      <p className="font-elegant font-semibold text-primary-800 mb-1 capitalize">
                        {activity.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-primary-600 font-light">{activity.message}</p>
                    </div>
                    <span className="text-xs text-primary-500 uppercase tracking-wider whitespace-nowrap ml-4">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-primary-500 font-light">
                No recent activity
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
