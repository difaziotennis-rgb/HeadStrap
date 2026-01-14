"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Plus, Minus, ShoppingCart, CreditCard, DollarSign, X } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface POSItem {
  id: string
  name: string
  category: string
  price: number
  stock?: number
}

interface CartItem {
  item: POSItem
  quantity: number
}

interface Member {
  id: string
  memberNumber: number
  firstName: string
  lastName: string
  email: string
  houseAccountLimit: number
}

interface POSInterfaceProps {
  items: POSItem[]
  onProcessSale: (sale: { items: CartItem[]; memberId?: string; paymentMethod: string }) => Promise<void>
}

export function POSInterface({ items, onProcessSale }: POSInterfaceProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [memberSearch, setMemberSearch] = useState("")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("house_account")

  const categories = ["all", ...Array.from(new Set(items.map((item) => item.category)))]

  const filteredItems = items.filter(
    (item) =>
      (selectedCategory === "all" || item.category === selectedCategory) &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Mock member search
  const searchMembers = (query: string): Member[] => {
    if (!query) return []
    // Mock data - replace with API call
    return [
      {
        id: "1",
        memberNumber: 2024001,
        firstName: "John",
        lastName: "Smith",
        email: "john@example.com",
        houseAccountLimit: 5000.0,
      },
    ].filter(
      (m) =>
        m.firstName.toLowerCase().includes(query.toLowerCase()) ||
        m.lastName.toLowerCase().includes(query.toLowerCase()) ||
        m.memberNumber.toString().includes(query)
    )
  }

  const searchResults = searchMembers(memberSearch)

  const addToCart = (item: POSItem) => {
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.item.id === item.id)
      if (existing) {
        return prev.map((cartItem) =>
          cartItem.item.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      }
      return [...prev, { item, quantity: 1 }]
    })
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((cartItem) =>
          cartItem.item.id === itemId
            ? { ...cartItem, quantity: Math.max(0, cartItem.quantity + delta) }
            : cartItem
        )
        .filter((cartItem) => cartItem.quantity > 0)
    )
  }

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((cartItem) => cartItem.item.id !== itemId))
  }

  const subtotal = cart.reduce((sum, cartItem) => sum + cartItem.item.price * cartItem.quantity, 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  const handleProcessPayment = async () => {
    await onProcessSale({
      items: cart,
      memberId: selectedMember?.id,
      paymentMethod,
    })
    setCart([])
    setSelectedMember(null)
    setIsPaymentDialogOpen(false)
  }

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Left Side - Category Grid */}
      <div className="flex-1 flex flex-col">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => addToCart(item)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-slate-100 rounded-lg mb-2 flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="font-sans font-medium text-sm text-primary truncate mb-1">
                    {item.name}
                  </p>
                  <p className="font-sans font-medium text-primary">
                    {formatCurrency(item.price)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Current Ticket */}
      <div className="w-96 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="font-display text-lg">Current Ticket</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {/* Member Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search member by name or number..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {memberSearch && searchResults.length > 0 && (
                <div className="mt-2 border border-slate-200 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                      onClick={() => {
                        setSelectedMember(member)
                        setMemberSearch("")
                      }}
                    >
                      <p className="font-sans font-medium text-sm text-primary">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="font-sans text-xs text-slate-500">
                        M-{member.memberNumber}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {selectedMember && (
                <div className="mt-2 p-3 bg-primary/10 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-sans font-medium text-sm text-primary">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </p>
                    <p className="font-sans text-xs text-slate-600">
                      M-{selectedMember.memberNumber}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMember(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-500 font-sans text-sm">
                  Cart is empty
                </div>
              ) : (
                cart.map((cartItem) => (
                  <div
                    key={cartItem.item.id}
                    className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-medium text-sm text-primary truncate">
                        {cartItem.item.name}
                      </p>
                      <p className="font-sans text-xs text-slate-600">
                        {formatCurrency(cartItem.item.price)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(cartItem.item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-sans font-medium text-sm w-8 text-center">
                        {cartItem.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(cartItem.item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(cartItem.item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-slate-200 pt-4 space-y-2 mb-4">
              <div className="flex justify-between text-sm font-sans">
                <span className="text-slate-600">Subtotal:</span>
                <span className="text-primary">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-sans">
                <span className="text-slate-600">Tax:</span>
                <span className="text-primary">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between font-sans font-medium text-lg border-t border-slate-200 pt-2">
                <span className="text-primary">Total:</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
            <Button
              className="w-full"
              variant="default"
              size="lg"
              onClick={() => setIsPaymentDialogOpen(true)}
              disabled={cart.length === 0}
            >
                <CreditCard className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
              {selectedMember && (
                <Button
                  className="w-full"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setPaymentMethod("house_account")
                    handleProcessPayment()
                  }}
                  disabled={cart.length === 0}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Charge to House Account
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Total: {formatCurrency(total)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-sans font-medium">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={paymentMethod === "credit_card" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("credit_card")}
                >
                  Credit Card
                </Button>
                <Button
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("cash")}
                >
                  Cash
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleProcessPayment}>
              Process Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

