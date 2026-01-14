"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { LuxuryPOS } from "@/components/pos/luxury-pos"

const mockPOSItems = [
  // Starters
  { id: "1", name: "Caesar Salad", category: "Starters", price: 16.00, isFood: true },
  { id: "2", name: "Soup du Jour", category: "Starters", price: 12.00, isFood: true },
  { id: "3", name: "Shrimp Cocktail", category: "Starters", price: 18.00, isFood: true },
  
  // Mains
  { id: "4", name: "Grilled Salmon", category: "Mains", price: 34.00, isFood: true },
  { id: "5", name: "Filet Mignon", category: "Mains", price: 42.00, isFood: true },
  { id: "6", name: "Chicken Milanese", category: "Mains", price: 28.00, isFood: true },
  { id: "7", name: "Pasta Primavera", category: "Mains", price: 24.00, isFood: true },
  
  // Drinks
  { id: "8", name: "House Wine", category: "Drinks", price: 12.00 },
  { id: "9", name: "Premium Wine", category: "Drinks", price: 45.00 },
  { id: "10", name: "Cocktail - Old Fashioned", category: "Drinks", price: 16.00 },
  { id: "11", name: "Cocktail - Martini", category: "Drinks", price: 16.00 },
  { id: "12", name: "Beer - Craft", category: "Drinks", price: 8.00 },
  
  // Tennis Gear
  { id: "13", name: "Tennis Racket", category: "Tennis Gear", price: 199.99 },
  { id: "14", name: "Tennis Balls (3-pack)", category: "Tennis Gear", price: 12.99 },
  { id: "15", name: "Tennis Shoes", category: "Tennis Gear", price: 129.99 },
  
  // Apparel
  { id: "16", name: "Club Logo Polo", category: "Apparel", price: 89.99 },
  { id: "17", name: "Club Windbreaker", category: "Apparel", price: 125.00 },
  
  // Lessons
  { id: "18", name: "Tennis Lesson (1hr)", category: "Lessons", price: 75.00 },
]

export default function POSPage() {
  const queryClient = useQueryClient()
  const [showSuccess, setShowSuccess] = useState(false)

  const { data: items = mockPOSItems } = useQuery({
    queryKey: ["posItems"],
    queryFn: async () => mockPOSItems,
  })

  const settleMutation = useMutation({
    mutationFn: async (sale: any) => {
      const response = await fetch("/api/pos/settle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sale),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to settle transaction")
      }

      return response.json()
    },
    onSuccess: () => {
      setShowSuccess(true)
      queryClient.invalidateQueries({ queryKey: ["members"] })
      setTimeout(() => setShowSuccess(false), 3000)
    },
  })

  const handleProcessSale = async (sale: {
    items: any[]
    memberId?: string
    paymentMethod: string
    gratuity?: number
    discount?: number
  }) => {
    settleMutation.mutate(sale)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
        <h1 className="text-2xl font-display font-medium tracking-tight text-primary mb-1">
          Point of Sale Terminal
        </h1>
        <p className="text-slate-600 font-sans text-sm">
          Luxury POS for iPad/Tablet use
        </p>
      </div>

      {/* Success/Error Messages */}
      {showSuccess && (
        <div className="px-6 py-3 bg-green-50 border-b border-green-200 flex-shrink-0">
          <p className="text-green-800 font-sans font-medium">
            ✓ Transaction settled successfully!
          </p>
        </div>
      )}

      {settleMutation.isError && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex-shrink-0">
          <p className="text-red-800 font-sans font-medium">
            Error: {settleMutation.error?.message || "Failed to settle transaction"}
          </p>
        </div>
      )}

      {/* Luxury POS Interface */}
      <div className="flex-1 overflow-hidden">
        <LuxuryPOS items={items} onProcessSale={handleProcessSale} />
      </div>
    </div>
  )
}
