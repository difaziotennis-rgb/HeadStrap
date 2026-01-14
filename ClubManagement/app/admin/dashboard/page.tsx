"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { 
  DollarSign, 
  Users, 
  Calendar, 
  TrendingUp,
  Activity,
  Clock,
  CreditCard
} from "lucide-react"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { OccupancyChart } from "@/components/dashboard/occupancy-chart"
import { CourtOccupancy } from "@/components/dashboard/court-occupancy"
import { MemberArrivals } from "@/components/dashboard/member-arrivals"
import { useQuery } from "@tanstack/react-query"

// Mock data - will be replaced with API calls
const mockDashboardData = {
  todayRevenue: 12450.00,
  monthRevenue: 287500.00,
  activeMembers: 1247,
  pendingBookings: 23,
  courtOccupancy: 78.5,
  revenueChange: 12.5,
  memberChange: 3.2,
  bookingsChange: -5.1,
}

const mockRevenueData = [
  { date: "Mon", revenue: 8500 },
  { date: "Tue", revenue: 9200 },
  { date: "Wed", revenue: 7800 },
  { date: "Thu", revenue: 11200 },
  { date: "Fri", revenue: 13400 },
  { date: "Sat", revenue: 18500 },
  { date: "Sun", revenue: 12450 },
]

const mockOccupancyData = [
  { time: "6 AM", occupancy: 15 },
  { time: "8 AM", occupancy: 45 },
  { time: "10 AM", occupancy: 85 },
  { time: "12 PM", occupancy: 95 },
  { time: "2 PM", occupancy: 88 },
  { time: "4 PM", occupancy: 75 },
  { time: "6 PM", occupancy: 55 },
  { time: "8 PM", occupancy: 25 },
]

// Mock data for 10 tennis courts
const mockCourts = Array.from({ length: 10 }, (_, i) => ({
  id: `court-${i + 1}`,
  number: i + 1,
  status: (i % 3 === 0 ? "occupied" : i % 3 === 1 ? "available" : "available") as "available" | "occupied" | "maintenance",
  currentReservation:
    i % 3 === 0
      ? {
          memberName: `Member ${i + 1}`,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }
      : undefined,
}))

// Mock member arrivals
const mockArrivals = [
  {
    id: "1",
    memberName: "John Smith",
    memberNumber: 2024001,
    arrivalTime: new Date(Date.now() - 15 * 60 * 1000),
    reservationType: "TENNIS_COURT" as const,
    resourceId: "3",
  },
  {
    id: "2",
    memberName: "Sarah Johnson",
    memberNumber: 2024002,
    arrivalTime: new Date(Date.now() - 45 * 60 * 1000),
    reservationType: "TENNIS_COURT" as const,
    resourceId: "7",
  },
  {
    id: "3",
    memberName: "Michael Chen",
    memberNumber: 2024003,
    arrivalTime: new Date(Date.now() - 90 * 60 * 1000),
    reservationType: "DINING_TABLE" as const,
    resourceId: "5",
  },
]

export default function AdminDashboard() {
  const { data: dashboardData = mockDashboardData } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => mockDashboardData,
  })

  const metricCards = [
    {
      title: "Today's Revenue",
      value: formatCurrency(dashboardData.todayRevenue),
      change: `+${dashboardData.revenueChange}%`,
      changeType: "positive" as const,
      icon: DollarSign,
      description: "vs. yesterday",
    },
    {
      title: "Active Members",
      value: dashboardData.activeMembers.toLocaleString(),
      change: `+${dashboardData.memberChange}%`,
      changeType: "positive" as const,
      icon: Users,
      description: "vs. last month",
    },
    {
      title: "Pending Bookings",
      value: dashboardData.pendingBookings.toString(),
      change: `${dashboardData.bookingsChange > 0 ? "+" : ""}${dashboardData.bookingsChange}%`,
      changeType: dashboardData.bookingsChange > 0 ? "positive" : "negative",
      icon: Calendar,
      description: "vs. yesterday",
    },
    {
      title: "Court Occupancy",
      value: `${dashboardData.courtOccupancy}%`,
      change: "+2.3%",
      changeType: "positive" as const,
      icon: Activity,
      description: "avg. today",
    },
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
        <div className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl font-display font-medium text-primary mb-2 tracking-tight">
          Director's Dashboard
        </h1>
        <p className="text-slate-600 font-sans text-sm">
          Real-time insights and analytics for EliteClub operations
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.title} className="animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-sans font-medium text-slate-600">
                  {metric.title}
                </CardTitle>
                  <Icon className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-display font-medium text-primary mb-1">
                  {metric.value}
                </div>
                <div className="flex items-center gap-2 text-xs font-sans">
                  <span
                    className={
                      metric.changeType === "positive"
                        ? "text-slate-700"
                        : "text-red-600"
                    }
                  >
                    {metric.change}
                  </span>
                  <span className="text-slate-500">{metric.description}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Court Occupancy */}
        <div className="lg:col-span-1">
          <CourtOccupancy courts={mockCourts} />
        </div>

        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Revenue Today</CardTitle>
              <CardDescription className="font-sans">
                7-day revenue performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart data={mockRevenueData} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Member Arrivals & Hourly Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MemberArrivals arrivals={mockArrivals} />

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Hourly Occupancy</CardTitle>
            <CardDescription className="font-sans">
              Today's court utilization by hour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OccupancyChart data={mockOccupancyData} />
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium text-primary mb-2">
              {formatCurrency(dashboardData.monthRevenue)}
            </div>
            <div className="flex items-center gap-2 text-sm font-sans text-slate-600">
              <TrendingUp className="h-4 w-4 text-slate-700" />
              <span>On track for record month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display">RevPAR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium text-primary mb-2">
              {formatCurrency(125.50)}
            </div>
            <div className="flex items-center gap-2 text-sm font-sans text-slate-600">
              <Activity className="h-4 w-4 text-accent" />
              <span>Revenue per available rental</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display">Payment Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium text-primary mb-2">
              98.2%
            </div>
            <div className="flex items-center gap-2 text-sm font-sans text-slate-600">
              <CreditCard className="h-4 w-4 text-slate-700" />
              <span>Successful payment rate</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

