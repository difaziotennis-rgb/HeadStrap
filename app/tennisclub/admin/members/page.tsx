'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Mail, Phone, Search, Edit, Trash2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getMembers, saveMembers, addMember, updateMember, deleteMember, initializeData, type Member } from '@/lib/club-data'

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive'
  })

  useEffect(() => {
    initializeData()
    loadMembers()
  }, [])

  const loadMembers = () => {
    const allMembers = getMembers()
    setMembers(allMembers)
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm)
  )

  const handleSendEmail = (member: Member) => {
    window.location.href = `mailto:${member.email}`
  }

  const handleCall = (member: Member) => {
    window.location.href = `tel:${member.phone.replace(/\D/g, '')}`
  }

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    addMember(formData)
    loadMembers()
    setShowAddModal(false)
    setFormData({ name: '', email: '', phone: '', status: 'active' })
  }

  const handleEdit = (member: Member) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      status: member.status
    })
    setShowEditModal(true)
  }

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMember) return
    
    updateMember(editingMember.id, formData)
    loadMembers()
    setShowEditModal(false)
    setEditingMember(null)
    setFormData({ name: '', email: '', phone: '', status: 'active' })
  }

  const handleDelete = (member: Member) => {
    if (confirm(`Are you sure you want to delete ${member.name}? This cannot be undone.`)) {
      deleteMember(member.id)
      loadMembers()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100">
      <main className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8 pb-6 border-b-2 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-elegant text-4xl font-semibold text-primary-800 mb-2 tracking-refined">Member Management</h1>
              <p className="text-primary-600 font-light">{members.length} total members</p>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="bg-primary-700 hover:bg-primary-800 text-white border-0 shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="mb-6 flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                const activeMembers = filteredMembers.filter(m => m.status === 'active')
                const emails = activeMembers.map(m => m.email).join(',')
                window.location.href = `mailto:${emails}`
              }}
              className="border-primary-300 text-primary-700 hover:bg-primary-50"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Filtered ({filteredMembers.length})
            </Button>
          </div>
        </div>

        {/* Members Table */}
        <Card className="border-2 border-primary-100 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-700 border-b-2 border-primary-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Join Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-cream-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-cream-50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-elegant font-medium text-primary-800">{member.name}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-primary-700">{member.email}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-primary-700">{member.phone}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-primary-700">{new Date(member.joinDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className={member.status === 'active' ? 'bg-primary-600' : 'bg-primary-300'}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleSendEmail(member)} title="Send Email">
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleCall(member)} title="Call">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(member)} title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(member)} title="Delete">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {filteredMembers.length === 0 && (
          <Card className="p-12 text-center border-2 border-primary-100 shadow-lg bg-white">
            <p className="text-primary-600 font-light">No members found matching your search.</p>
          </Card>
        )}
      </main>

      {/* Add Member Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <Label htmlFor="add-name">Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="add-email">Email *</Label>
              <Input
                id="add-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="add-phone">Phone *</Label>
              <Input
                id="add-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
                className="mt-2"
                placeholder="(516) 555-0123"
              />
            </div>
            <div>
              <Label htmlFor="add-status">Status *</Label>
              <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({...formData, status: value})}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Member Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateMember} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone *</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
                className="mt-2"
                placeholder="(516) 555-0123"
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status *</Label>
              <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({...formData, status: value})}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
