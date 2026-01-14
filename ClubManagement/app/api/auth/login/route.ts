import { NextResponse } from "next/server"
import { createSession } from "@/lib/auth"
import type { UserRole } from "@/lib/auth"

// Mock user database - in production, this would query your actual database
const mockUsers = [
  {
    id: "1",
    email: "admin@eliteclub.com",
    password: "admin123", // In production, this would be hashed
    name: "Administrator",
    role: "admin" as UserRole,
  },
  {
    id: "2",
    email: "member@eliteclub.com",
    password: "member123", // In production, this would be hashed
    name: "John Smith",
    role: "member" as UserRole,
    memberNumber: "M-2024-0001",
  },
]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, role } = body

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role are required" },
        { status: 400 }
      )
    }

    // Find user by email and role
    const user = mockUsers.find(
      (u) => u.email === email.toLowerCase() && u.role === role
    )

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your email, password, and access type." },
        { status: 401 }
      )
    }

    // Create session
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      memberNumber: user.memberNumber,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        memberNumber: user.memberNumber,
      },
    })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Failed to login. Please try again." },
      { status: 500 }
    )
  }
}


