"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, CreditCard, DollarSign, Eye } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

const mockStatements = [
  {
    id: "1",
    statementDate: "2024-01-01",
    dueDate: "2024-01-15",
    openingBalance: 1250.50,
    closingBalance: 1850.50,
    isPaid: false,
    transactions: [
      { id: "1", description: "Monthly Membership Dues", amount: 600.00, date: "2024-01-01" },
      { id: "2", description: "Pro Shop - Tennis Racket", amount: 199.99, date: "2024-01-05" },
    ],
  },
  {
    id: "2",
    statementDate: "2023-12-01",
    dueDate: "2023-12-15",
    openingBalance: 650.50,
    closingBalance: 1250.50,
    isPaid: true,
    paidAt: "2023-12-10",
    transactions: [
      { id: "3", description: "Monthly Membership Dues", amount: 600.00, date: "2023-12-01" },
    ],
  },
]

export default function MemberStatementsPage() {
  const [selectedStatement, setSelectedStatement] = useState<any>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const { data: statements = mockStatements } = useQuery({
    queryKey: ["myStatements"],
    queryFn: async () => mockStatements,
  })

  const totalOutstanding = statements
    .filter((s) => !s.isPaid)
    .reduce((sum, s) => sum + s.closingBalance, 0)

  const handleViewStatement = (statement: any) => {
    setSelectedStatement(statement)
    setIsViewDialogOpen(true)
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl font-display font-medium tracking-tight text-primary mb-2">
          My Statements
        </h1>
        <p className="text-slate-600 font-sans">
          View your account statements and payment history
        </p>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-primary mb-2">
              {formatCurrency(statements[0]?.closingBalance || 0)}
            </div>
            <p className="text-sm text-slate-600 font-sans">
              Most recent statement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Outstanding</CardTitle>
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
            <CardTitle className="text-lg font-display">Quick Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="luxury"
              size="lg"
              onClick={() => {
                // Navigate to payment page or open payment dialog
                alert("Payment functionality - integrate with Stripe/PayPal")
              }}
            >
              <CreditCard className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Pay Now</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Statements List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Statement History</CardTitle>
          <CardDescription className="font-sans">
            {statements.length} statement{statements.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell className="font-sans">{formatDate(statement.statementDate)}</TableCell>
                  <TableCell className="font-sans">{formatDate(statement.dueDate)}</TableCell>
                  <TableCell className="font-sans">{formatCurrency(statement.openingBalance)}</TableCell>
                  <TableCell className="font-sans font-semibold">
                    {formatCurrency(statement.closingBalance)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statement.isPaid ? "success" : "warning"}>
                      {statement.isPaid ? "Paid" : "Outstanding"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewStatement(statement)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/statements/${statement.id}`)
                            if (response.ok) {
                              const data = await response.json()
                              // Generate PDF or CSV
                              const csv = `Statement,${statement.id}\nDate,${statement.statementDate}\nAmount,${statement.closingBalance}\n`
                              const blob = new Blob([csv], { type: "text/csv" })
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement("a")
                              a.href = url
                              a.download = `statement-${statement.id}.csv`
                              document.body.appendChild(a)
                              a.click()
                              window.URL.revokeObjectURL(url)
                              document.body.removeChild(a)
                            }
                          } catch (error) {
                            alert("Failed to download statement")
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Statement Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Statement Details</DialogTitle>
            <DialogDescription>
              Statement dated {selectedStatement && formatDate(selectedStatement.statementDate)}
            </DialogDescription>
          </DialogHeader>
          {selectedStatement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-600 font-sans">Opening Balance</p>
                  <p className="text-lg font-display font-bold text-primary">
                    {formatCurrency(selectedStatement.openingBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-sans">Closing Balance</p>
                  <p className="text-lg font-display font-bold text-primary">
                    {formatCurrency(selectedStatement.closingBalance)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-display font-semibold mb-2">Transactions</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedStatement.transactions.map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-sans">{formatDate(transaction.date)}</TableCell>
                        <TableCell className="font-sans">{transaction.description}</TableCell>
                        <TableCell className="text-right font-sans font-semibold">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {!selectedStatement.isPaid && (
                <Button
                  className="w-full"
                  variant="luxury"
                  size="lg"
                  onClick={() => {
                    // Navigate to payment page
                    alert("Payment functionality - integrate with Stripe/PayPal")
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Pay Statement</span>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

