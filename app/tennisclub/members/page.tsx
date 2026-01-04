'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, Clock, Users, CheckCircle2, UserPlus } from 'lucide-react'
import { getEvents, enrollInEvent, initializeData, type Event } from '@/lib/club-data'

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

export default function ClubMembersPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showSignUpModal, setShowSignUpModal] = useState(false)
  const [signUpForm, setSignUpForm] = useState({
    name: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    initializeData()
    loadEvents()
  }, [])

  const loadEvents = () => {
    const allEvents = getEvents()
    // Filter to only show clinics (not private lessons) and future events
    const today = new Date().toISOString().split('T')[0]
    const available = allEvents.filter(e => 
      e.type === 'clinic' && 
      e.date >= today && 
      e.enrolled < e.capacity
    )
    setEvents(available)
  }

  const availableEvents = events.filter(e => e.enrolled < e.capacity)

  const handleSignUp = (event: Event) => {
    setSelectedEvent(event)
    setShowSignUpModal(true)
  }

  const handleSubmitSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEvent) return

    const success = enrollInEvent(selectedEvent.id)
    
    if (success) {
      loadEvents() // Reload events to reflect new enrollment
      alert(`Successfully signed up for "${selectedEvent.title}"!\n\nYou'll receive a confirmation email at ${signUpForm.email}`)
      setShowSignUpModal(false)
      setSignUpForm({ name: '', email: '', phone: '' })
      setSelectedEvent(null)
    } else {
      alert('Sorry, this event is now full or no longer available. Please try another event.')
      loadEvents()
      setShowSignUpModal(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100">
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Page Header */}
        <div className="text-center mb-10 pb-8 border-b-2 border-primary-200">
          <h1 className="font-elegant text-5xl font-semibold text-primary-800 mb-3 tracking-refined">Long Island Tennis Club</h1>
          <p className="text-primary-600 font-light text-lg">Upcoming Clinics & Lessons</p>
        </div>

        {/* Info Banner */}
        <Card className="p-8 mb-10 bg-gradient-to-br from-primary-50 to-cream-50 border-2 border-primary-200 shadow-lg">
          <div className="flex items-start gap-5">
            <div className="p-3 bg-primary-100 rounded-lg">
              <CheckCircle2 className="w-7 h-7 text-primary-700 flex-shrink-0" />
            </div>
            <div>
              <h2 className="font-elegant font-semibold text-xl text-primary-800 mb-2 tracking-refined">Sign Up for Upcoming Events</h2>
              <p className="text-sm text-primary-700 font-light leading-relaxed">
                Browse available clinics and lessons below. Click "Sign Up" to reserve your spot. 
                Spots are limited and fill up quickly!
              </p>
            </div>
          </div>
        </Card>

        {/* Events Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableEvents.map((event) => (
            <Card key={event.id} className="p-8 border-2 border-primary-100 hover:border-primary-300 hover:shadow-xl transition-all bg-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-elegant font-semibold text-xl text-primary-800">{event.title}</h3>
                    <Badge variant={event.type === 'clinic' ? 'default' : 'secondary'} className={event.type === 'clinic' ? 'bg-primary-600' : 'bg-accent-500'}>
                      {event.type}
                    </Badge>
                  </div>
                  {event.description && (
                    <p className="text-sm text-primary-600 mb-4 font-light leading-relaxed">{event.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-3 text-sm text-primary-700">
                  <CalendarIcon className="w-4 h-4 text-primary-600" />
                  <span className="font-light">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-primary-700">
                  <Clock className="w-4 h-4 text-primary-600" />
                  <span className="font-light">{event.time} ({event.duration} min)</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-primary-700">
                  <Users className="w-4 h-4 text-primary-600" />
                  <span className="font-light">Instructor: <span className="font-medium">{event.instructor}</span></span>
                </div>
                {event.price && (
                  <div className="text-base font-elegant font-semibold text-primary-800 pt-2 border-t border-cream-200">
                    ${event.price} per person
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Spots available</span>
                  <span className={`font-semibold ${event.enrolled < event.capacity ? 'text-green-600' : 'text-red-600'}`}>
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

              <Button
                onClick={() => handleSignUp(event)}
                className="w-full bg-primary-700 hover:bg-primary-800 text-white border-0 shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={event.enrolled >= event.capacity}
              >
                {event.enrolled >= event.capacity ? 'Full' : 'Sign Up'}
              </Button>
            </Card>
          ))}
        </div>

        {availableEvents.length === 0 && (
          <Card className="p-12 text-center border-2 border-primary-100 shadow-lg bg-white">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-primary-300" />
            <p className="text-primary-700 text-lg mb-2 font-light">No events available at the moment</p>
            <p className="text-primary-500 text-sm font-light">Check back soon for new clinics and lessons!</p>
          </Card>
        )}
      </main>

      {/* Sign Up Modal */}
      <Dialog open={showSignUpModal} onOpenChange={setShowSignUpModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Up for {selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <form onSubmit={handleSubmitSignUp} className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <p><strong>Date:</strong> {new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                <p><strong>Time:</strong> {selectedEvent.time} ({selectedEvent.duration} min)</p>
                <p><strong>Instructor:</strong> {selectedEvent.instructor}</p>
                {selectedEvent.price && <p><strong>Price:</strong> ${selectedEvent.price}</p>}
              </div>

              <div>
                <Label htmlFor="signup-name">Full Name *</Label>
                <Input
                  id="signup-name"
                  value={signUpForm.name}
                  onChange={(e) => setSignUpForm({...signUpForm, name: e.target.value})}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="signup-email">Email *</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signUpForm.email}
                  onChange={(e) => setSignUpForm({...signUpForm, email: e.target.value})}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="signup-phone">Phone *</Label>
                <Input
                  id="signup-phone"
                  type="tel"
                  value={signUpForm.phone}
                  onChange={(e) => setSignUpForm({...signUpForm, phone: e.target.value})}
                  required
                  className="mt-2"
                  placeholder="(516) 555-0123"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setShowSignUpModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Confirm Sign Up
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
