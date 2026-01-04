// Club data management utilities for localStorage persistence

export interface Member {
  id: string
  name: string
  email: string
  phone: string
  joinDate: string
  status: 'active' | 'inactive'
}

export interface Event {
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
  enrolledMembers?: string[] // Array of member IDs
}

export interface Activity {
  id: string
  type: 'member_added' | 'member_updated' | 'event_created' | 'event_deleted' | 'event_enrolled' | 'message_sent' | 'clinic_full'
  message: string
  timestamp: string
  metadata?: Record<string, any>
}

// Members
export function getMembers(): Member[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('clubMembers')
  if (stored) return JSON.parse(stored)
  
  // Return default members
  return [
    { id: '1', name: 'John Smith', email: 'john@example.com', phone: '(516) 555-0123', joinDate: '2024-01-15', status: 'active' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', phone: '(631) 555-0456', joinDate: '2024-02-20', status: 'active' },
    { id: '3', name: 'Mike Davis', email: 'mike@example.com', phone: '(516) 555-0789', joinDate: '2024-01-10', status: 'active' },
    { id: '4', name: 'Emily Chen', email: 'emily@example.com', phone: '(631) 555-0321', joinDate: '2024-03-05', status: 'active' },
    { id: '5', name: 'Robert Wilson', email: 'robert@example.com', phone: '(516) 555-0654', joinDate: '2023-12-01', status: 'inactive' },
  ]
}

export function saveMembers(members: Member[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('clubMembers', JSON.stringify(members))
}

export function addMember(member: Omit<Member, 'id' | 'joinDate'>): Member {
  const newMember: Member = {
    ...member,
    id: Date.now().toString(),
    joinDate: new Date().toISOString().split('T')[0]
  }
  const members = getMembers()
  members.push(newMember)
  saveMembers(members)
  addActivity({
    type: 'member_added',
    message: `${newMember.name} joined the club`,
    metadata: { memberId: newMember.id }
  })
  return newMember
}

export function updateMember(id: string, updates: Partial<Member>): void {
  const members = getMembers()
  const index = members.findIndex(m => m.id === id)
  if (index !== -1) {
    const oldMember = members[index]
    members[index] = { ...members[index], ...updates }
    saveMembers(members)
    addActivity({
      type: 'member_updated',
      message: `${members[index].name}'s information was updated`,
      metadata: { memberId: id }
    })
  }
}

export function deleteMember(id: string): void {
  const members = getMembers()
  const member = members.find(m => m.id === id)
  if (member) {
    const filtered = members.filter(m => m.id !== id)
    saveMembers(filtered)
    addActivity({
      type: 'member_updated',
      message: `${member.name} was removed from the club`,
      metadata: { memberId: id }
    })
  }
}

// Events
export function getDefaultEvents(): Event[] {
  return [
    { id: '1', title: 'Adult Beginner Clinic', type: 'clinic', date: '2024-03-15', time: '10:00', duration: 90, enrolled: 8, capacity: 12, instructor: 'Mike', price: 45, description: 'Perfect for adults new to tennis or returning players.', enrolledMembers: ['1', '2', '3', '4', '5', '6', '7', '8'] },
    { id: '2', title: 'Private Lesson - John', type: 'lesson', date: '2024-03-15', time: '14:00', duration: 60, enrolled: 1, capacity: 1, instructor: 'Mike', price: 80, enrolledMembers: ['1'] },
    { id: '3', title: 'Junior Clinic', type: 'clinic', date: '2024-03-16', time: '15:00', duration: 60, enrolled: 6, capacity: 10, instructor: 'Sarah', price: 35, description: 'Fun and engaging clinic for junior players ages 8-14.', enrolledMembers: ['2', '3', '4', '5', '6', '7'] },
    { id: '4', title: 'Advanced Clinic', type: 'clinic', date: '2024-03-16', time: '17:00', duration: 90, enrolled: 10, capacity: 10, instructor: 'Mike', price: 50, description: 'For advanced players looking to refine their game.', enrolledMembers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
    { id: '5', title: 'Weekend Group Clinic', type: 'clinic', date: '2024-03-17', time: '10:00', duration: 120, enrolled: 4, capacity: 12, instructor: 'Mike', price: 45, description: 'Weekend group session for all skill levels.', enrolledMembers: ['1', '2', '3', '4'] },
  ]
}

export function getEvents(): Event[] {
  if (typeof window === 'undefined') return getDefaultEvents()
  
  const defaultEvents = getDefaultEvents()
  const savedEvents = JSON.parse(localStorage.getItem('clubEvents') || '[]')
  const defaultIds = new Set(defaultEvents.map(e => e.id))
  
  // Merge saved events, ensuring enrolledMembers array exists
  const allSavedEvents = savedEvents.map((e: Event) => ({
    ...e,
    enrolledMembers: e.enrolledMembers || []
  }))
  
  // Update default events with saved enrolledMembers
  const updatedDefaults = defaultEvents.map(defEvent => {
    const saved = allSavedEvents.find((e: Event) => e.id === defEvent.id)
    if (saved) {
      return {
        ...defEvent,
        enrolled: saved.enrolledMembers?.length || defEvent.enrolled,
        enrolledMembers: saved.enrolledMembers || defEvent.enrolledMembers || []
      }
    }
    return defEvent
  })
  
  const newEvents = allSavedEvents.filter((e: Event) => !defaultIds.has(e.id))
  return [...updatedDefaults, ...newEvents]
}

export function saveEvents(events: Event[]): void {
  if (typeof window === 'undefined') return
  const defaultIds = new Set(getDefaultEvents().map(e => e.id))
  // Only save custom events and enrollment updates to default events
  const customEvents = events.filter(e => !defaultIds.has(e.id))
  const enrollmentUpdates = events
    .filter(e => defaultIds.has(e.id))
    .map(e => ({ id: e.id, enrolled: e.enrolled, enrolledMembers: e.enrolledMembers || [] }))
  
  localStorage.setItem('clubEvents', JSON.stringify([...customEvents, ...enrollmentUpdates]))
}

export function addEvent(event: Omit<Event, 'id' | 'enrolled' | 'enrolledMembers'>): Event {
  const newEvent: Event = {
    ...event,
    id: Date.now().toString(),
    enrolled: 0,
    enrolledMembers: []
  }
  const events = getEvents()
  events.push(newEvent)
  saveEvents(events)
  addActivity({
    type: 'event_created',
    message: `New ${event.type}: "${event.title}" created`,
    metadata: { eventId: newEvent.id }
  })
  return newEvent
}

export function deleteEvent(id: string): void {
  const events = getEvents()
  const event = events.find(e => e.id === id)
  if (event) {
    const filtered = events.filter(e => e.id !== id)
    saveEvents(filtered)
    addActivity({
      type: 'event_deleted',
      message: `Event "${event.title}" was deleted`,
      metadata: { eventId: id }
    })
  }
}

export function enrollInEvent(eventId: string, memberId?: string): boolean {
  const events = getEvents()
  const event = events.find(e => e.id === eventId)
  if (!event || event.enrolled >= event.capacity) return false
  
  event.enrolled += 1
  if (memberId) {
    event.enrolledMembers = event.enrolledMembers || []
    if (!event.enrolledMembers.includes(memberId)) {
      event.enrolledMembers.push(memberId)
    }
  }
  
  saveEvents(events)
  
  if (event.enrolled >= event.capacity) {
    addActivity({
      type: 'clinic_full',
      message: `${event.title} is now full`,
      metadata: { eventId }
    })
  } else {
    addActivity({
      type: 'event_enrolled',
      message: `New sign-up for ${event.title}`,
      metadata: { eventId }
    })
  }
  
  return true
}

// Activities
export function getActivities(limit?: number): Activity[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('clubActivities')
  if (!stored) return []
  const activities: Activity[] = JSON.parse(stored)
  const sorted = activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return limit ? sorted.slice(0, limit) : sorted
}

export function addActivity(activity: Omit<Activity, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return
  const newActivity: Activity = {
    ...activity,
    id: Date.now().toString(),
    timestamp: new Date().toISOString()
  }
  const activities = getActivities()
  activities.push(newActivity)
  // Keep only last 100 activities
  const limited = activities.slice(-100)
  localStorage.setItem('clubActivities', JSON.stringify(limited))
}

// Initialize default data
export function initializeData(): void {
  if (typeof window === 'undefined') return
  if (!localStorage.getItem('clubMembers')) {
    saveMembers(getMembers())
  }
  if (!localStorage.getItem('clubActivities')) {
    // Add some initial activities
    addActivity({
      type: 'message_sent',
      message: 'Weekly clinic reminder sent to 45 members',
      metadata: {}
    })
  }
}

