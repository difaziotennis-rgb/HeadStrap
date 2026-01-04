'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Calendar as CalendarIcon, Clock, Users, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getEvents, deleteEvent, initializeData, getMembers, type Event } from '@/lib/club-data'

interface Event {
  id: string
  title: string
  type: 'lesson' | 'clinic'
  date: string
  time: string
  duration: number
  enrolled: number
  capacity: number
  instructor: string
  price?: number
  description?: string
}

export default function CalendarPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    initializeData()
    loadEvents()
  }, [])

  const loadEvents = () => {
    const allEvents = getEvents()
    setEvents(allEvents)
  }

  const filteredEvents = events.filter(event => event.date === selectedDate)
  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = []
    acc[event.date].push(event)
    return acc
  }, {} as Record<string, Event[]>)

  const allDates = Object.keys(groupedEvents).sort()

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Are you sure you want to delete this event? This cannot be undone.')) {
      deleteEvent(eventId)
      loadEvents()
      setShowEventModal(false)
    }
  }

  const handleDateClick = (date: string) => {
    setSelectedDate(date)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100">
      <main className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8 pb-6 border-b-2 border-primary-200 flex items-center justify-between">
          <div>
            <h1 className="font-elegant text-4xl font-semibold text-primary-800 mb-2 tracking-refined">Calendar</h1>
            <p className="text-primary-600 font-light">Lessons and clinics schedule</p>
          </div>
          <Button onClick={() => router.push('/club-admin/add-event')} className="bg-primary-700 hover:bg-primary-800 text-white border-0 shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <Card className="p-8 border-2 border-primary-100 shadow-xl bg-white">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-elegant text-2xl font-semibold text-primary-800 tracking-refined">Upcoming Events</h2>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border-2 border-primary-200 rounded-lg text-primary-700 focus:border-primary-400 focus:outline-none"
                />
              </div>

              {filteredEvents.length > 0 ? (
                <div className="space-y-4">
                  {filteredEvents.map((event) => (
                    <div key={event.id} className="border-2 border-primary-100 rounded-xl p-6 hover:border-primary-300 hover:shadow-lg transition-all bg-white mb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-elegant font-semibold text-lg text-primary-800">{event.title}</h3>
                            <Badge variant={event.type === 'clinic' ? 'default' : 'secondary'} className={event.type === 'clinic' ? 'bg-primary-600' : 'bg-accent-500'}>
                              {event.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-5 text-sm text-primary-600 mb-2">
                            <span className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-primary-500" />
                              {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-primary-500" />
                              {event.time} ({event.duration} min)
                            </span>
                            <span className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-primary-500" />
                              {event.enrolled}/{event.capacity}
                            </span>
                          </div>
                          <p className="text-sm text-primary-600 font-light mt-1">Instructor: <span className="font-medium">{event.instructor}</span></p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewEvent(event)} className="border-primary-300 text-primary-700 hover:bg-primary-50">
                            View
                          </Button>
                        </div>
                      </div>
                      {event.type === 'clinic' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Spots available</span>
                            <span className={`font-medium ${event.enrolled < event.capacity ? 'text-green-600' : 'text-red-600'}`}>
                              {event.capacity - event.enrolled} remaining
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${event.enrolled < event.capacity ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${(event.enrolled / event.capacity) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No events scheduled for this date</p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar - Quick Overview */}
          <div className="space-y-4">
            <Card className="p-6 border-2 border-primary-100 shadow-lg bg-white">
              <h3 className="font-elegant font-semibold text-lg text-primary-800 mb-5 tracking-refined">This Week</h3>
              <div className="space-y-4">
                {allDates.slice(0, 5).map((date) => {
                  const dayEvents = groupedEvents[date] || []
                  const isSelected = date === selectedDate
                  return (
                    <button
                      key={date}
                      onClick={() => handleDateClick(date)}
                      className={`w-full text-left border-b border-cream-200 pb-4 last:border-0 transition-all ${
                        isSelected ? 'bg-primary-50 -mx-2 px-2 rounded-lg' : 'hover:bg-cream-50 -mx-1 px-1 rounded'
                      }`}
                    >
                      <p className={`font-elegant font-semibold text-sm mb-1 ${isSelected ? 'text-primary-700' : 'text-primary-800'}`}>
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-primary-600 font-light">
                        {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                      </p>
                    </button>
                  )
                })}
              </div>
            </Card>

            <Card className="p-6 border-2 border-primary-100 shadow-lg bg-white">
              <h3 className="font-elegant font-semibold text-lg text-primary-800 mb-5 tracking-refined">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-primary-600 font-light">Total Events</span>
                  <span className="font-elegant font-semibold text-primary-800">{events.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-primary-600 font-light">Full Clinics</span>
                  <span className="font-elegant font-semibold text-red-600">
                    {events.filter(e => e.type === 'clinic' && e.enrolled >= e.capacity).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-primary-600 font-light">Available Spots</span>
                  <span className="font-elegant font-semibold text-green-700">
                    {events.reduce((sum, e) => sum + (e.capacity - e.enrolled), 0)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Event Details Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
              {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={selectedEvent.type === 'clinic' ? 'default' : 'secondary'} className={selectedEvent.type === 'clinic' ? 'bg-primary-600' : 'bg-accent-500'}>
                  {selectedEvent.type}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-primary-600 font-light">Date</p>
                  <p className="font-elegant font-semibold text-primary-800">{new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-sm text-primary-600 font-light">Time</p>
                  <p className="font-elegant font-semibold text-primary-800">{selectedEvent.time} ({selectedEvent.duration} min)</p>
                </div>
                <div>
                  <p className="text-sm text-primary-600 font-light">Instructor</p>
                  <p className="font-elegant font-semibold text-primary-800">{selectedEvent.instructor}</p>
                </div>
                {selectedEvent.price && (
                  <div>
                    <p className="text-sm text-primary-600 font-light">Price</p>
                    <p className="font-elegant font-semibold text-primary-800">${selectedEvent.price}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-primary-600 font-light">Enrollment</p>
                  <p className="font-elegant font-semibold text-primary-800">{selectedEvent.enrolled}/{selectedEvent.capacity}</p>
                </div>
              </div>

              {selectedEvent.enrolledMembers && selectedEvent.enrolledMembers.length > 0 && (
                <div>
                  <p className="text-sm text-primary-600 font-light mb-2">Enrolled Members</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {selectedEvent.enrolledMembers.map((memberId, idx) => {
                      const members = getMembers()
                      const member = members.find(m => m.id === memberId)
                      return member ? (
                        <div key={idx} className="text-sm text-primary-700 py-1">
                          {member.name} ({member.email})
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {selectedEvent.description && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="text-sm">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.type === 'clinic' && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Availability</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div
                      className={`h-2 rounded-full ${selectedEvent.enrolled < selectedEvent.capacity ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${(selectedEvent.enrolled / selectedEvent.capacity) * 100}%` }}
                    />
                  </div>
                  <p className={`text-sm font-medium ${selectedEvent.enrolled < selectedEvent.capacity ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedEvent.capacity - selectedEvent.enrolled} spots remaining
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowEventModal(false)}>
                  Close
                </Button>
                <Button variant="outline" onClick={() => handleDeleteEvent(selectedEvent.id)} className="text-red-600">
                  Delete Event
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
