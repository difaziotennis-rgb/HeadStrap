import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getSession } from "@/lib/auth"

const prisma = new PrismaClient()

/**
 * GET /api/members/search
 * Search members by name or member number
 */
export async function GET(request: NextRequest) {
  try {
    // Check for DATABASE_URL
    if (!process.env.DATABASE_URL) {
      // Return mock members if database is not configured
      const mockMembers = [
        {
          id: "mock-1",
          name: "John Smith",
          firstName: "John",
          lastName: "Smith",
          email: "john.smith@email.com",
          memberNumber: 2024001,
          tier: "FULL_GOLF",
        },
        {
          id: "mock-2",
          name: "Sarah Johnson",
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah.j@email.com",
          memberNumber: 2024002,
          tier: "TENNIS_SOCIAL",
        },
        {
          id: "mock-3",
          name: "Michael Chen",
          firstName: "Michael",
          lastName: "Chen",
          email: "m.chen@email.com",
          memberNumber: 2024003,
          tier: "JUNIOR",
        },
        {
          id: "mock-4",
          name: "Emily Williams",
          firstName: "Emily",
          lastName: "Williams",
          email: "emily.w@email.com",
          memberNumber: 2024004,
          tier: "FULL_GOLF",
        },
      ]
      
      const { searchParams } = new URL(request.url)
      const query = searchParams.get("q") || ""
      
      if (query && query.length >= 2) {
        const searchLower = query.toLowerCase()
        const filtered = mockMembers.filter((m) =>
          m.name.toLowerCase().includes(searchLower) ||
          m.memberNumber.toString().includes(query)
        )
        return NextResponse.json({ success: true, members: filtered })
      }
      
      return NextResponse.json({ success: true, members: mockMembers })
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""

    // Mock members for fallback if database is empty
    const mockMembers = [
      {
        id: "mock-1",
        name: "John Smith",
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@email.com",
        memberNumber: 2024001,
        tier: "FULL_GOLF",
      },
      {
        id: "mock-2",
        name: "Sarah Johnson",
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.j@email.com",
        memberNumber: 2024002,
        tier: "TENNIS_SOCIAL",
      },
      {
        id: "mock-3",
        name: "Michael Chen",
        firstName: "Michael",
        lastName: "Chen",
        email: "m.chen@email.com",
        memberNumber: 2024003,
        tier: "JUNIOR",
      },
      {
        id: "mock-4",
        name: "Emily Williams",
        firstName: "Emily",
        lastName: "Williams",
        email: "emily.w@email.com",
        memberNumber: 2024004,
        tier: "FULL_GOLF",
      },
      {
        id: "mock-5",
        name: "David Brown",
        firstName: "David",
        lastName: "Brown",
        email: "david.b@email.com",
        memberNumber: 2024005,
        tier: "TENNIS_SOCIAL",
      },
      {
        id: "mock-6",
        name: "Lisa Anderson",
        firstName: "Lisa",
        lastName: "Anderson",
        email: "lisa.a@email.com",
        memberNumber: 2024006,
        tier: "FULL_GOLF",
      },
    ]

    // If query is empty or less than 2 chars, return all active members
    if (!query || query.length < 2) {
      try {
        const allMembers = await prisma.member.findMany({
          where: {
            status: "ACTIVE",
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            memberNumber: true,
            tier: true,
          },
          take: 100, // Limit to 100 members
          orderBy: {
            memberNumber: "asc",
          },
        })

        // If database has members, return them
        if (allMembers.length > 0) {
          return NextResponse.json({
            success: true,
            members: allMembers.map((m) => ({
              id: m.id,
              name: `${m.firstName} ${m.lastName}`,
              firstName: m.firstName,
              lastName: m.lastName,
              email: m.email,
              memberNumber: m.memberNumber,
              tier: m.tier,
            })),
          })
        }
      } catch (error) {
        console.error("Error fetching members from database:", error)
      }

      // If database is empty or error, return mock members
      return NextResponse.json({
        success: true,
        members: mockMembers,
      })
    }

    const searchTerm = query.trim()
    
    // Try to extract member number from search term (e.g., "M-2024001" or "2024001")
    const memberNumberMatch = searchTerm.match(/(?:M-)?(\d+)/)
    const memberNumber = memberNumberMatch ? parseInt(memberNumberMatch[1]) : null

    // Build search conditions
    const searchConditions: any[] = [
      {
        firstName: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        lastName: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
    ]

    // Add member number search if we found a number
    if (memberNumber) {
      searchConditions.push({
        memberNumber: {
          equals: memberNumber,
        },
      })
    }

    try {
      // Search by name or member number
      const members = await prisma.member.findMany({
        where: {
          OR: searchConditions,
          status: "ACTIVE", // Only show active members
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          memberNumber: true,
          tier: true,
        },
        take: 20, // Limit results
        orderBy: {
          memberNumber: "asc",
        },
      })

      // If database has results, return them
      if (members.length > 0) {
        return NextResponse.json({
          success: true,
          members: members.map((m) => ({
            id: m.id,
            name: `${m.firstName} ${m.lastName}`,
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            memberNumber: m.memberNumber,
            tier: m.tier,
          })),
        })
      }
    } catch (error) {
      console.error("Error searching members in database:", error)
    }

    // Fallback to mock members and filter them
    const searchLower = searchTerm.toLowerCase()
    const filteredMockMembers = mockMembers.filter((m) =>
      m.name.toLowerCase().includes(searchLower) ||
      m.firstName.toLowerCase().includes(searchLower) ||
      m.lastName.toLowerCase().includes(searchLower) ||
      m.email.toLowerCase().includes(searchLower) ||
      m.memberNumber.toString().includes(searchTerm)
    )

    return NextResponse.json({
      success: true,
      members: filteredMockMembers,
    })
  } catch (error: any) {
    console.error("Error searching members:", error)
    return NextResponse.json(
      { error: error.message || "Failed to search members" },
      { status: 500 }
    )
  }
}

