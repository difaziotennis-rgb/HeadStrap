"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Package, AlertTriangle, TrendingDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const mockInventory = [
  {
    id: "1",
    sku: "TENNIS-001",
    name: "Tennis Racket - Pro Model",
    category: "Pro Shop",
    currentStock: 15,
    minStock: 10,
    maxStock: 50,
    unitCost: 150.00,
    unitPrice: 199.99,
    supplier: "Wilson Sports",
    lastOrdered: "2024-01-10",
  },
  {
    id: "2",
    sku: "FOOD-001",
    name: "Chicken Breast (lb)",
    category: "F&B",
    currentStock: 45,
    minStock: 30,
    maxStock: 100,
    unitCost: 8.50,
    unitPrice: 0,
    supplier: "Local Farm",
    lastOrdered: "2024-01-19",
  },
  {
    id: "3",
    sku: "BEV-001",
    name: "Wine - Cabernet",
    category: "Beverage",
    currentStock: 8,
    minStock: 15,
    maxStock: 50,
    unitCost: 25.00,
    unitPrice: 45.00,
    supplier: "Wine Distributor",
    lastOrdered: "2024-01-15",
  },
  {
    id: "4",
    sku: "SHOP-001",
    name: "Tennis Balls (3-pack)",
    category: "Pro Shop",
    currentStock: 95,
    minStock: 50,
    maxStock: 200,
    unitCost: 8.00,
    unitPrice: 12.99,
    supplier: "Wilson Sports",
    lastOrdered: "2024-01-18",
  },
]

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const { data: inventory = mockInventory } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => mockInventory,
  })

  const categories = ["all", ...Array.from(new Set(inventory.map((item) => item.category)))]

  const filteredInventory = inventory.filter(
    (item) =>
      (selectedCategory === "all" || item.category === selectedCategory) &&
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const lowStockItems = filteredInventory.filter(
    (item) => item.currentStock <= item.minStock
  )

  const getStockStatus = (item: typeof mockInventory[0]) => {
    if (item.currentStock <= item.minStock) {
      return { variant: "destructive" as const, label: "Low Stock", icon: AlertTriangle }
    }
    if (item.currentStock >= item.maxStock * 0.9) {
      return { variant: "warning" as const, label: "High Stock", icon: TrendingDown }
    }
    return { variant: "success" as const, label: "In Stock", icon: Package }
  }

  const totalValue = filteredInventory.reduce(
    (sum, item) => sum + item.currentStock * item.unitCost,
    0
  )

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-display font-medium tracking-tight text-primary mb-2">
            Inventory Management
          </h1>
          <p className="text-slate-600 font-sans">
            Track stock levels, manage suppliers, and automate reordering
          </p>
        </div>
        <Button onClick={() => { setEditingItem(null); setIsDialogOpen(true) }} variant="luxury" className="gap-2 min-w-0">
          <Plus className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Add Item</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-primary">
              {filteredInventory.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-red-600">
              {lowStockItems.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-primary">
              {formatCurrency(totalValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-primary">
              {categories.length - 1}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="font-display text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700 font-sans mb-2">
              {lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""} below minimum stock level
            </p>
            <div className="flex gap-2 flex-wrap">
              {lowStockItems.slice(0, 5).map((item) => (
                <Badge key={item.id} variant="destructive">
                  {item.name} ({item.currentStock} left)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">All Inventory Items</CardTitle>
          <CardDescription className="font-sans">
            {filteredInventory.length} item{filteredInventory.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Min/Max</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => {
                const status = getStockStatus(item)
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm font-sans">{item.sku}</TableCell>
                    <TableCell className="font-sans font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="font-sans font-semibold">{item.currentStock}</TableCell>
                    <TableCell className="font-sans text-sm text-slate-600">
                      {item.minStock} / {item.maxStock}
                    </TableCell>
                    <TableCell className="font-sans">{formatCurrency(item.unitCost)}</TableCell>
                    <TableCell className="font-sans">
                      {item.unitPrice > 0 ? formatCurrency(item.unitPrice) : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingItem(item); setIsDialogOpen(true) }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}
            </DialogTitle>
          </DialogHeader>
          <InventoryForm
            item={editingItem}
            onClose={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InventoryForm({ item, onClose }: { item: any; onClose: () => void }) {
  const [formData, setFormData] = useState({
    sku: item?.sku || "",
    name: item?.name || "",
    category: item?.category || "Pro Shop",
    currentStock: item?.currentStock || 0,
    minStock: item?.minStock || 10,
    maxStock: item?.maxStock || 100,
    unitCost: item?.unitCost || 0,
    unitPrice: item?.unitPrice || 0,
    supplier: item?.supplier || "",
  })

  const queryClient = useQueryClient()

  const saveInventoryMutation = useMutation({
    mutationFn: async (itemData: any) => {
      // Mock API call - in production, create /api/inventory route
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { success: true, item: itemData }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      alert("Inventory item saved successfully!")
      onClose()
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to save inventory item")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveInventoryMutation.mutate({
      ...formData,
      currentStock: parseInt(formData.currentStock),
      minStock: parseInt(formData.minStock),
      maxStock: parseInt(formData.maxStock),
      unitCost: parseFloat(formData.unitCost),
      unitPrice: parseFloat(formData.unitPrice),
    })
  }

  const isSubmitting = saveInventoryMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pro Shop">Pro Shop</SelectItem>
              <SelectItem value="F&B">Food & Beverage</SelectItem>
              <SelectItem value="Beverage">Beverage</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Item Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currentStock">Current Stock</Label>
          <Input
            id="currentStock"
            type="number"
            value={formData.currentStock}
            onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minStock">Min Stock</Label>
          <Input
            id="minStock"
            type="number"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxStock">Max Stock</Label>
          <Input
            id="maxStock"
            type="number"
            value={formData.maxStock}
            onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unitCost">Unit Cost</Label>
          <Input
            id="unitCost"
            type="number"
            step="0.01"
            value={formData.unitCost}
            onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitPrice">Unit Price</Label>
          <Input
            id="unitPrice"
            type="number"
            step="0.01"
            value={formData.unitPrice}
            onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier">Supplier</Label>
        <Input
          id="supplier"
          value={formData.supplier}
          onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} className="min-w-0" disabled={isSubmitting}>
          <span className="truncate">Cancel</span>
        </Button>
        <Button type="submit" variant="luxury" className="min-w-0" disabled={isSubmitting}>
          <span className="truncate">{isSubmitting ? "Saving..." : item ? "Update Item" : "Add Item"}</span>
        </Button>
      </DialogFooter>
    </form>
  )
}

