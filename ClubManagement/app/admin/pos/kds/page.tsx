"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { formatDateTime } from "@/lib/utils"

// Mock KDS orders
const mockOrders = [
  {
    id: "1",
    orderNumber: "ORD-001",
    table: "Table 5",
    items: [
      { name: "Grilled Salmon", quantity: 2, status: "preparing", time: "2:30" },
      { name: "Caesar Salad", quantity: 1, status: "ready", time: "1:15" },
    ],
    status: "in_progress",
    placedAt: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: "2",
    orderNumber: "ORD-002",
    table: "Table 12",
    items: [
      { name: "Chicken Caesar Salad", quantity: 1, status: "ready", time: "0:45" },
      { name: "Burger", quantity: 2, status: "preparing", time: "3:00" },
    ],
    status: "in_progress",
    placedAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: "3",
    orderNumber: "ORD-003",
    table: "Takeout",
    items: [
      { name: "Pasta", quantity: 1, status: "ready", time: "0:30" },
    ],
    status: "ready",
    placedAt: new Date(Date.now() - 15 * 60 * 1000),
  },
]

export default function KDSPage() {
  const queryClient = useQueryClient()
  const [selectedStation, setSelectedStation] = useState("all")
  const { data: orders = mockOrders } = useQuery({
    queryKey: ["kds-orders"],
    queryFn: async () => mockOrders,
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  const stations = ["all", "appetizers", "mains", "desserts", "beverages"]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-forest text-white"
      case "preparing":
        return "bg-gold text-primary"
      default:
        return "bg-slate-200 text-slate-700"
    }
  }

  const getItemStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-5 w-5 text-slate-700" />
      case "preparing":
        return <Clock className="h-5 w-5 text-gold" />
      default:
        return <AlertCircle className="h-5 w-5 text-slate-400" />
    }
  }

  const markItemReadyMutation = useMutation({
    mutationFn: async ({ orderId, itemName }: { orderId: string; itemName: string }) => {
      const response = await fetch(`/api/kds?orderId=${orderId}&itemName=${encodeURIComponent(itemName)}`, {
        method: "PUT",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to mark item as ready")
      }
      return response.json()
    },
    onSuccess: () => {
      // Refetch orders
      queryClient.invalidateQueries({ queryKey: ["kds-orders"] })
    },
  })

  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch("/api/kds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to complete order")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kds-orders"] })
      alert("Order completed!")
    },
  })

  const markItemReady = (orderId: string, itemName: string) => {
    markItemReadyMutation.mutate({ orderId, itemName })
  }

  const completeOrder = (orderId: string) => {
    if (confirm("Mark this order as complete?")) {
      completeOrderMutation.mutate(orderId)
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl md:text-3xl font-display font-medium tracking-tight text-primary mb-2">
          Kitchen Display System
        </h1>
        <p className="text-slate-600 font-sans">
          Real-time order management for kitchen operations
        </p>
      </div>

      {/* Station Filter */}
      <div className="flex gap-2 flex-wrap">
        {stations.map((station) => (
          <Button
            key={station}
            variant={selectedStation === station ? "default" : "outline"}
            onClick={() => setSelectedStation(station)}
            className="capitalize"
          >
            {station}
          </Button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="border-2 border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-display">{order.orderNumber}</CardTitle>
                  <CardDescription className="font-sans">{order.table}</CardDescription>
                </div>
                <Badge variant={order.status === "ready" ? "success" : "warning"}>
                  {order.status}
                </Badge>
              </div>
              <div className="text-xs text-slate-500 font-sans mt-1">
                {formatDateTime(order.placedAt.toISOString())}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-2 ${getStatusColor(item.status)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getItemStatusIcon(item.status)}
                      <span className="font-sans font-semibold">{item.name}</span>
                    </div>
                    <span className="font-sans font-bold">x{item.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-sans">Time: {item.time}</span>
                    {item.status === "preparing" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markItemReady(order.id, item.name)}
                        className="h-7 text-xs"
                        disabled={markItemReadyMutation.isPending}
                      >
                        {markItemReadyMutation.isPending ? "Updating..." : "Mark Ready"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {order.status === "ready" && (
                <Button
                  className="w-full"
                  variant="success"
                  onClick={() => completeOrder(order.id)}
                  disabled={completeOrderMutation.isPending}
                >
                  {completeOrderMutation.isPending ? "Completing..." : "Complete Order"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 font-sans">No active orders</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

