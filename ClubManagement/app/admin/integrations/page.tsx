"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Plug, 
  CheckCircle, 
  XCircle, 
  Settings, 
  Database, 
  Mail, 
  MessageSquare,
  CreditCard,
  Calendar,
  BarChart
} from "lucide-react"

const integrations = [
  {
    id: "stripe",
    name: "Stripe",
    category: "Payment Processing",
    description: "Accept credit cards and ACH payments",
    icon: CreditCard,
    status: "connected",
    lastSync: "2024-01-19 10:30 AM",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    category: "Accounting",
    description: "Sync financial data and transactions",
    icon: Database,
    status: "available",
    lastSync: null,
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    category: "Marketing",
    description: "Email marketing and campaigns",
    icon: Mail,
    status: "available",
    lastSync: null,
  },
  {
    id: "twilio",
    name: "Twilio",
    category: "Communications",
    description: "SMS notifications and messaging",
    icon: MessageSquare,
    status: "available",
    lastSync: null,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "Scheduling",
    description: "Sync events and bookings",
    icon: Calendar,
    status: "available",
    lastSync: null,
  },
  {
    id: "tableau",
    name: "Tableau",
    category: "Analytics",
    description: "Advanced business intelligence",
    icon: BarChart,
    status: "available",
    lastSync: null,
  },
]

export default function IntegrationsPage() {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)

  const connectIntegrationMutation = useMutation({
    mutationFn: async ({ integrationId, apiKey, apiSecret }: { integrationId: string; apiKey?: string; apiSecret?: string }) => {
      // Handle Google Calendar OAuth flow
      if (integrationId === "google-calendar") {
        const response = await fetch("/api/google/auth")
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to initiate Google OAuth")
        }
        const data = await response.json()
        // Redirect to Google OAuth page
        window.location.href = data.authUrl
        return { success: true, integrationId, requiresRedirect: true }
      }

      // For other integrations that need API keys
      if (!apiKey) {
        throw new Error("API key is required")
      }

      // Mock API call for other integrations - in production, create /api/integrations/connect route
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return { success: true, integrationId }
    },
    onSuccess: (data) => {
      if (!data.requiresRedirect) {
        alert(`Successfully connected ${data.integrationId}!`)
        setSelectedIntegration(null)
      }
      // If requiresRedirect is true, the window.location.href already redirected
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to connect integration")
    },
  })

  const disconnectIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      // Mock API call - in production, create /api/integrations/disconnect route
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { success: true }
    },
    onSuccess: () => {
      alert("Integration disconnected successfully")
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to disconnect integration")
    },
  })

  const handleConnect = (integrationId: string) => {
    setSelectedIntegration(integrationId)
  }

  const handleDisconnect = (integrationId: string) => {
    if (confirm(`Are you sure you want to disconnect ${integrationId}?`)) {
      disconnectIntegrationMutation.mutate(integrationId)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-5 w-5 text-slate-700" />
      case "available":
        return <XCircle className="h-5 w-5 text-slate-400" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge variant="success">Connected</Badge>
      case "available":
        return <Badge variant="outline">Available</Badge>
      default:
        return <Badge variant="default">{status}</Badge>
    }
  }

  const categories = Array.from(new Set(integrations.map((i) => i.category)))

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl font-display font-medium tracking-tight text-primary mb-2">
          Integrations
        </h1>
        <p className="text-slate-600 font-sans">
          Connect with third-party services and extend functionality
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Total Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-primary">
              {integrations.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Connected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-slate-700">
              {integrations.filter((i) => i.status === "connected").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-gold">
              {integrations.filter((i) => i.status === "available").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations by Category */}
      {categories.map((category) => {
        const categoryIntegrations = integrations.filter((i) => i.category === category)
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="font-display">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryIntegrations.map((integration) => {
                  const Icon = integration.icon
                  return (
                    <Card
                      key={integration.id}
                      className="border-2 hover:border-gold transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-sans font-semibold">{integration.name}</h3>
                              {getStatusBadge(integration.status)}
                            </div>
                          </div>
                          {getStatusIcon(integration.status)}
                        </div>

                        <p className="text-sm text-slate-600 font-sans mb-4">
                          {integration.description}
                        </p>

                        {integration.status === "connected" && integration.lastSync && (
                          <p className="text-xs text-slate-500 font-sans mb-3">
                            Last sync: {integration.lastSync}
                          </p>
                        )}

                        <div className="flex gap-2">
                          {integration.status === "connected" ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  alert(`Configure ${integration.name} - Open settings panel`)
                                }}
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Configure
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDisconnect(integration.id)}
                                disabled={disconnectIntegrationMutation.isPending}
                              >
                                {disconnectIntegrationMutation.isPending ? "Disconnecting..." : "Disconnect"}
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="luxury"
                              size="sm"
                              className="w-full"
                              onClick={async () => {
                                if (integration.id === "google-calendar") {
                                  // For Google Calendar, initiate OAuth flow
                                  connectIntegrationMutation.mutate({ integrationId: integration.id })
                                } else {
                                  // For other integrations, show connection dialog
                                  handleConnect(integration.id)
                                }
                              }}
                              disabled={connectIntegrationMutation.isPending}
                            >
                              <Plug className="h-4 w-4 mr-1" />
                              {connectIntegrationMutation.isPending ? "Connecting..." : "Connect"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Connection Instructions */}
      {selectedIntegration && (
        <Card className="border-gold">
          <CardHeader>
            <CardTitle className="font-display">
              Connect {integrations.find((i) => i.id === selectedIntegration)?.name}
            </CardTitle>
            <CardDescription className="font-sans">
              Follow these steps to connect the integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedIntegration === "google-calendar" ? (
              <>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-sans mb-2">
                    <strong>Google Calendar uses OAuth2.</strong> To connect:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 font-sans mb-3">
                    <li>Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in your .env.local file</li>
                    <li>Click the Connect button on the Google Calendar card above</li>
                    <li>Authorize access in the Google OAuth window</li>
                    <li>You'll be redirected back after successful connection</li>
                  </ol>
                  <p className="text-xs text-blue-600 font-sans">
                    <strong>Note:</strong> The redirect URI must be set to: <code className="bg-blue-100 px-1 rounded">http://localhost:3001/api/google/callback</code> in your Google Cloud Console.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="luxury"
                    className="flex-1 min-w-0"
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/google/auth")
                        if (!response.ok) {
                          const error = await response.json()
                          alert(error.error || "Failed to initiate Google OAuth. Make sure your API keys are configured.")
                          return
                        }
                        const data = await response.json()
                        window.location.href = data.authUrl
                      } catch (error: any) {
                        alert(error.message || "Failed to connect Google Calendar")
                      }
                    }}
                  >
                    <span className="truncate">Connect with Google</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedIntegration(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input id="apiKey" placeholder="Enter your API key" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiSecret">API Secret (Optional)</Label>
                  <Input id="apiSecret" type="password" placeholder="Enter your API secret" />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="luxury"
                    className="flex-1 min-w-0"
                    onClick={() => {
                      const apiKey = (document.getElementById("apiKey") as HTMLInputElement)?.value
                      const apiSecret = (document.getElementById("apiSecret") as HTMLInputElement)?.value
                      if (!apiKey) {
                        alert("Please enter an API key")
                        return
                      }
                      if (selectedIntegration) {
                        connectIntegrationMutation.mutate({
                          integrationId: selectedIntegration,
                          apiKey,
                          apiSecret: apiSecret || undefined,
                        })
                      }
                    }}
                    disabled={connectIntegrationMutation.isPending}
                  >
                    <span className="truncate">{connectIntegrationMutation.isPending ? "Connecting..." : "Connect"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedIntegration(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-sans">
                <strong>Need help?</strong> Check the integration documentation or contact
                support for assistance setting up this connection.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

