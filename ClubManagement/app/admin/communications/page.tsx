"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Mail, MessageSquare, Bell, Send, Users, Calendar } from "lucide-react"

export default function CommunicationsPage() {
  const [messageType, setMessageType] = useState("email")
  const [recipientType, setRecipientType] = useState("all")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to send message")
      }
      return response.json()
    },
    onSuccess: () => {
      alert("Message sent successfully!")
      setSubject("")
      setMessage("")
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to send message")
    },
  })

  const handleSend = () => {
    if (!message) {
      alert("Please enter a message")
      return
    }
    sendMessageMutation.mutate({
      messageType,
      recipientType,
      subject,
      message,
    })
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl font-display font-medium tracking-tight text-primary mb-2">
          Communications
        </h1>
        <p className="text-slate-600 font-sans">
          Send emails, SMS, and push notifications to members
        </p>
      </div>

      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose">Compose Message</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Message History</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Send Message</CardTitle>
              <CardDescription className="font-sans">
                Reach out to members via email, SMS, or push notification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Message Type</Label>
                  <Select value={messageType} onValueChange={setMessageType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>Email</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="sms">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>SMS</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="push">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          <span>Push Notification</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Recipients</Label>
                  <Select value={recipientType} onValueChange={setRecipientType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members</SelectItem>
                      <SelectItem value="active">Active Members Only</SelectItem>
                      <SelectItem value="tier">By Membership Tier</SelectItem>
                      <SelectItem value="custom">Custom Selection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter message subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message..."
                  className="flex min-h-[200px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSend}
                  variant="luxury"
                  className="gap-2 min-w-0"
                  disabled={sendMessageMutation.isPending}
                >
                  <Send className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{sendMessageMutation.isPending ? "Sending..." : "Send Message"}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Save draft to localStorage
                    localStorage.setItem("draft_message", JSON.stringify({ messageType, recipientType, subject, message }))
                    alert("Draft saved!")
                  }}
                >
                  <span>Save as Draft</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Message Templates</CardTitle>
              <CardDescription className="font-sans">
                Pre-written templates for common communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Event Reminder", type: "email", icon: Calendar },
                  { name: "Statement Notification", type: "email", icon: Mail },
                  { name: "Booking Confirmation", type: "sms", icon: MessageSquare },
                  { name: "Promotion Alert", type: "push", icon: Bell },
                ].map((template) => (
                  <Card key={template.name} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <template.icon className="h-5 w-5 text-gold" />
                          <div>
                            <p className="font-sans font-semibold">{template.name}</p>
                            <p className="text-sm text-slate-500 font-sans">{template.type}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Load template
                            setMessageType(template.type)
                            setSubject(template.name)
                            setMessage(`This is a template for ${template.name}. Customize this message as needed.`)
                            // Switch to compose tab
                            const tabs = document.querySelector('[value="compose"]') as HTMLElement
                            if (tabs) tabs.click()
                          }}
                        >
                          Use
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Message History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 font-sans text-center py-8">
                No messages sent yet
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

