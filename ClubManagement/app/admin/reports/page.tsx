"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Download, FileText, TrendingUp, Users, DollarSign } from "lucide-react"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { OccupancyChart } from "@/components/dashboard/occupancy-chart"
import { formatCurrency } from "@/lib/utils"

const mockRevenueData = [
  { date: "Jan", revenue: 285000 },
  { date: "Feb", revenue: 312000 },
  { date: "Mar", revenue: 298000 },
  { date: "Apr", revenue: 345000 },
  { date: "May", revenue: 378000 },
  { date: "Jun", revenue: 420000 },
]

const mockOccupancyData = [
  { time: "6 AM", occupancy: 12 },
  { time: "8 AM", occupancy: 38 },
  { time: "10 AM", occupancy: 78 },
  { time: "12 PM", occupancy: 92 },
  { time: "2 PM", occupancy: 85 },
  { time: "4 PM", occupancy: 70 },
  { time: "6 PM", occupancy: 52 },
  { time: "8 PM", occupancy: 22 },
]

export default function ReportsPage() {
  const [reportType, setReportType] = useState("revenue")
  const [timeRange, setTimeRange] = useState("month")

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-display font-medium tracking-tight text-primary mb-2">
            Reports & Analytics
          </h1>
          <p className="text-slate-600 font-sans">
            Comprehensive reporting and business intelligence
          </p>
        </div>
        <Button
          variant="luxury"
          className="gap-2 min-w-0"
          onClick={async () => {
            try {
              const response = await fetch("/api/reports/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reportType, timeRange }),
              })
              if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `${reportType}-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
              } else {
                alert("Failed to export report")
              }
            } catch (error) {
              alert("Failed to export report")
            }
          }}
        >
          <Download className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Export Report</span>
        </Button>
      </div>

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Report Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue Report</SelectItem>
                  <SelectItem value="membership">Membership Report</SelectItem>
                  <SelectItem value="occupancy">Occupancy Report</SelectItem>
                  <SelectItem value="financial">Financial Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Range</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gold" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-primary mb-2">
              {formatCurrency(2875000)}
            </div>
            <p className="text-sm text-slate-600 font-sans">
              <span className="text-slate-700">+12.5%</span> vs last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-700" />
              Active Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-primary mb-2">
              1,247
            </div>
            <p className="text-sm text-slate-600 font-sans">
              <span className="text-slate-700">+3.2%</span> growth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gold" />
              RevPAR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-primary mb-2">
              {formatCurrency(125.50)}
            </div>
            <p className="text-sm text-slate-600 font-sans">
              Revenue per available rental
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-700" />
              Churn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-primary mb-2">
              2.3%
            </div>
            <p className="text-sm text-slate-600 font-sans">
              Monthly membership churn
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Revenue Trend</CardTitle>
            <CardDescription className="font-sans">
              6-month revenue performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={mockRevenueData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Average Occupancy</CardTitle>
            <CardDescription className="font-sans">
              Daily court utilization pattern
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OccupancyChart data={mockOccupancyData} />
          </CardContent>
        </Card>
      </div>

      {/* Membership Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Membership Analytics</CardTitle>
          <CardDescription className="font-sans">
            Membership growth and retention metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 font-sans mb-2">New Members This Month</p>
              <p className="text-xl font-display font-medium tracking-tight text-primary">42</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 font-sans mb-2">Renewal Rate</p>
              <p className="text-xl font-display font-medium tracking-tight text-slate-700">97.7%</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 font-sans mb-2">Average Membership Value</p>
              <p className="text-xl font-display font-medium tracking-tight text-gold">{formatCurrency(2300)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

