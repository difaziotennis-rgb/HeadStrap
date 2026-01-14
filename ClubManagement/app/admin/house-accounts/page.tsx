"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, DollarSign, CreditCard, User } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

const mockHouseAccounts = [
  {
    id: "1",
    memberName: "John Smith",
    memberNumber: "M-2024-0001",
    currentBalance: 1250.50,
    creditLimit: 5000.00,
    lastTransaction: "2024-01-19",
    status: "active",
  },
  {
    id: "2",
    memberName: "Sarah Johnson",
    memberNumber: "M-2024-0002",
    currentBalance: 0,
    creditLimit: 3000.00,
    lastTransaction: "2024-01-15",
    status: "active",
  },
  {
    id: "3",
    memberName: "Michael Chen",
    memberNumber: "M-2024-0003",
    currentBalance: 450.25,
    creditLimit: 2000.00,
    lastTransaction: "2024-01-18",
    status: "active",
  },
]

const mockTransactions = [
  {
    id: "1",
    memberName: "John Smith",
    type: "charge",
    description: "Pro Shop - Tennis Racket",
    amount: 199.99,
    date: "2024-01-19",
  },
  {
    id: "2",
    memberName: "John Smith",
    type: "charge",
    description: "Restaurant - Dinner",
    amount: 125.50,
    date: "2024-01-18",
  },
  {
    id: "3",
    memberName: "John Smith",
    type: "payment",
    description: "Payment Received",
    amount: -500.00,
    date: "2024-01-17",
  },
]

export default function HouseAccountsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isChargeDialogOpen, setIsChargeDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)

  const { data: accounts = mockHouseAccounts } = useQuery({
    queryKey: ["houseAccounts"],
    queryFn: async () => mockHouseAccounts,
  })

  const { data: transactions = mockTransactions } = useQuery({
    queryKey: ["houseAccountTransactions"],
    queryFn: async () => mockTransactions,
  })

  const filteredAccounts = accounts.filter(
    (account) =>
      account.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.memberNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalOutstanding = accounts.reduce(
    (sum, account) => sum + account.currentBalance,
    0
  )

  const handleChargeAccount = (member: any) => {
    setSelectedMember(member)
    setIsChargeDialogOpen(true)
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-display font-medium tracking-tight text-primary mb-2">
            House Accounts
          </h1>
          <p className="text-slate-600 font-sans">
            Manage member house accounts and charges
          </p>
        </div>
        <Button onClick={() => setIsChargeDialogOpen(true)} variant="luxury" className="gap-2 min-w-0">
          <Plus className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Charge Account</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-primary">
              {formatCurrency(totalOutstanding)}
            </div>
            <p className="text-sm text-slate-600 font-sans mt-1">
              Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Active Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-slate-700">
              {accounts.filter((a) => a.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Average Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-gold">
              {formatCurrency(
                accounts.length > 0
                  ? totalOutstanding / accounts.length
                  : 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by member name or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">House Account Balances</CardTitle>
          <CardDescription className="font-sans">
            {filteredAccounts.length} account{filteredAccounts.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Member #</TableHead>
                <TableHead>Current Balance</TableHead>
                <TableHead>Credit Limit</TableHead>
                <TableHead>Last Transaction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gold" />
                      <span className="font-sans font-medium">{account.memberName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-sans">{account.memberNumber}</TableCell>
                  <TableCell className="font-sans font-semibold">
                    {formatCurrency(account.currentBalance)}
                  </TableCell>
                  <TableCell className="font-sans">
                    {formatCurrency(account.creditLimit)}
                  </TableCell>
                  <TableCell className="font-sans">
                    {formatDate(account.lastTransaction)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.status === "active" ? "success" : "default"}>
                      {account.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleChargeAccount(account)}
                      >
                        Charge
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/members/${account.id}`)
                            if (response.ok) {
                              const data = await response.json()
                              alert(`Member Details:\nName: ${data.member.firstName} ${data.member.lastName}\nMember #: M-${data.member.memberNumber}\nBalance: ${formatCurrency(account.currentBalance)}\nLimit: ${formatCurrency(account.creditLimit)}`)
                            }
                          } catch (error) {
                            alert("Failed to fetch member details")
                          }
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-sans">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell className="font-sans">{transaction.memberName}</TableCell>
                  <TableCell className="font-sans">{transaction.description}</TableCell>
                  <TableCell
                    className={`text-right font-sans font-semibold ${
                      transaction.amount < 0 ? "text-slate-700" : "text-primary"
                    }`}
                  >
                    {transaction.amount < 0 ? "-" : "+"}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charge Account Dialog */}
      <Dialog open={isChargeDialogOpen} onOpenChange={setIsChargeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Charge House Account</DialogTitle>
            <DialogDescription>
              Add a charge to a member's house account
            </DialogDescription>
          </DialogHeader>
          <ChargeAccountForm
            member={selectedMember}
            onClose={() => {
              setIsChargeDialogOpen(false)
              setSelectedMember(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ChargeAccountForm({ member, onClose }: { member: any; onClose: () => void }) {
  const [formData, setFormData] = useState({
    memberNumber: member?.memberNumber || "",
    amount: "",
    description: "",
    category: "POS_PURCHASE",
  })

  const queryClient = useQueryClient()

  const chargeAccountMutation = useMutation({
    mutationFn: async (chargeData: any) => {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chargeData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to charge account")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["houseAccounts"] })
      queryClient.invalidateQueries({ queryKey: ["houseAccountTransactions"] })
      alert("Account charged successfully!")
      onClose()
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to charge account")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    chargeAccountMutation.mutate({
      memberNumber: formData.memberNumber,
      amount: formData.amount,
      description: formData.description,
      category: formData.category,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="memberNumber">Member Number</Label>
        <Input
          id="memberNumber"
          value={formData.memberNumber}
          onChange={(e) => setFormData({ ...formData, memberNumber: e.target.value })}
          placeholder="M-2024-0001"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g., Pro Shop - Tennis Racket"
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
            <SelectItem value="POS_PURCHASE">POS Purchase</SelectItem>
            <SelectItem value="DUES">Membership Dues</SelectItem>
            <SelectItem value="EVENT">Event Registration</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} className="min-w-0" disabled={chargeAccountMutation.isPending}>
          <span className="truncate">Cancel</span>
        </Button>
        <Button type="submit" variant="luxury" className="min-w-0" disabled={chargeAccountMutation.isPending}>
          <span className="truncate">{chargeAccountMutation.isPending ? "Charging..." : "Charge Account"}</span>
        </Button>
      </DialogFooter>
    </form>
  )
}

