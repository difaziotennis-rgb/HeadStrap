'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Send, Sparkles, Mail, Users, CheckCircle2 } from 'lucide-react'
import { getMembers, getEvents, addActivity, initializeData } from '@/lib/club-data'

export default function MessagesPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [recipients, setRecipients] = useState<'all' | 'active' | 'selected'>('all')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showMemberSelection, setShowMemberSelection] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    initializeData()
    const allMembers = getMembers()
    setMembers(allMembers)
    const allEvents = getEvents()
    setEvents(allEvents)
  }, [])
  
  const activeMembers = members.filter(m => m.status === 'active')
  const memberCount = members.length

  const handleAIGenerate = async () => {
    setIsGenerating(true)
    
    // Find upcoming events with spots available
    const today = new Date().toISOString().split('T')[0]
    const upcomingEvents = events
      .filter(e => e.date >= today && e.type === 'clinic' && e.enrolled < e.capacity)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3)
    
    // Simulate AI generation (in production, call API)
    setTimeout(() => {
      if (upcomingEvents.length > 0) {
        const event = upcomingEvents[0]
        const spotsAvailable = event.capacity - event.enrolled
        setSubject(`Upcoming ${event.title} - Limited Spots Available!`)
        setMessage(`Dear Members,

We have exciting news! Our ${event.title} has ${spotsAvailable} spot${spotsAvailable !== 1 ? 's' : ''} available.

Event Details:
- Date: ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
- Time: ${event.time}
- Duration: ${event.duration} minutes
- Cost: ${event.price ? '$' + event.price : 'Contact us for pricing'}
- Spots Available: ${spotsAvailable}

${event.description ? `${event.description}\n\n` : ''}To secure your spot, please visit our member portal or reply to this message.

We look forward to seeing you on the courts!

Best regards,
Long Island Tennis Club`)
      } else {
        setSubject('Club Update - Upcoming Events')
        setMessage(`Dear Members,

Thank you for being part of our tennis community! We wanted to share some updates about upcoming activities at the club.

Stay tuned for new clinics and events coming soon. We're always working to bring you the best tennis experiences.

If you have any questions or would like to schedule a private lesson, please don't hesitate to reach out.

See you on the courts!

Best regards,
Long Island Tennis Club`)
      }
      setIsGenerating(false)
    }, 2000)
  }

  const handleSend = () => {
    let recipientList: string[] = []
    
    if (recipients === 'all') {
      recipientList = members.map(m => m.email)
    } else if (recipients === 'active') {
      recipientList = activeMembers.map(m => m.email)
    } else if (recipients === 'selected') {
      recipientList = members.filter(m => selectedMemberIds.includes(m.id)).map(m => m.email)
    }
    
    if (recipientList.length === 0) {
      alert('Please select at least one recipient.')
      return
    }
    
    // Record activity
    addActivity({
      type: 'message_sent',
      message: `Message "${subject}" sent to ${recipientList.length} member${recipientList.length !== 1 ? 's' : ''}`,
      metadata: { subject, recipientCount: recipientList.length }
    })
    
    // In production, send via API/email service
    alert(`Message sent to ${recipientList.length} member${recipientList.length !== 1 ? 's' : ''}!\n\nSubject: ${subject}\n\nIn production, this would be sent via email. Recipients: ${recipientList.join(', ')}`)
    setSubject('')
    setMessage('')
    setSelectedMemberIds([])
    setShowPreview(false)
  }

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100">
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8 pb-6 border-b-2 border-primary-200">
          <h1 className="font-elegant text-4xl font-semibold text-primary-800 mb-2 tracking-refined">Send Message</h1>
          <p className="text-primary-600 font-light">Reach out to your members</p>
        </div>

        <div className="grid gap-6">
          {/* Recipients Selection */}
          <Card className="p-8 border-2 border-primary-100 shadow-lg bg-white">
            <Label className="font-elegant text-lg font-semibold text-primary-800 mb-6 block tracking-refined">Send To</Label>
            <div className="grid gap-4 md:grid-cols-3">
              <button
                onClick={() => setRecipients('all')}
                className={`p-6 border-2 rounded-xl text-left transition-all ${
                  recipients === 'all' ? 'border-primary-700 bg-primary-50 shadow-lg' : 'border-primary-200 hover:border-primary-400 bg-white'
                }`}
              >
                <Users className="w-7 h-7 mb-3 text-primary-700" />
                <div className="font-elegant font-semibold text-primary-800 mb-1">All Members</div>
                <div className="text-sm text-primary-600 font-light">{memberCount} members</div>
              </button>
              <button
                onClick={() => setRecipients('active')}
                className={`p-6 border-2 rounded-xl text-left transition-all ${
                  recipients === 'active' ? 'border-primary-700 bg-primary-50 shadow-lg' : 'border-primary-200 hover:border-primary-400 bg-white'
                }`}
              >
                <CheckCircle2 className="w-7 h-7 mb-3 text-primary-700" />
                <div className="font-elegant font-semibold text-primary-800 mb-1">Active Only</div>
                <div className="text-sm text-primary-600 font-light">{memberCount - 5} members</div>
              </button>
              <button
                onClick={() => {
                  setRecipients('selected')
                  setShowMemberSelection(true)
                }}
                className={`p-6 border-2 rounded-xl text-left transition-all ${
                  recipients === 'selected' ? 'border-primary-700 bg-primary-50 shadow-lg' : 'border-primary-200 hover:border-primary-400 bg-white'
                }`}
              >
                <Mail className="w-7 h-7 mb-3 text-primary-700" />
                <div className="font-elegant font-semibold text-primary-800 mb-1">Select Members</div>
                <div className="text-sm text-primary-600 font-light">
                  {selectedMemberIds.length > 0 ? `${selectedMemberIds.length} selected` : 'Choose specific'}
                </div>
              </button>
            </div>
          </Card>

          {/* AI Assistant */}
          <Card className="p-8 bg-gradient-to-br from-accent-50 to-cream-100 border-2 border-accent-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-100 rounded-lg">
                  <Sparkles className="w-6 h-6 text-accent-700" />
                </div>
                <Label className="font-elegant text-lg font-semibold text-primary-800 tracking-refined">AI Message Assistant</Label>
              </div>
              <Button
                onClick={handleAIGenerate}
                disabled={isGenerating}
                variant="outline"
                className="border-accent-400 text-accent-700 hover:bg-accent-50"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Message
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-primary-700 font-light">
              Let AI help you draft professional messages about upcoming clinics, promotions, or club updates. 
              Click "Generate Message" and we'll create a message for you!
            </p>
          </Card>

          {/* Message Composition */}
          <Card className="p-8 border-2 border-primary-100 shadow-lg bg-white">
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject line..."
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here, or use AI to generate one..."
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={12}
                />
                <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                  <span>{message.length} characters</span>
                  <span>{message.split('\n').length} lines</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={!subject || !message}
              className="border-primary-300 text-primary-700 hover:bg-primary-50"
            >
              Preview
            </Button>
            <Button
              onClick={handleSend}
              disabled={!subject || !message}
              className="min-w-[120px] bg-primary-700 hover:bg-primary-800 text-white border-0 shadow-lg"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Message Preview</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-primary-600">To:</Label>
                <p className="text-sm text-primary-700">
                  {recipients === 'all' ? `${memberCount} members` : 
                   recipients === 'active' ? `${activeMembers.length} active members` : 
                   `${selectedMemberIds.length} selected members`}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-600">Subject:</Label>
                <p className="text-sm font-medium">{subject}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-600">Message:</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-md border whitespace-pre-wrap text-sm">
                  {message}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Edit
                </Button>
                <Button onClick={handleSend}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Member Selection Modal */}
        <Dialog open={showMemberSelection} onOpenChange={setShowMemberSelection}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select Members</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMemberIds(activeMembers.map(m => m.id))}
                  className="border-primary-300 text-primary-700"
                >
                  Select All Active
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMemberIds([])}
                  className="border-primary-300 text-primary-700"
                >
                  Clear All
                </Button>
              </div>
              {activeMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 border border-primary-200 rounded-lg hover:bg-primary-50">
                  <Checkbox
                    checked={selectedMemberIds.includes(member.id)}
                    onCheckedChange={() => toggleMemberSelection(member.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-primary-800">{member.name}</p>
                    <p className="text-sm text-primary-600">{member.email}</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowMemberSelection(false)}>
                  Done ({selectedMemberIds.length} selected)
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
