"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Clock } from "lucide-react"

interface Court {
  id: string
  number: number
  status: "available" | "occupied" | "maintenance"
  currentReservation?: {
    memberName: string
    startTime: string
    endTime: string
  }
}

interface CourtOccupancyProps {
  courts: Court[]
}

export function CourtOccupancy({ courts }: CourtOccupancyProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle2 className="h-4 w-4 text-slate-600" />
      case "occupied":
        return <Clock className="h-4 w-4 text-slate-700" />
      case "maintenance":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-slate-100 text-slate-700"
      case "occupied":
        return "bg-primary/10 text-primary"
      case "maintenance":
        return "bg-red-100 text-red-700"
      default:
        return "bg-slate-100 text-slate-500"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Real-time Court Occupancy</CardTitle>
        <CardDescription className="font-sans">10 Tennis Courts Status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {courts.map((court) => (
            <div
              key={court.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getStatusIcon(court.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-medium text-primary text-sm">
                      Court {court.number}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(court.status)}`}
                    >
                      {court.status.charAt(0).toUpperCase() + court.status.slice(1)}
                    </Badge>
                  </div>
                  {court.currentReservation && (
                    <p className="text-xs text-slate-600 font-sans mt-1 truncate">
                      {court.currentReservation.memberName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


