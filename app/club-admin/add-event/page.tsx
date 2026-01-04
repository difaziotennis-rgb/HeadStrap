'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { addEvent } from '@/lib/club-data'

export default function AddEventPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    type: 'clinic',
    date: '',
    time: '',
    duration: '60',
    capacity: '12',
    instructor: '',
    description: '',
    price: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      addEvent({
        title: formData.title,
        type: formData.type as 'lesson' | 'clinic',
        date: formData.date,
        time: formData.time,
        duration: parseInt(formData.duration),
        capacity: parseInt(formData.capacity),
        instructor: formData.instructor,
        description: formData.description || undefined,
        price: formData.price ? parseInt(formData.price) : undefined
      })

      alert('Event created successfully!')
      router.push('/club-admin/calendar')
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100">
      <main className="container mx-auto px-6 py-12 max-w-2xl">
        {/* Page Header */}
        <div className="mb-8 pb-6 border-b-2 border-primary-200 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/club-admin/calendar')} className="text-primary-700 hover:bg-primary-50">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-elegant text-4xl font-semibold text-primary-800 tracking-refined">Add Event</h1>
            <p className="text-primary-600 font-light">Create a new lesson or clinic</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-8 border-2 border-primary-100 shadow-xl bg-white">
            <div className="space-y-6">
              <div>
                <Label htmlFor="type">Event Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinic">Clinic (Group)</SelectItem>
                    <SelectItem value="lesson">Private Lesson</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Adult Beginner Clinic"
                  className="mt-2"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="time">Start Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="mt-2"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Select value={formData.duration} onValueChange={(value) => setFormData({...formData, duration: value})}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === 'clinic' && (
                  <div>
                    <Label htmlFor="capacity">Capacity *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      className="mt-2"
                      min="1"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="instructor">Instructor *</Label>
                  <Input
                    id="instructor"
                    value={formData.instructor}
                    onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                    placeholder="e.g., Mike"
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price (optional)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="e.g., 45"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Additional details about this event..."
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              <div className="flex gap-4 justify-end pt-6 border-t-2 border-primary-100">
                <Button type="button" variant="outline" onClick={() => router.back()} className="border-primary-300 text-primary-700 hover:bg-primary-50">
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary-700 hover:bg-primary-800 text-white border-0 shadow-lg">
                  <Save className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </main>
    </div>
  )
}
