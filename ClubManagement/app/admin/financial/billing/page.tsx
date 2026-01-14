"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function BillingPage() {
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split("T")[0])

  const processBillingMutation = useMutation({
    mutationFn: async (date?: string) => {
      const response = await fetch("/api/billing/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date: date || billingDate }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to process billing")
      }

      return response.json()
    },
  })

  const handleProcessBilling = () => {
    processBillingMutation.mutate(billingDate)
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl font-display font-medium text-primary mb-2 tracking-tight">
          Automated Billing
        </h1>
        <p className="text-slate-600 font-sans text-sm">
          Process monthly statements for all active members
        </p>
      </div>

      {/* Billing Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Process Monthly Billing</CardTitle>
          <CardDescription className="font-sans">
            Gather all unposted transactions, add monthly dues, and create statements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-sans font-medium text-primary mb-2 block">
                Billing Period Date
              </label>
              <input
                type="date"
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-sans focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="pt-8">
              <Button
                onClick={handleProcessBilling}
                disabled={processBillingMutation.isPending}
                variant="luxury"
                size="lg"
                className="gap-2"
              >
                {processBillingMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    Process Billing
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Results */}
          {processBillingMutation.data && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-slate-700" />
                <h3 className="font-sans font-medium text-primary">Billing Process Results</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Badge variant="success" className="text-base px-3 py-1">
                    {processBillingMutation.data.results.processed}
                  </Badge>
                  <span className="font-sans text-sm text-slate-600">
                    Members Processed
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {processBillingMutation.data.results.skipped}
                  </Badge>
                  <span className="font-sans text-sm text-slate-600">
                    Members Skipped
                  </span>
                </div>
                {processBillingMutation.data.results.errors.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Badge variant="warning" className="text-base px-3 py-1">
                      {processBillingMutation.data.results.errors.length}
                    </Badge>
                    <span className="font-sans text-sm text-slate-600">
                      Errors
                    </span>
                  </div>
                )}
              </div>

              {processBillingMutation.data.results.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <h4 className="font-sans font-medium text-red-800">Errors</h4>
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {processBillingMutation.data.results.errors.map((error: string, idx: number) => (
                      <li key={idx} className="font-sans text-sm text-red-700">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {processBillingMutation.isError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-sans font-medium text-red-800">
                  Error: {processBillingMutation.error?.message || "Failed to process billing"}
                </span>
              </div>
            </div>
          )}

          {/* Information */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-sans font-medium text-primary mb-2">How it works:</h4>
            <ul className="space-y-1 text-sm font-sans text-slate-600 list-disc list-inside">
              <li>Gathers all unposted transactions for each active member</li>
              <li>Adds monthly dues based on membership tier</li>
              <li>Creates a new statement with the total amount</li>
              <li>Marks all transactions as posted (isPosted = true)</li>
            </ul>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs font-sans text-slate-500">
                <strong>Monthly Dues:</strong> FULL_GOLF: $500 | TENNIS_SOCIAL: $250 | JUNIOR: $150 | HONORARY: $0
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

