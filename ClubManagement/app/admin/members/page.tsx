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
import { Plus, Search, Edit, Trash2, Users } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

// Mock data - will be replaced with API calls
const mockMembers = [
  {
    id: "1",
    memberNumber: 2024001,
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@email.com",
    phone: "(555) 123-4567",
    tier: "FULL_GOLF",
    status: "ACTIVE",
    joinDate: "2020-01-15",
    houseAccountLimit: 5000.00,
  },
  {
    id: "2",
    memberNumber: 2024002,
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.j@email.com",
    phone: "(555) 234-5678",
    tier: "TENNIS_SOCIAL",
    status: "ACTIVE",
    joinDate: "2021-03-20",
    houseAccountLimit: 3000.00,
  },
  {
    id: "3",
    memberNumber: 2024003,
    firstName: "Michael",
    lastName: "Chen",
    email: "m.chen@email.com",
    phone: "(555) 345-6789",
    tier: "JUNIOR",
    status: "ACTIVE",
    joinDate: "2022-06-10",
    houseAccountLimit: 2000.00,
  },
  {
    id: "4",
    memberNumber: 2024004,
    firstName: "Emily",
    lastName: "Williams",
    email: "emily.w@email.com",
    phone: "(555) 456-7890",
    tier: "FULL_GOLF",
    status: "PENDING",
    joinDate: "2024-01-10",
    houseAccountLimit: 5000.00,
  },
]

export default function MembersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: membersData, isLoading } = useQuery({
    queryKey: ["members", searchTerm],
    queryFn: async () => {
      const response = await fetch(`/api/members${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""}`)
      if (!response.ok) throw new Error("Failed to fetch members")
      const data = await response.json()
      return data.members || []
    },
  })

  const members = membersData || []
  const filteredMembers = members.filter(
    (member) =>
      member.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.memberNumber?.toString().includes(searchTerm)
  )

  const createMemberMutation = useMutation({
    mutationFn: async (memberData: any) => {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create member")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] })
      setIsDialogOpen(false)
      setEditingMember(null)
    },
  })

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, ...memberData }: any) => {
      const response = await fetch(`/api/members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update member")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] })
      setIsDialogOpen(false)
      setEditingMember(null)
    },
  })

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/members/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete member")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] })
    },
  })

  const handleDeleteMember = (member: any) => {
    if (confirm(`Are you sure you want to delete ${member.firstName} ${member.lastName}?`)) {
      deleteMemberMutation.mutate(member.id)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning"> = {
      ACTIVE: "success",
      PENDING: "warning",
      INACTIVE: "default",
      SUSPENDED: "default",
    }
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
  }

  const getTierBadge = (tier: string) => {
    return <Badge variant="outline">{tier}</Badge>
  }

  const handleAddMember = () => {
    setEditingMember(null)
    setIsDialogOpen(true)
  }

  const handleEditMember = (member: any) => {
    setEditingMember(member)
    setIsDialogOpen(true)
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-display font-medium tracking-tight text-primary mb-2">
            Member Management
          </h1>
          <p className="text-slate-600 font-sans">
            Manage club members, memberships, and accounts
          </p>
        </div>
        <Button onClick={handleAddMember} variant="luxury" className="gap-2 min-w-0">
          <Plus className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Add Member</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Search Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or member number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display">All Members</CardTitle>
              <CardDescription className="font-sans">
                {filteredMembers.length} member{filteredMembers.length !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Account Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                    Loading members...
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium font-sans max-w-[120px]">
                      <span className="truncate block">M-{member.memberNumber}</span>
                    </TableCell>
                    <TableCell className="font-sans max-w-[180px]">
                      <span className="truncate block">{member.firstName} {member.lastName}</span>
                    </TableCell>
                    <TableCell className="font-sans max-w-[220px]">
                      <span className="truncate block">{member.email}</span>
                    </TableCell>
                    <TableCell className="font-sans max-w-[140px]">
                      <span className="truncate block">{member.phone}</span>
                    </TableCell>
                    <TableCell className="max-w-[140px]">
                      <div className="truncate">{getTierBadge(member.tier)}</div>
                    </TableCell>
                    <TableCell className="max-w-[120px]">
                      <div className="truncate">{getStatusBadge(member.status)}</div>
                    </TableCell>
                    <TableCell className="font-sans max-w-[120px]">
                      <span className="truncate block">{member.createdAt ? formatDate(member.createdAt) : "N/A"}</span>
                    </TableCell>
                    <TableCell className="font-sans font-medium max-w-[140px]">
                      <span className="truncate block">{formatCurrency(member.houseAccountLimit || 0)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditMember(member)}
                          className="flex-shrink-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteMember(member)}
                          className="flex-shrink-0"
                          disabled={deleteMemberMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Member Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "Edit Member" : "Add New Member"}
            </DialogTitle>
            <DialogDescription>
              {editingMember
                ? "Update member information below."
                : "Enter the details for the new member."}
            </DialogDescription>
          </DialogHeader>
          <MemberForm
            member={editingMember}
            onClose={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MemberForm({ member, onClose }: { member: any; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    firstName: member?.firstName || "",
    lastName: member?.lastName || "",
    email: member?.email || "",
    phone: member?.phone || "",
    tier: member?.tier || "FULL_GOLF",
    status: member?.status || "ACTIVE",
    houseAccountLimit: member?.houseAccountLimit?.toString() || "5000.00",
  })

  const createMemberMutation = useMutation({
    mutationFn: async (memberData: any) => {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create member")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] })
      onClose()
    },
  })

  const updateMemberMutation = useMutation({
    mutationFn: async (memberData: any) => {
      const response = await fetch(`/api/members/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update member")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      tier: formData.tier,
      status: formData.status,
      houseAccountLimit: formData.houseAccountLimit,
    }

    if (member) {
      updateMemberMutation.mutate(submitData)
    } else {
      createMemberMutation.mutate(submitData)
    }
  }

  const isSubmitting = createMemberMutation.isPending || updateMemberMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tier">Membership Tier</Label>
          <Select
            value={formData.tier}
            onValueChange={(value) => setFormData({ ...formData, tier: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FULL_GOLF">Full Golf Membership</SelectItem>
              <SelectItem value="TENNIS_SOCIAL">Tennis & Social Membership</SelectItem>
              <SelectItem value="JUNIOR">Junior Membership</SelectItem>
              <SelectItem value="HONORARY">Honorary Membership</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="luxury" className="min-w-0" disabled={isSubmitting}>
          <span className="truncate">{isSubmitting ? "Saving..." : member ? "Update Member" : "Create Member"}</span>
        </Button>
      </DialogFooter>
    </form>
  )
}

