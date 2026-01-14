"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Building2, CreditCard, Mail, Bell } from "lucide-react"

export default function SettingsPage() {
  const [clubSettings, setClubSettings] = useState({
    name: "Elite Country Club",
    address: "123 Country Club Drive",
    city: "Beverly Hills",
    state: "CA",
    zip: "90210",
    phone: "(555) 123-4567",
    email: "info@eliteclub.com",
  })

  const [billingSettings, setBillingSettings] = useState({
    stripeSecretKey: "sk_test_...",
    stripePublishableKey: "pk_test_...",
    billingDay: "1",
    gracePeriod: "15",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    statementReminders: true,
    bookingConfirmations: true,
  })

  const queryClient = useQueryClient()

  const saveSettingsMutation = useMutation({
    mutationFn: async ({ section, settings }: { section: string; settings: any }) => {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, settings }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save settings")
      }
      return response.json()
    },
    onSuccess: () => {
      alert("Settings saved successfully!")
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to save settings")
    },
  })

  const handleSave = (section: string) => {
    let settings: any = {}
    if (section === "general") {
      settings = clubSettings
    } else if (section === "billing") {
      settings = billingSettings
    } else if (section === "notifications") {
      settings = notificationSettings
    }
    saveSettingsMutation.mutate({ section, settings })
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl font-display font-medium tracking-tight text-primary mb-2">
          Settings
        </h1>
        <p className="text-slate-600 font-sans">
          Configure club settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Club Information
              </CardTitle>
              <CardDescription className="font-sans">
                Update your club's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clubName">Club Name</Label>
                  <Input
                    id="clubName"
                    value={clubSettings.name}
                    onChange={(e) => setClubSettings({ ...clubSettings, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={clubSettings.phone}
                    onChange={(e) => setClubSettings({ ...clubSettings, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={clubSettings.address}
                  onChange={(e) => setClubSettings({ ...clubSettings, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={clubSettings.city}
                    onChange={(e) => setClubSettings({ ...clubSettings, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={clubSettings.state}
                    onChange={(e) => setClubSettings({ ...clubSettings, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={clubSettings.zip}
                    onChange={(e) => setClubSettings({ ...clubSettings, zip: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={clubSettings.email}
                  onChange={(e) => setClubSettings({ ...clubSettings, email: e.target.value })}
                />
              </div>

              <Button
                onClick={() => handleSave("general")}
                variant="luxury"
                className="gap-2 min-w-0"
                disabled={saveSettingsMutation.isPending}
              >
                <Save className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Processing
              </CardTitle>
              <CardDescription className="font-sans">
                Configure Stripe payment processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                <Input
                  id="stripeSecretKey"
                  type="password"
                  value={billingSettings.stripeSecretKey}
                  onChange={(e) => setBillingSettings({ ...billingSettings, stripeSecretKey: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripePublishableKey">Stripe Publishable Key</Label>
                <Input
                  id="stripePublishableKey"
                  value={billingSettings.stripePublishableKey}
                  onChange={(e) => setBillingSettings({ ...billingSettings, stripePublishableKey: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billingDay">Billing Day of Month</Label>
                  <Input
                    id="billingDay"
                    type="number"
                    min="1"
                    max="31"
                    value={billingSettings.billingDay}
                    onChange={(e) => setBillingSettings({ ...billingSettings, billingDay: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gracePeriod">Grace Period (days)</Label>
                  <Input
                    id="gracePeriod"
                    type="number"
                    value={billingSettings.gracePeriod}
                    onChange={(e) => setBillingSettings({ ...billingSettings, gracePeriod: e.target.value })}
                  />
                </div>
              </div>

              <Button
                onClick={() => handleSave("billing")}
                variant="luxury"
                className="gap-2 min-w-0"
                disabled={saveSettingsMutation.isPending}
              >
                <Save className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="font-sans">
                Configure how members receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <Label htmlFor="emailNotifications" className="font-sans font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-slate-600 font-sans">
                    Send email notifications to members
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={notificationSettings.emailNotifications}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      emailNotifications: e.target.checked,
                    })
                  }
                  className="h-5 w-5 rounded border-slate-300"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <Label htmlFor="smsNotifications" className="font-sans font-medium">
                    SMS Notifications
                  </Label>
                  <p className="text-sm text-slate-600 font-sans">
                    Send SMS text messages to members
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="smsNotifications"
                  checked={notificationSettings.smsNotifications}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      smsNotifications: e.target.checked,
                    })
                  }
                  className="h-5 w-5 rounded border-slate-300"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <Label htmlFor="statementReminders" className="font-sans font-medium">
                    Statement Reminders
                  </Label>
                  <p className="text-sm text-slate-600 font-sans">
                    Send reminders for upcoming statement due dates
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="statementReminders"
                  checked={notificationSettings.statementReminders}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      statementReminders: e.target.checked,
                    })
                  }
                  className="h-5 w-5 rounded border-slate-300"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <Label htmlFor="bookingConfirmations" className="font-sans font-medium">
                    Booking Confirmations
                  </Label>
                  <p className="text-sm text-slate-600 font-sans">
                    Send confirmation emails for bookings
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="bookingConfirmations"
                  checked={notificationSettings.bookingConfirmations}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      bookingConfirmations: e.target.checked,
                    })
                  }
                  className="h-5 w-5 rounded border-slate-300"
                />
              </div>

              <Button
                onClick={() => handleSave("notifications")}
                variant="luxury"
                className="gap-2 min-w-0"
                disabled={saveSettingsMutation.isPending}
              >
                <Save className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

