"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Save, User, Mail, Phone, Calendar, CreditCard } from "lucide-react"
import { formatDate } from "@/lib/utils"

const mockMemberProfile = {
  memberNumber: 2024001,
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@email.com",
  phone: "(555) 123-4567",
  dateOfBirth: "1985-06-15",
  tier: "FULL_GOLF",
  status: "ACTIVE",
  joinDate: "2020-01-15",
  houseAccountLimit: 5000.00,
}

export default function MemberProfilePage() {
  const [profile, setProfile] = useState(mockMemberProfile)
  const [isEditing, setIsEditing] = useState(false)

  const saveProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      // This should use the member's own ID from auth context
      const response = await fetch("/api/members/current-member-id", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update profile")
      }
      return response.json()
    },
    onSuccess: () => {
      alert("Profile updated successfully!")
      setIsEditing(false)
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to update profile")
    },
  })

  const handleSave = () => {
    saveProfileMutation.mutate({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      dateOfBirth: profile.dateOfBirth,
    })
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl font-display font-medium tracking-tight text-primary mb-2">
          My Profile
        </h1>
        <p className="text-slate-600 font-sans">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Birth
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              {isEditing && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    variant="luxury"
                    className="gap-2"
                    disabled={saveProfileMutation.isPending}
                  >
                    <Save className="h-4 w-4" />
                    {saveProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    disabled={saveProfileMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 font-sans mb-4">
                Manage your payment methods for automatic billing
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  alert("Add payment method - integrate with Stripe")
                }}
              >
                <span className="truncate">Add Payment Method</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Account Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 font-sans mb-1">Member Number</p>
                <p className="font-sans font-semibold text-primary">{profile.memberNumber}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 font-sans mb-1">Membership Tier</p>
                <Badge variant="outline">{profile.tier}</Badge>
              </div>

              <div>
                <p className="text-sm text-slate-600 font-sans mb-1">Status</p>
                <Badge variant="success">{profile.status}</Badge>
              </div>

              <div>
                <p className="text-sm text-slate-600 font-sans mb-1">Member Since</p>
                <p className="font-sans">{formatDate(profile.joinDate)}</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-slate-600 font-sans mb-1">House Account Balance</p>
                <p className="text-xl font-display font-medium tracking-tight text-primary">
                  ${profile.houseAccountLimit?.toFixed(2) || "0.00"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = "/member/statements"}
              >
                <span className="truncate">View Statements</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = "/member/bookings"}
              >
                <span className="truncate">Book a Court</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  alert("Event registration - navigate to events page")
                }}
              >
                <span className="truncate">Register for Event</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

