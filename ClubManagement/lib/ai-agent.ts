import OpenAI from "openai"
import { prisma } from "./prisma"
import { getSession } from "./auth"
import { getSettings, updateSettings } from "./settings-store"
import { generateGeminiContent, chatWithGemini } from "./gemini-api"

// Initialize OpenAI client (optional - can use Gemini instead)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "function"
  content: string
  name?: string
}

export interface AgentTool {
  name: string
  description: string
  parameters: any
}

/**
 * Available tools/functions the AI agent can use
 */
export const agentTools: AgentTool[] = [
  {
    name: "create_court_reservation",
    description: "Create a tennis court reservation for a member. Requires member ID, court number, date, and time.",
    parameters: {
      type: "object",
      properties: {
        memberId: { type: "string", description: "The member's ID" },
        resourceId: { type: "string", description: "Court number (e.g., 'Court 1', 'Court 2')" },
        startTime: { type: "string", description: "Start time in ISO format (YYYY-MM-DDTHH:mm:ss)" },
        endTime: { type: "string", description: "End time in ISO format (YYYY-MM-DDTHH:mm:ss)" },
        guests: { type: "number", description: "Number of guests (default: 0)" },
        fee: { type: "number", description: "Reservation fee (default: 0)" },
      },
      required: ["memberId", "resourceId", "startTime", "endTime"],
    },
  },
  {
    name: "search_members",
    description: "Search for members by name, email, or member number. Returns list of matching members.",
    parameters: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search term (name, email, or member number)" },
      },
      required: ["search"],
    },
  },
  {
    name: "get_member_details",
    description: "Get detailed information about a specific member including reservations and statements.",
    parameters: {
      type: "object",
      properties: {
        memberId: { type: "string", description: "The member's ID" },
      },
      required: ["memberId"],
    },
  },
  {
    name: "create_member",
    description: "Create a new member in the system. Requires first name, last name, email, tier, and status.",
    parameters: {
      type: "object",
      properties: {
        firstName: { type: "string", description: "Member's first name" },
        lastName: { type: "string", description: "Member's last name" },
        email: { type: "string", description: "Member's email address" },
        tier: {
          type: "string",
          enum: ["FULL_GOLF", "TENNIS_SOCIAL", "JUNIOR", "HONORARY"],
          description: "Membership tier",
        },
        status: {
          type: "string",
          enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"],
          description: "Member status",
        },
        houseAccountLimit: { type: "number", description: "House account limit (default: 5000)" },
      },
      required: ["firstName", "lastName", "email", "tier", "status"],
    },
  },
  {
    name: "update_member",
    description: "Update an existing member's information.",
    parameters: {
      type: "object",
      properties: {
        memberId: { type: "string", description: "The member's ID" },
        firstName: { type: "string", description: "Member's first name" },
        lastName: { type: "string", description: "Member's last name" },
        email: { type: "string", description: "Member's email address" },
        tier: {
          type: "string",
          enum: ["FULL_GOLF", "TENNIS_SOCIAL", "JUNIOR", "HONORARY"],
        },
        status: {
          type: "string",
          enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"],
        },
        houseAccountLimit: { type: "number" },
      },
      required: ["memberId"],
    },
  },
  {
    name: "get_reservations",
    description: "Get reservations for a specific date and resource type (TENNIS_COURT or TEE_TIME).",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format" },
        resourceType: {
          type: "string",
          enum: ["TENNIS_COURT", "TEE_TIME"],
          description: "Type of resource",
        },
      },
    },
  },
  {
    name: "get_settings",
    description: "Get club settings. Can get all settings or a specific section (club, billing, notifications, payments).",
    parameters: {
      type: "object",
      properties: {
        section: {
          type: "string",
          enum: ["all", "club", "billing", "notifications", "payments"],
          description: "Settings section to retrieve",
        },
      },
    },
  },
  {
    name: "update_settings",
    description: "Update club settings for a specific section.",
    parameters: {
      type: "object",
      properties: {
        section: {
          type: "string",
          enum: ["club", "billing", "notifications", "payments"],
          description: "Settings section to update",
        },
        settings: {
          type: "object",
          description: "Settings object with key-value pairs to update",
        },
      },
      required: ["section", "settings"],
    },
  },
  {
    name: "get_member_statements",
    description: "Get billing statements for a specific member.",
    parameters: {
      type: "object",
      properties: {
        memberId: { type: "string", description: "The member's ID" },
      },
      required: ["memberId"],
    },
  },
]

/**
 * Execute a tool/function call
 */
export async function executeTool(
  toolName: string,
  args: any,
  session: { id: string; role: string; email: string }
): Promise<any> {
  try {
    switch (toolName) {
      case "create_court_reservation": {
        const { memberId, resourceId, startTime, endTime, guests = 0, fee = 0 } = args

        // Check for overlapping reservations
        const overlapping = await prisma.reservation.findFirst({
          where: {
            resourceId,
            resourceType: "TENNIS_COURT",
            OR: [
              {
                startTime: { lt: new Date(endTime) },
                endTime: { gt: new Date(startTime) },
              },
            ],
          },
        })

        if (overlapping) {
          return {
            success: false,
            error: "This time slot overlaps with an existing reservation",
            conflict: {
              startTime: overlapping.startTime,
              endTime: overlapping.endTime,
            },
          }
        }

        const reservation = await prisma.reservation.create({
          data: {
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            resourceType: "TENNIS_COURT",
            resourceId,
            memberId,
            guests,
            fee,
          },
          include: {
            member: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        })

        return {
          success: true,
          reservation: {
            id: reservation.id,
            court: resourceId,
            memberName: `${reservation.member.firstName} ${reservation.member.lastName}`,
            startTime: reservation.startTime,
            endTime: reservation.endTime,
            guests: reservation.guests,
            fee: reservation.fee,
          },
        }
      }

      case "search_members": {
        const { search } = args
        const members = await prisma.member.findMany({
          where: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
          take: 10,
          orderBy: { memberNumber: "asc" },
        })

        return {
          success: true,
          members: members.map((m) => ({
            id: m.id,
            name: `${m.firstName} ${m.lastName}`,
            email: m.email,
            memberNumber: m.memberNumber,
            tier: m.tier,
            status: m.status,
          })),
        }
      }

      case "get_member_details": {
        const { memberId } = args
        const member = await prisma.member.findUnique({
          where: { id: memberId },
          include: {
            reservations: {
              take: 10,
              orderBy: { startTime: "desc" },
            },
            statements: {
              take: 5,
              orderBy: { billingPeriod: "desc" },
            },
          },
        })

        if (!member) {
          return { success: false, error: "Member not found" }
        }

        return {
          success: true,
          member: {
            id: member.id,
            name: `${member.firstName} ${member.lastName}`,
            email: member.email,
            memberNumber: member.memberNumber,
            tier: member.tier,
            status: member.status,
            houseAccountLimit: member.houseAccountLimit,
            recentReservations: member.reservations.map((r) => ({
              id: r.id,
              resourceId: r.resourceId,
              startTime: r.startTime,
              endTime: r.endTime,
              guests: r.guests,
              fee: r.fee,
            })),
            recentStatements: member.statements.map((s) => ({
              id: s.id,
              billingPeriod: s.billingPeriod,
              totalAmount: s.totalAmount,
              isPaid: s.isPaid,
            })),
          },
        }
      }

      case "create_member": {
        const { firstName, lastName, email, tier, status, houseAccountLimit = 5000 } = args

        // Check if email exists
        const existing = await prisma.member.findUnique({
          where: { email },
        })

        if (existing) {
          return { success: false, error: "Email already exists" }
        }

        // Get next member number
        const lastMember = await prisma.member.findFirst({
          orderBy: { memberNumber: "desc" },
        })
        const nextMemberNumber = lastMember ? lastMember.memberNumber + 1 : 2024001

        const member = await prisma.member.create({
          data: {
            firstName,
            lastName,
            email,
            memberNumber: nextMemberNumber,
            tier,
            status,
            houseAccountLimit,
          },
        })

        return {
          success: true,
          member: {
            id: member.id,
            name: `${member.firstName} ${member.lastName}`,
            email: member.email,
            memberNumber: member.memberNumber,
            tier: member.tier,
            status: member.status,
          },
        }
      }

      case "update_member": {
        const { memberId, ...updateData } = args

        const member = await prisma.member.findUnique({
          where: { id: memberId },
        })

        if (!member) {
          return { success: false, error: "Member not found" }
        }

        // Check email conflict if changing
        if (updateData.email && updateData.email !== member.email) {
          const emailExists = await prisma.member.findUnique({
            where: { email: updateData.email },
          })
          if (emailExists) {
            return { success: false, error: "Email already exists" }
          }
        }

        if (updateData.houseAccountLimit !== undefined) {
          updateData.houseAccountLimit = parseFloat(updateData.houseAccountLimit)
        }

        const updated = await prisma.member.update({
          where: { id: memberId },
          data: updateData,
        })

        return {
          success: true,
          member: {
            id: updated.id,
            name: `${updated.firstName} ${updated.lastName}`,
            email: updated.email,
            memberNumber: updated.memberNumber,
            tier: updated.tier,
            status: updated.status,
          },
        }
      }

      case "get_reservations": {
        const { date, resourceType = "TENNIS_COURT" } = args

        const where: any = { resourceType }

        if (date) {
          const startDate = new Date(date)
          startDate.setHours(0, 0, 0, 0)
          const endDate = new Date(date)
          endDate.setHours(23, 59, 59, 999)

          where.startTime = {
            gte: startDate,
            lte: endDate,
          }
        }

        const reservations = await prisma.reservation.findMany({
          where,
          include: {
            member: {
              select: {
                firstName: true,
                lastName: true,
                memberNumber: true,
              },
            },
          },
          orderBy: { startTime: "asc" },
        })

        return {
          success: true,
          reservations: reservations.map((r) => ({
            id: r.id,
            resourceId: r.resourceId,
            memberName: `${r.member.firstName} ${r.member.lastName}`,
            memberNumber: r.member.memberNumber,
            startTime: r.startTime,
            endTime: r.endTime,
            guests: r.guests,
            fee: r.fee,
          })),
        }
      }

      case "get_settings": {
        const { section = "all" } = args

        const settings = getSettings(section as any)

        return {
          success: true,
          settings,
        }
      }

      case "update_settings": {
        const { section, settings } = args

        if (!section || !settings) {
          return {
            success: false,
            error: "Section and settings are required",
          }
        }

        try {
          updateSettings(section as any, settings)

          return {
            success: true,
            settings: getSettings(section as any),
            message: `Settings for ${section} updated successfully`,
          }
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Failed to update settings",
          }
        }
      }

      case "get_member_statements": {
        const { memberId } = args
        const statements = await prisma.statement.findMany({
          where: { memberId },
          orderBy: { billingPeriod: "desc" },
        })

        return {
          success: true,
          statements: statements.map((s) => ({
            id: s.id,
            billingPeriod: s.billingPeriod,
            totalAmount: s.totalAmount,
            isPaid: s.isPaid,
          })),
        }
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` }
    }
  } catch (error: any) {
    console.error(`Error executing tool ${toolName}:`, error)
    return { success: false, error: error.message || "Tool execution failed" }
  }
}

/**
 * Process a chat message and return AI response
 */
export async function processChatMessage(
  messages: ChatMessage[],
  session: { id: string; role: string; email: string }
): Promise<{ message: string; toolCalls?: any[] }> {
  // Prefer Gemini if available, otherwise use OpenAI
  const useGemini = !!process.env.GOOGLE_GEMINI_API_KEY
  const useOpenAI = !!process.env.OPENAI_API_KEY && openai

  if (!useGemini && !useOpenAI) {
    return {
      message:
        "AI features are not configured. Please set GOOGLE_GEMINI_API_KEY or OPENAI_API_KEY in your environment variables.",
    }
  }

  // If using Gemini, process with Gemini API
  if (useGemini) {
    try {
      // Convert messages to Gemini format
      const geminiMessages = messages.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user" as "user" | "model",
        parts: [{ text: msg.content }],
      }))

      // Add system context
      const systemPrompt = `You are an AI assistant for EliteClub OS, a premium country club management system. You help users manage the club by:
- Creating and managing court reservations
- Adding, updating, and searching for members
- Retrieving information about members, reservations, and statements
- Updating club settings
- Answering questions about the club management system

You are helpful, professional, and proactive. When a user asks you to do something, guide them through the process.

Current user: ${session.email} (${session.role})
Current date: ${new Date().toISOString().split("T")[0]}`

      const response = await chatWithGemini([
        { role: "user", parts: [{ text: systemPrompt }] },
        ...geminiMessages,
      ])

      return {
        message: response,
      }
    } catch (error: any) {
      console.error("Error with Gemini API:", error)
      // Fallback to OpenAI if Gemini fails
      if (useOpenAI) {
        // Continue to OpenAI processing below
      } else {
        return {
          message: `I encountered an error: ${error.message}. Please try again.`,
        }
      }
    }
  }

  // Use OpenAI if Gemini is not available or if Gemini failed
  if (!useOpenAI) {
    return {
      message: "AI service unavailable. Please check your API keys.",
    }
  }

  try {
    // Prepare system message with context
    const systemMessage: ChatMessage = {
      role: "system",
      content: `You are an AI assistant for EliteClub OS, a premium country club management system. You help users manage the club by:

- Creating and managing court reservations
- Adding, updating, and searching for members
- Retrieving information about members, reservations, and statements
- Updating club settings
- Answering questions about the club management system

You are helpful, professional, and proactive. When a user asks you to do something, you should:
1. Ask for any missing information needed to complete the task
2. Execute the appropriate function/tool
3. Confirm the action was successful
4. Provide helpful follow-up information

Current user: ${session.email} (${session.role})
Current date: ${new Date().toISOString().split("T")[0]}

When creating reservations, always check for conflicts first. When searching for members, be flexible with name matching.`,
    }

    // Convert tools to OpenAI format
    const tools = agentTools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }))

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
      messages: [systemMessage, ...messages],
      tools,
      tool_choice: "auto",
      temperature: 0.7,
    })

    const response = completion.choices[0]

    // Handle tool calls
    if (response.message.tool_calls && response.message.tool_calls.length > 0) {
      const toolResults = []

      for (const toolCall of response.message.tool_calls) {
        const toolName = toolCall.function.name
        const toolArgs = JSON.parse(toolCall.function.arguments || "{}")

        const result = await executeTool(toolName, toolArgs, session)

        toolResults.push({
          tool_call_id: toolCall.id,
          role: "function" as const,
          name: toolName,
          content: JSON.stringify(result),
        })
      }

      // Get final response after tool execution
      const finalMessages: ChatMessage[] = [
        ...messages,
        {
          role: "assistant",
          content: response.message.content || "",
          name: "assistant",
        },
        ...toolResults,
      ]

      const finalCompletion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
        messages: [systemMessage, ...finalMessages],
        tools,
        tool_choice: "auto",
        temperature: 0.7,
      })

      return {
        message: finalCompletion.choices[0].message.content || "Task completed.",
        toolCalls: response.message.tool_calls,
      }
    }

    return {
      message: response.message.content || "I'm here to help!",
    }
  } catch (error: any) {
    console.error("Error processing chat message:", error)
    return {
      message: `I encountered an error: ${error.message}. Please try again.`,
    }
  }
}

