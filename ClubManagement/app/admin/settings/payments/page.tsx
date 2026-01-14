"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Save, CreditCard, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"

export default function PaymentSettingsPage() {
  const [showStripeSecret, setShowStripeSecret] = useState(false)
  const [showPayPalSecret, setShowPayPalSecret] = useState(false)
  
  const [stripeSettings, setStripeSettings] = useState({
    enabled: true,
    publishableKey: "pk_test_...",
    secretKey: "sk_test_...",
    webhookSecret: "",
    testMode: true,
  })

  const [paypalSettings, setPaypalSettings] = useState({
    enabled: false,
    clientId: "",
    clientSecret: "",
    mode: "sandbox",
  })

  const [achSettings, setAchSettings] = useState({
    enabled: true,
    processor: "stripe",
    accountNumber: "",
    routingNumber: "",
  })

  const queryClient = useQueryClient()

  const saveSettingsMutation = useMutation({
    mutationFn: async ({ provider, settings }: { provider: string; settings: any }) => {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "payments", settings: { [provider]: settings } }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save settings")
      }
      return response.json()
    },
    onSuccess: () => {
      alert("Payment settings saved successfully!")
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to save settings")
    },
  })

  const testConnectionMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Connection test failed")
      }
      return response.json()
    },
    onSuccess: (data) => {
      alert(data.message || "Connection test successful!")
    },
    onError: (error: Error) => {
      alert(error.message || "Connection test failed")
    },
  })

  const handleSave = (provider: string) => {
    let settings: any = {}
    if (provider === "stripe") {
      settings = stripeSettings
    } else if (provider === "paypal") {
      settings = paypalSettings
    } else if (provider === "ach") {
      settings = achSettings
    }
    saveSettingsMutation.mutate({ provider, settings })
  }

  const testConnection = (provider: string) => {
    testConnectionMutation.mutate(provider)
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl font-display font-medium tracking-tight text-primary mb-2">
          Payment Processing Settings
        </h1>
        <p className="text-slate-600 font-sans">
          Configure payment gateways and processing options
        </p>
      </div>

      <Tabs defaultValue="stripe">
        <TabsList>
          <TabsTrigger value="stripe">Stripe</TabsTrigger>
          <TabsTrigger value="paypal">PayPal</TabsTrigger>
          <TabsTrigger value="ach">ACH Processing</TabsTrigger>
        </TabsList>

        {/* Stripe Settings */}
        <TabsContent value="stripe" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Stripe Configuration
                  </CardTitle>
                  <CardDescription className="font-sans">
                    Secure credit card processing via Stripe
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={stripeSettings.enabled ? "success" : "default"}>
                    {stripeSettings.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  {stripeSettings.testMode && (
                    <Badge variant="warning">Test Mode</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <Label htmlFor="stripeEnabled" className="font-sans font-medium">
                    Enable Stripe
                  </Label>
                  <p className="text-sm text-slate-600 font-sans">
                    Allow credit card payments through Stripe
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="stripeEnabled"
                  checked={stripeSettings.enabled}
                  onChange={(e) =>
                    setStripeSettings({ ...stripeSettings, enabled: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-navy"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripePublishableKey">Publishable Key</Label>
                <Input
                  id="stripePublishableKey"
                  value={stripeSettings.publishableKey}
                  onChange={(e) =>
                    setStripeSettings({ ...stripeSettings, publishableKey: e.target.value })
                  }
                  placeholder="pk_test_..."
                />
                <p className="text-xs text-slate-500 font-sans">
                  Found in your Stripe Dashboard → Developers → API keys
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripeSecretKey">Secret Key</Label>
                <div className="relative">
                  <Input
                    id="stripeSecretKey"
                    type={showStripeSecret ? "text" : "password"}
                    value={stripeSettings.secretKey}
                    onChange={(e) =>
                      setStripeSettings({ ...stripeSettings, secretKey: e.target.value })
                    }
                    placeholder="sk_test_..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowStripeSecret(!showStripeSecret)}
                  >
                    {showStripeSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 font-sans">
                  Keep this key secure. Never share it publicly.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripeWebhookSecret">Webhook Secret (Optional)</Label>
                <Input
                  id="stripeWebhookSecret"
                  type="password"
                  value={stripeSettings.webhookSecret}
                  onChange={(e) =>
                    setStripeSettings({ ...stripeSettings, webhookSecret: e.target.value })
                  }
                  placeholder="whsec_..."
                />
                <p className="text-xs text-slate-500 font-sans">
                  For receiving payment status updates
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <Label htmlFor="stripeTestMode" className="font-sans font-medium">
                    Test Mode
                  </Label>
                  <p className="text-sm text-slate-600 font-sans">
                    Use test keys for development and testing
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="stripeTestMode"
                  checked={stripeSettings.testMode}
                  onChange={(e) =>
                    setStripeSettings({ ...stripeSettings, testMode: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-navy"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => testConnection("stripe")}
                  variant="outline"
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Test Connection
                </Button>
                <Button
                  onClick={() => handleSave("stripe")}
                  variant="luxury"
                  className="gap-2 min-w-0"
                >
                  <Save className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Save Stripe Settings</span>
                </Button>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-sans">
                  <strong>Getting Started:</strong> Sign up at{" "}
                  <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="underline">
                    stripe.com
                  </a>
                  {" "}and get your API keys from the Dashboard. Start with test mode to verify everything works.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PayPal Settings */}
        <TabsContent value="paypal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">PayPal Configuration</CardTitle>
              <CardDescription className="font-sans">
                Accept PayPal and Venmo payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <Label htmlFor="paypalEnabled" className="font-sans font-medium">
                    Enable PayPal
                  </Label>
                </div>
                <input
                  type="checkbox"
                  id="paypalEnabled"
                  checked={paypalSettings.enabled}
                  onChange={(e) =>
                    setPaypalSettings({ ...paypalSettings, enabled: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-navy"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paypalClientId">Client ID</Label>
                <Input
                  id="paypalClientId"
                  value={paypalSettings.clientId}
                  onChange={(e) =>
                    setPaypalSettings({ ...paypalSettings, clientId: e.target.value })
                  }
                  placeholder="Enter PayPal Client ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paypalClientSecret">Client Secret</Label>
                <div className="relative">
                  <Input
                    id="paypalClientSecret"
                    type={showPayPalSecret ? "text" : "password"}
                    value={paypalSettings.clientSecret}
                    onChange={(e) =>
                      setPaypalSettings({ ...paypalSettings, clientSecret: e.target.value })
                    }
                    placeholder="Enter PayPal Client Secret"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPayPalSecret(!showPayPalSecret)}
                  >
                    {showPayPalSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paypalMode">Mode</Label>
                <select
                  id="paypalMode"
                  value={paypalSettings.mode}
                  onChange={(e) =>
                    setPaypalSettings({ ...paypalSettings, mode: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="sandbox">Sandbox (Test)</option>
                  <option value="live">Live (Production)</option>
                </select>
              </div>

              <Button
                onClick={() => handleSave("paypal")}
                variant="luxury"
                className="gap-2 min-w-0"
                disabled={saveSettingsMutation.isPending}
              >
                <Save className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{saveSettingsMutation.isPending ? "Saving..." : "Save PayPal Settings"}</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACH Settings */}
        <TabsContent value="ach" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">ACH Processing</CardTitle>
              <CardDescription className="font-sans">
                Configure ACH/bank transfer processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <Label htmlFor="achEnabled" className="font-sans font-medium">
                    Enable ACH Processing
                  </Label>
                </div>
                <input
                  type="checkbox"
                  id="achEnabled"
                  checked={achSettings.enabled}
                  onChange={(e) =>
                    setAchSettings({ ...achSettings, enabled: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-navy"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="achProcessor">Processor</Label>
                <select
                  id="achProcessor"
                  value={achSettings.processor}
                  onChange={(e) =>
                    setAchSettings({ ...achSettings, processor: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="stripe">Stripe</option>
                  <option value="plaid">Plaid</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <Button
                onClick={() => handleSave("ach")}
                variant="luxury"
                className="gap-2 min-w-0"
                disabled={saveSettingsMutation.isPending}
              >
                <Save className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{saveSettingsMutation.isPending ? "Saving..." : "Save ACH Settings"}</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

