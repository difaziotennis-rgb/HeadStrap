"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Gift, Percent, Star, Users } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const mockPrograms = [
  {
    id: "1",
    name: "Member Rewards",
    type: "points",
    description: "Earn points for every dollar spent",
    pointsPerDollar: 1,
    activeMembers: 1247,
    status: "active",
  },
  {
    id: "2",
    name: "Referral Bonus",
    type: "discount",
    description: "10% off for referring new members",
    discountPercent: 10,
    activeMembers: 342,
    status: "active",
  },
]

const mockVouchers = [
  {
    id: "1",
    code: "WELCOME2024",
    type: "percentage",
    value: 20,
    description: "20% off first purchase",
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    uses: 45,
    maxUses: 100,
    status: "active",
  },
  {
    id: "2",
    code: "TENNIS50",
    type: "fixed",
    value: 50,
    description: "$50 off tennis lessons",
    validFrom: "2024-01-15",
    validTo: "2024-03-31",
    uses: 12,
    maxUses: 50,
    status: "active",
  },
]

export default function LoyaltyPage() {
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false)
  const [isVoucherDialogOpen, setIsVoucherDialogOpen] = useState(false)

  const { data: programs = mockPrograms } = useQuery({
    queryKey: ["loyaltyPrograms"],
    queryFn: async () => mockPrograms,
  })

  const { data: vouchers = mockVouchers } = useQuery({
    queryKey: ["vouchers"],
    queryFn: async () => mockVouchers,
  })

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-display font-medium tracking-tight text-primary mb-2">
            Loyalty & Discounts
          </h1>
          <p className="text-slate-600 font-sans">
            Manage loyalty programs, vouchers, and member discounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsVoucherDialogOpen(true)} variant="outline" className="gap-2 min-w-0">
            <Gift className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">New Voucher</span>
          </Button>
          <Button onClick={() => setIsProgramDialogOpen(true)} variant="luxury" className="gap-2 min-w-0">
            <Plus className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">New Program</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Star className="h-5 w-5 text-gold" />
              Active Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-primary">
              {programs.filter((p) => p.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Gift className="h-5 w-5 text-slate-700" />
              Active Vouchers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-primary">
              {vouchers.filter((v) => v.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Users className="h-5 w-5 text-gold" />
              Enrolled Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-primary">
              {programs.reduce((sum, p) => sum + p.activeMembers, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loyalty Programs */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Loyalty Programs</CardTitle>
          <CardDescription className="font-sans">
            {programs.length} program{programs.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {programs.map((program) => (
              <div
                key={program.id}
                className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-sans font-semibold text-lg">{program.name}</h3>
                      <Badge variant={program.status === "active" ? "success" : "default"}>
                        {program.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 font-sans mb-2">{program.description}</p>
                    <div className="flex items-center gap-4 text-sm font-sans">
                      {program.type === "points" && (
                        <span className="text-slate-600">
                          {program.pointsPerDollar} point{program.pointsPerDollar !== 1 ? "s" : ""} per dollar
                        </span>
                      )}
                      {program.type === "discount" && (
                        <span className="text-slate-600">
                          {program.discountPercent}% discount
                        </span>
                      )}
                      <span className="text-slate-600">
                        {program.activeMembers} enrolled
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      alert(`Manage ${program.name} - Edit program settings, view enrolled members, etc.`)
                    }}
                  >
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vouchers */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Vouchers & Promo Codes</CardTitle>
          <CardDescription className="font-sans">
            {vouchers.length} voucher{vouchers.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Valid Period</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell className="font-mono font-sans font-semibold">
                    {voucher.code}
                  </TableCell>
                  <TableCell className="font-sans">{voucher.description}</TableCell>
                  <TableCell className="font-sans">
                    {voucher.type === "percentage" ? (
                      <span className="flex items-center gap-1">
                        <Percent className="h-4 w-4" />
                        {voucher.value}%
                      </span>
                    ) : (
                      formatCurrency(voucher.value)
                    )}
                  </TableCell>
                  <TableCell className="font-sans text-sm">
                    {voucher.validFrom} to {voucher.validTo}
                  </TableCell>
                  <TableCell className="font-sans">
                    {voucher.uses} / {voucher.maxUses}
                  </TableCell>
                  <TableCell>
                    <Badge variant={voucher.status === "active" ? "success" : "default"}>
                      {voucher.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        alert(`Edit voucher ${voucher.code} - Update voucher settings`)
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Loyalty Program</DialogTitle>
          </DialogHeader>
          <LoyaltyProgramForm onClose={() => setIsProgramDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isVoucherDialogOpen} onOpenChange={setIsVoucherDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Voucher</DialogTitle>
          </DialogHeader>
          <VoucherForm onClose={() => setIsVoucherDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LoyaltyProgramForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    type: "points",
    description: "",
    pointsPerDollar: 1,
    discountPercent: 10,
  })

  const queryClient = useQueryClient()

  const createProgramMutation = useMutation({
    mutationFn: async (programData: any) => {
      // Mock API call - in production, create /api/loyalty/programs route
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { success: true, program: { id: Date.now().toString(), ...programData } }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyaltyPrograms"] })
      alert("Loyalty program created successfully!")
      onClose()
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to create program")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createProgramMutation.mutate(formData)
  }

  const isSubmitting = createProgramMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Program Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Program Type</Label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="points">Points Based</option>
          <option value="discount">Discount Based</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          required
        />
      </div>

      {formData.type === "points" && (
        <div className="space-y-2">
          <Label htmlFor="pointsPerDollar">Points Per Dollar</Label>
          <Input
            id="pointsPerDollar"
            type="number"
            value={formData.pointsPerDollar}
            onChange={(e) => setFormData({ ...formData, pointsPerDollar: parseInt(e.target.value) })}
            required
          />
        </div>
      )}

      {formData.type === "discount" && (
        <div className="space-y-2">
          <Label htmlFor="discountPercent">Discount Percentage</Label>
          <Input
            id="discountPercent"
            type="number"
            value={formData.discountPercent}
            onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) })}
            required
          />
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} className="min-w-0" disabled={isSubmitting}>
          <span className="truncate">Cancel</span>
        </Button>
        <Button type="submit" variant="luxury" className="min-w-0" disabled={isSubmitting}>
          <span className="truncate">{isSubmitting ? "Creating..." : "Create Program"}</span>
        </Button>
      </DialogFooter>
    </form>
  )
}

function VoucherForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    code: "",
    type: "percentage",
    value: "",
    description: "",
    validFrom: "",
    validTo: "",
    maxUses: "",
  })

  const queryClient = useQueryClient()

  const createVoucherMutation = useMutation({
    mutationFn: async (voucherData: any) => {
      // Mock API call - in production, create /api/loyalty/vouchers route
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { success: true, voucher: { id: Date.now().toString(), ...voucherData } }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] })
      alert("Voucher created successfully!")
      onClose()
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to create voucher")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createVoucherMutation.mutate(formData)
  }

  const isSubmitting = createVoucherMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Voucher Code</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          placeholder="WELCOME2024"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="value">Value</Label>
          <Input
            id="value"
            type="number"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            placeholder={formData.type === "percentage" ? "20" : "50"}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="validFrom">Valid From</Label>
          <Input
            id="validFrom"
            type="date"
            value={formData.validFrom}
            onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="validTo">Valid To</Label>
          <Input
            id="validTo"
            type="date"
            value={formData.validTo}
            onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxUses">Maximum Uses</Label>
        <Input
          id="maxUses"
          type="number"
          value={formData.maxUses}
          onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
          required
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} className="min-w-0" disabled={isSubmitting}>
          <span className="truncate">Cancel</span>
        </Button>
        <Button type="submit" variant="luxury" className="min-w-0" disabled={isSubmitting}>
          <span className="truncate">{isSubmitting ? "Creating..." : "Create Voucher"}</span>
        </Button>
      </DialogFooter>
    </form>
  )
}

