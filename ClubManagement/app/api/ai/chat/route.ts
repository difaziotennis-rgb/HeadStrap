import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { processChatMessage, ChatMessage } from "@/lib/ai-agent"

/**
 * POST /api/ai/chat
 * Process a chat message and return AI response
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 })
    }

    // Convert messages to ChatMessage format
    const chatMessages: ChatMessage[] = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      name: msg.name,
    }))

    // Process the chat message
    const result = await processChatMessage(chatMessages, {
      id: session.id,
      role: session.role,
      email: session.email,
    })

    return NextResponse.json({
      success: true,
      message: result.message,
      toolCalls: result.toolCalls,
    })
  } catch (error: any) {
    console.error("Error in AI chat API:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process chat message" },
      { status: 500 }
    )
  }
}


