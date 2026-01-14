"use client"

import { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Search, 
  Plus, 
  Minus, 
  X, 
  DollarSign, 
  User, 
  Crown,
  Printer,
  Scissors,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface POSItem {
  id: string
  name: string
  category: string
  price: number
  stock?: number
  isFood?: boolean
}

interface CartItem {
  item: POSItem
  quantity: number
  modifiers: string[]
  notes: string
  kitchenStatus?: "pending" | "sent" | "completed"
}

interface Member {
  id: string
  memberNumber: number
  firstName: string
  lastName: string
  email: string
  houseAccountLimit: number
  houseAccountBalance?: number
  tier: string
  isVIP?: boolean
  isBoardMember?: boolean
  photo?: string
}

interface LuxuryPOSProps {
  items: POSItem[]
  onProcessSale: (sale: {
    items: CartItem[]
    memberId?: string
    paymentMethod: string
    gratuity?: number
    discount?: number
  }) => Promise<void>
}

const GRATUITY_OPTIONS = [0.18, 0.20, 0.22]

export function LuxuryPOS({ items, onProcessSale }: LuxuryPOSProps) {
  const queryClient = useQueryClient()
  const [settleMutationState, setSettleMutationState] = useState({ isPending: false })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [memberSearch, setMemberSearch] = useState("")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  const [editingItem, setEditingItem] = useState<CartItem | null>(null)
  const [isModifierDialogOpen, setIsModifierDialogOpen] = useState(false)
  const [gratuityPercent, setGratuityPercent] = useState(0.18)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [itemModifiers, setItemModifiers] = useState<string[]>([])
  const [itemNotes, setItemNotes] = useState("")

  // Search members via API
  const { data: memberSearchResults = [], isLoading: isSearchingMembers } = useQuery({
    queryKey: ["members", "search", memberSearch || "all"],
    queryFn: async () => {
      const searchQuery = memberSearch && memberSearch.length >= 2 ? memberSearch : ""
      const response = await fetch(`/api/members/search?q=${encodeURIComponent(searchQuery || "")}`)
      if (!response.ok) return []
      const data = await response.json()
      return (data.members || []).map((m: any) => ({
        ...m,
        houseAccountBalance: 0, // Will be fetched separately
        isVIP: m.tier === "FULL_GOLF" || m.tier === "HONORARY",
        isBoardMember: false, // Would come from database
      }))
    },
    enabled: showMemberDropdown,
  })

  const categories = ["all", ...Array.from(new Set(items.map((item) => item.category)))]

  const filteredItems = items.filter(
    (item) =>
      (selectedCategory === "all" || item.category === item.category) &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addToCart = useCallback((item: POSItem) => {
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.item.id === item.id && cartItem.modifiers.length === 0 && !cartItem.notes)
      if (existing) {
        // Quick add - increment quantity
        return prev.map((cartItem) =>
          cartItem.item.id === item.id && cartItem.modifiers.length === 0 && !cartItem.notes
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      }
      // New item - open modifier dialog for food items
      if (item.isFood) {
        setEditingItem({ item, quantity: 1, modifiers: [], notes: "", kitchenStatus: "pending" })
        setIsModifierDialogOpen(true)
        return prev
      }
      return [...prev, { item, quantity: 1, modifiers: [], notes: "", kitchenStatus: "pending" }]
    })
  }, [])

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const newCart = [...prev]
      newCart[index].quantity = Math.max(0, newCart[index].quantity + delta)
      return newCart.filter((item) => item.quantity > 0)
    })
  }

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddWithModifiers = () => {
    if (editingItem) {
      setCart((prev) => [...prev, { ...editingItem, modifiers: itemModifiers, notes: itemNotes }])
      setIsModifierDialogOpen(false)
      setEditingItem(null)
      setItemModifiers([])
      setItemNotes("")
    }
  }

  const subtotal = cart.reduce((sum, cartItem) => sum + cartItem.item.price * cartItem.quantity, 0)
  const discount = discountAmount
  const subtotalAfterDiscount = subtotal - discount
  const gratuity = subtotalAfterDiscount * gratuityPercent
  const tax = subtotalAfterDiscount * 0.08
  const total = subtotalAfterDiscount + gratuity + tax

  const memberBalance = selectedMember?.houseAccountBalance || 0
  const memberLimit = selectedMember?.houseAccountLimit || 5000
  const wouldExceedLimit = selectedMember && (memberBalance + total) > memberLimit

  const handleSettle = async () => {
    if (!selectedMember) {
      alert("Please select a member first")
      return
    }

    setSettleMutationState({ isPending: true })
    try {
      await onProcessSale({
        items: cart,
        memberId: selectedMember.id,
        paymentMethod: "house_account",
        gratuity,
        discount: discountAmount,
      })

      // Reset cart after successful settlement
      setCart([])
      setDiscountAmount(0)
      setGratuityPercent(0.18)
      setSelectedMember(null)
      setMemberSearch("")
    } catch (error) {
      console.error("Failed to settle:", error)
    } finally {
      setSettleMutationState({ isPending: false })
    }
  }

  const handlePrintChit = () => {
    window.print()
  }

  const handleSplitCheck = () => {
    // TODO: Implement split check functionality
    alert("Split check feature coming soon")
  }

  const handleApplyDiscount = () => {
    const discount = prompt("Enter discount amount:")
    if (discount) {
      setDiscountAmount(parseFloat(discount) || 0)
    }
  }

  const sendToKitchen = (index: number) => {
    setCart((prev) => {
      const newCart = [...prev]
      newCart[index].kitchenStatus = "sent"
      return newCart
    })
  }

  return (
    <div className="h-full flex gap-4 bg-slate-50 p-4 overflow-hidden">
      {/* Left Side - Menu (60%) */}
      <div className="w-[60%] flex flex-col bg-[#F8F8F8] rounded-lg p-4">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base bg-white border-slate-300"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="lg"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap text-base px-6 py-3"
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>

        {/* Item Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-xl transition-all duration-200 bg-white border-slate-200 rounded-xl overflow-hidden"
                onClick={() => addToCart(item)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <p className="font-sans font-semibold text-sm text-primary mb-1 truncate">
                    {item.name}
                  </p>
                  <p className="font-display font-medium text-lg text-primary">
                    {formatCurrency(item.price)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Ticket (40%) */}
      <div className="w-[40%] flex flex-col bg-white rounded-lg shadow-lg relative overflow-hidden">
        {/* Member Search Section */}
        <div className="p-4 border-b border-slate-200 bg-white flex-shrink-0">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search member..."
              value={memberSearch}
              onChange={(e) => {
                setMemberSearch(e.target.value)
                setShowMemberDropdown(true)
              }}
              onFocus={() => setShowMemberDropdown(true)}
              className="pl-10 h-12 text-base"
            />
          </div>

          {/* Member Dropdown */}
          {showMemberDropdown && !selectedMember && (
            <div className="absolute z-50 left-4 right-4 mt-1 border border-slate-200 rounded-lg bg-white shadow-xl max-h-64 overflow-y-auto" style={{ maxWidth: 'calc(40% - 2rem)' }}>
              {isSearchingMembers ? (
                <div className="p-4 text-center text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  Searching...
                </div>
              ) : memberSearchResults.length > 0 ? (
                memberSearchResults.map((member: any) => (
                  <div
                    key={member.id}
                    className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                    onClick={() => {
                      setSelectedMember(member)
                      setMemberSearch("")
                      setShowMemberDropdown(false)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-sans font-medium text-sm text-primary truncate">
                            {member.name}
                          </p>
                          {member.isVIP && (
                            <Crown className="h-4 w-4 text-gold flex-shrink-0" />
                          )}
                          {member.isBoardMember && (
                            <Badge variant="outline" className="text-xs flex-shrink-0">Board</Badge>
                          )}
                        </div>
                        <p className="font-sans text-xs text-slate-500 truncate">
                          M-{member.memberNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500 text-sm">
                  No members found
                </div>
              )}
            </div>
          )}

          {/* Selected Member Display */}
          {selectedMember && (
            <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {selectedMember.photo ? (
                    <img src={selectedMember.photo} alt={selectedMember.firstName} className="h-12 w-12 rounded-full" />
                  ) : (
                    <User className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-sans font-semibold text-sm text-primary truncate">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </p>
                    {selectedMember.isVIP && (
                      <Crown className="h-4 w-4 text-gold flex-shrink-0" />
                    )}
                    {selectedMember.isBoardMember && (
                      <Badge variant="outline" className="text-xs">Board</Badge>
                    )}
                  </div>
                  <p className="font-sans text-xs text-slate-600">
                    M-{selectedMember.memberNumber}
                  </p>
                  <p className="font-sans text-xs text-slate-500 mt-1">
                    House Account: {formatCurrency(memberBalance)} / {formatCurrency(memberLimit)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedMember(null)
                    setMemberSearch("")
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Ticket Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-sans">
              <p className="text-lg mb-2">Empty Ticket</p>
              <p className="text-sm">Add items from the menu</p>
            </div>
          ) : (
            cart.map((cartItem, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  cartItem.kitchenStatus === "sent"
                    ? "bg-green-50 border-green-200"
                    : cartItem.kitchenStatus === "completed"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-sans font-semibold text-sm text-primary truncate">
                        {cartItem.item.name} × {cartItem.quantity}
                      </p>
                      {cartItem.kitchenStatus === "sent" && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                    {cartItem.modifiers.length > 0 && (
                      <p className="font-sans text-xs text-slate-600 mb-1 break-words">
                        {cartItem.modifiers.join(", ")}
                      </p>
                    )}
                    {cartItem.notes && (
                      <p className="font-sans text-xs text-slate-500 italic break-words">
                        Note: {cartItem.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateQuantity(index, -1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateQuantity(index, 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-sans font-medium text-sm text-primary">
                    {formatCurrency(cartItem.item.price * cartItem.quantity)}
                  </p>
                  {cartItem.item.isFood && cartItem.kitchenStatus === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendToKitchen(index)}
                      className="text-xs whitespace-nowrap flex-shrink-0"
                    >
                      Send to Kitchen
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-2 flex-shrink-0">
          <div className="flex justify-between text-sm font-sans">
            <span className="text-slate-600">Subtotal:</span>
            <span className="text-primary font-medium">{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm font-sans text-green-600">
              <span>Discount:</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          {gratuity > 0 && (
            <div className="flex justify-between text-sm font-sans gap-2">
              <span className="flex-1 min-w-0">Service Charge ({Math.round(gratuityPercent * 100)}%):</span>
              <span className="text-primary whitespace-nowrap">{formatCurrency(gratuity)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-sans">
            <span className="text-slate-600">Tax:</span>
            <span className="text-primary">{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between font-display font-bold text-xl border-t-2 border-slate-300 pt-2">
            <span className="text-primary">Total:</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-2 flex-shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrintChit}
              className="gap-2 min-w-0"
            >
              <Printer className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Print Chit</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleSplitCheck}
              className="gap-2 min-w-0"
            >
              <Scissors className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Split Check</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleApplyDiscount}
              className="gap-2 min-w-0"
            >
              <Tag className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Discount</span>
            </Button>
            <div className="flex gap-1">
              {GRATUITY_OPTIONS.map((percent) => (
                <Button
                  key={percent}
                  variant={gratuityPercent === percent ? "default" : "outline"}
                  size="lg"
                  onClick={() => setGratuityPercent(percent)}
                  className="flex-1 text-xs min-w-0"
                >
                  <span className="truncate">{Math.round(percent * 100)}%</span>
                </Button>
              ))}
            </div>
          </div>
          
          {selectedMember && (
            <Button
              className={`w-full h-14 text-lg font-semibold gap-2 min-w-0 ${
                wouldExceedLimit
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-[#1B4332] hover:bg-[#1B4332]/90 text-white"
              }`}
              onClick={handleSettle}
              disabled={cart.length === 0 || settleMutationState.isPending}
            >
              {settleMutationState.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
                  <span className="truncate">Processing...</span>
                </>
              ) : wouldExceedLimit ? (
                <>
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">Limit Exceeded</span>
                </>
              ) : (
                <>
                  <DollarSign className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">Settle to Account</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Modifier Dialog */}
      <Dialog open={isModifierDialogOpen} onOpenChange={setIsModifierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editingItem?.item.name}
            </DialogTitle>
            <DialogDescription className="font-sans">
              Add modifiers or notes for this item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Modifiers */}
            <div className="space-y-2">
              <label className="text-sm font-sans font-medium">Modifiers</label>
              <div className="grid grid-cols-2 gap-2">
                {["Medium Rare", "No Onions", "Extra Cheese", "No Tomatoes", "Gluten Free"].map((mod) => (
                  <Button
                    key={mod}
                    variant={itemModifiers.includes(mod) ? "default" : "outline"}
                    onClick={() => {
                      setItemModifiers((prev) =>
                        prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
                      )
                    }}
                    className="text-sm"
                  >
                    {mod}
                  </Button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-sans font-medium">Order Notes</label>
              <Input
                placeholder="Special instructions..."
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                className="font-sans"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModifierDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWithModifiers} variant="default">
              Add to Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

