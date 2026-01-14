"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Calendar, DollarSign, Clock, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Mock member data
const mockMemberData = {
  name: "John Smith",
  memberNumber: "M-2024-0123",
  nextBooking: {
    type: "Court Booking",
    date: "2024-01-20",
    time: "10:00 AM",
    court: "Court 3",
  },
  accountBalance: 1250.00,
  upcomingEvents: [
    { name: "Winter Tournament", date: "2024-01-25" },
    { name: "Member Social Mixer", date: "2024-02-01" },
  ],
}

export default function MemberDashboard() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl font-display font-medium tracking-tight text-primary mb-2">
          Welcome back, {mockMemberData.name}
        </h1>
        <p className="text-slate-600 font-sans">
          Member #{mockMemberData.memberNumber}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg font-display">Book a Court</CardTitle>
            <CardDescription className="font-sans">
              Reserve a tennis court
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="luxury">
              <Link href="/member/bookings" className="flex items-center justify-center">
                <span>Book Now</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg font-display">View Statements</CardTitle>
            <CardDescription className="font-sans">
              Check your account balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/member/statements" className="flex items-center justify-center">
                <span>View Statements</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg font-display">Register for Event</CardTitle>
            <CardDescription className="font-sans">
              Join upcoming events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="success">
              <Link href="/member/events" className="flex items-center justify-center">
                <span>Browse Events</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Account Summary & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Account Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-gold" />
                <span className="font-sans text-slate-600">Account Balance</span>
              </div>
              <span className="text-xl font-display font-medium tracking-tight text-primary">
                {formatCurrency(mockMemberData.accountBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-700" />
                <span className="font-sans text-slate-600">Next Booking</span>
              </div>
              <div className="text-right">
                <p className="font-sans font-medium text-primary">
                  {mockMemberData.nextBooking.court}
                </p>
                <p className="font-sans text-sm text-slate-500">
                  {mockMemberData.nextBooking.date} at {mockMemberData.nextBooking.time}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockMemberData.upcomingEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-sans font-medium text-primary">{event.name}</p>
                    <p className="font-sans text-sm text-slate-500">{event.date}</p>
                  </div>
                  <Clock className="h-5 w-5 text-gold" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

