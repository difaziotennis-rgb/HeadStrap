"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface MemberArrival {
  id: string
  memberName: string
  memberNumber: number
  arrivalTime: Date
  reservationType: "TENNIS_COURT" | "DINING_TABLE" | "TEE_TIME"
  resourceId: string
}

interface MemberArrivalsProps {
  arrivals: MemberArrival[]
}

export function MemberArrivals({ arrivals }: MemberArrivalsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Member Arrivals</CardTitle>
        <CardDescription className="font-sans">Recent check-ins and arrivals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {arrivals.length === 0 ? (
            <p className="text-sm text-slate-500 font-sans text-center py-4">
              No recent arrivals
            </p>
          ) : (
            arrivals.map((arrival) => (
              <div
                key={arrival.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-sans font-medium text-primary text-sm truncate">
                      {arrival.memberName}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      M-{arrival.memberNumber}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-sans">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(arrival.arrivalTime, { addSuffix: true })}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-sans mt-1">
                    {arrival.reservationType === "TENNIS_COURT" && `Court ${arrival.resourceId}`}
                    {arrival.reservationType === "DINING_TABLE" && `Table ${arrival.resourceId}`}
                    {arrival.reservationType === "TEE_TIME" && `Tee Time ${arrival.resourceId}`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}


