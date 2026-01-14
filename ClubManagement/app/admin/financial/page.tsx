"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DollarSign, FileText, CreditCard, TrendingUp, Search, Download, Calendar } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

const mockStatements = [
  {
    id: "1",
    memberName: "John Smith",
    memberNumber: "M-2024-0001",
    statementDate: "2024-01-01",
    dueDate: "2024-01-15",
    openingBalance: 1250.50,
    closingBalance: 1850.50,
    isPaid: false,
  },
  {
    id: "2",
    memberName: "Sarah Johnson",
    memberNumber: "M-2024-0002",
    statementDate: "2024-01-01",
    dueDate: "2024-01-15",
    openingBalance: 0,
    closingBalance: 450.00,
    isPaid: true,
    paidAt: "2024-01-10",
  },
]

const mockTransactions = [
  {
    id: "1",
    memberName: "John Smith",
    type: "DUES",
    description: "Monthly Membership Dues",
    amount: 600.00,
    date: "2024-01-01",
  },
  {
    id: "2",
    memberName: "John Smith",
    type: "POS_PURCHASE",
    description: "Pro Shop - Tennis Racket",
    amount: 199.99,
    date: "2024-01-05",
  },
  {
    id: "3",
    memberName: "Sarah Johnson",
    type: "PAYMENT",
    description: "Payment Received",
    amount: -450.00,
    date: "2024-01-10",
  },
]

const mockPayments = [
  {
    id: "1",
    memberName: "Sarah Johnson",
    memberNumber: "M-2024-0002",
    amount: 450.00,
    method: "CREDIT_CARD",
    processedAt: "2024-01-10T10:30:00",
    referenceNumber: "STRIPE-123456",
  },
  {
    id: "2",
    memberName: "Michael Chen",
    memberNumber: "M-2024-0003",
    amount: 1200.00,
    method: "ACH",
    processedAt: "2024-01-12T14:20:00",
    referenceNumber: "ACH-789012",
  },
]

export default function FinancialPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

  const { data: statements = mockStatements } = useQuery({
    queryKey: ["statements"],
    queryFn: async () => mockStatements,
  })

  const { data: transactions = mockTransactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => mockTransactions,
  })

  const { data: payments = mockPayments } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => mockPayments,
  })

  const totalOutstanding = statements
    .filter((s) => !s.isPaid)
    .reduce((sum, s) => sum + s.closingBalance, 0)

  const totalPaid = statements
    .filter((s) => s.isPaid)
    .reduce((sum, s) => sum + s.closingBalance, 0)

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-display font-medium tracking-tight text-primary mb-2">
            Financial Management
          </h1>
          <p className="text-slate-600 font-sans">
            Manage statements, transactions, and payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2 min-w-0">
            <a href="/admin/financial/billing" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Automated Billing</span>
            </a>
          </Button>
          <Button onClick={() => setIsPaymentDialogOpen(true)} variant="luxury" className="gap-2 min-w-0">
            <CreditCard className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Process Payment</span>
          </Button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Outstanding A/R</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-primary mb-2">
              {formatCurrency(totalOutstanding)}
            </div>
            <p className="text-sm text-slate-600 font-sans">
              {statements.filter((s) => !s.isPaid).length} unpaid statement{statements.filter((s) => !s.isPaid).length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-slate-700 mb-2">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-sm text-slate-600 font-sans">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Payment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-gold mb-2">
              {statements.length > 0
                ? Math.round((statements.filter((s) => s.isPaid).length / statements.length) * 100)
                : 0}%
            </div>
            <p className="text-sm text-slate-600 font-sans">
              On-time payment rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="statements">
        <TabsList>
          <TabsTrigger value="statements">Statements</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="statements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display">Member Statements</CardTitle>
                  <CardDescription className="font-sans">
                    {statements.length} statement{statements.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="gap-2 min-w-0"
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/reports/export", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ reportType: "statements", timeRange: "month" }),
                      })
                      if (response.ok) {
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = `statements-${new Date().toISOString().split("T")[0]}.csv`
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                      }
                    } catch (error) {
                      alert("Failed to export statements")
                    }
                  }}
                >
                  <Download className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Export</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Statement Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Opening Balance</TableHead>
                    <TableHead>Closing Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statements.map((statement) => (
                    <TableRow key={statement.id}>
                      <TableCell className="max-w-[180px]">
                        <div className="min-w-0">
                          <div className="font-sans font-medium truncate">{statement.memberName}</div>
                          <div className="text-sm text-slate-500 font-sans truncate">{statement.memberNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-sans max-w-[120px]">
                        <span className="truncate block">{formatDate(statement.statementDate)}</span>
                      </TableCell>
                      <TableCell className="font-sans max-w-[120px]">
                        <span className="truncate block">{formatDate(statement.dueDate)}</span>
                      </TableCell>
                      <TableCell className="font-sans max-w-[140px]">
                        <span className="truncate block">{formatCurrency(statement.openingBalance)}</span>
                      </TableCell>
                      <TableCell className="font-sans font-semibold max-w-[140px]">
                        <span className="truncate block">{formatCurrency(statement.closingBalance)}</span>
                      </TableCell>
                      <TableCell className="max-w-[120px]">
                        <Badge variant={statement.isPaid ? "success" : "warning"}>
                          {statement.isPaid ? "Paid" : "Outstanding"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/statements/${statement.id}`)
                              if (response.ok) {
                                const data = await response.json()
                                alert(`Statement Details:\nMember: ${data.statement.member.firstName} ${data.statement.member.lastName}\nPeriod: ${formatDate(data.statement.billingPeriod)}\nAmount: ${formatCurrency(data.statement.totalAmount)}\nStatus: ${data.statement.isPaid ? "Paid" : "Outstanding"}`)
                              }
                            } catch (error) {
                              alert("Failed to fetch statement details")
                            }
                          }}
                        >
                          <span className="truncate">View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">All Transactions</CardTitle>
              <CardDescription className="font-sans">
                {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-sans max-w-[120px]">
                        <span className="truncate block">{formatDate(transaction.date)}</span>
                      </TableCell>
                      <TableCell className="font-sans max-w-[180px]">
                        <span className="truncate block">{transaction.memberName}</span>
                      </TableCell>
                      <TableCell className="max-w-[120px]">
                        <Badge variant="outline" className="truncate block">{transaction.type}</Badge>
                      </TableCell>
                      <TableCell className="font-sans max-w-[300px]">
                        <span className="truncate block">{transaction.description}</span>
                      </TableCell>
                      <TableCell className={`text-right font-sans font-semibold max-w-[140px] ${transaction.amount < 0 ? "text-slate-700" : "text-primary"}`}>
                        <span className="truncate block whitespace-nowrap">
                          {transaction.amount < 0 ? "-" : "+"}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Payment History</CardTitle>
              <CardDescription className="font-sans">
                {payments.length} payment{payments.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-sans">{formatDate(payment.processedAt)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-sans font-medium">{payment.memberName}</div>
                          <div className="text-sm text-slate-500 font-sans">{payment.memberNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-sans font-semibold text-slate-700">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">{payment.method}</Badge>
                      </TableCell>
                      <TableCell className="font-sans text-sm">{payment.referenceNumber}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Process Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Record a payment for a member account
            </DialogDescription>
          </DialogHeader>
          <PaymentForm onClose={() => setIsPaymentDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PaymentForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    memberNumber: "",
    amount: "",
    method: "CREDIT_CARD",
    referenceNumber: "",
  })

  const queryClient = useQueryClient()

  const processPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to process payment")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statements"] })
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      alert("Payment processed successfully!")
      onClose()
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to process payment")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    processPaymentMutation.mutate({
      memberNumber: formData.memberNumber,
      amount: formData.amount,
      method: formData.method,
      referenceNumber: formData.referenceNumber,
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
        <Label htmlFor="method">Payment Method</Label>
        <Select
          value={formData.method}
          onValueChange={(value) => setFormData({ ...formData, method: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
            <SelectItem value="ACH">ACH</SelectItem>
            <SelectItem value="CHECK">Check</SelectItem>
            <SelectItem value="CASH">Cash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="referenceNumber">Reference Number</Label>
        <Input
          id="referenceNumber"
          value={formData.referenceNumber}
          onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
          placeholder="Optional"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} className="min-w-0" disabled={processPaymentMutation.isPending}>
          <span className="truncate">Cancel</span>
        </Button>
        <Button type="submit" variant="luxury" className="min-w-0" disabled={processPaymentMutation.isPending}>
          <span className="truncate">{processPaymentMutation.isPending ? "Processing..." : "Process Payment"}</span>
        </Button>
      </DialogFooter>
    </form>
  )
}

