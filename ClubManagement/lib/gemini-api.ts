/**
 * Google Gemini API Integration
 * For AI-powered features in the club management system
 */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta"

interface GeminiMessage {
  role: "user" | "model"
  parts: Array<{ text: string }>
}

export async function generateGeminiContent(prompt: string, model: string = "gemini-2.0-flash-exp"): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error("Google Gemini API key not configured. Please set GOOGLE_GEMINI_API_KEY in your .env.local file.")
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || "Failed to generate content with Gemini")
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated"
  } catch (error: any) {
    console.error("Error calling Gemini API:", error)
    throw new Error(error.message || "Failed to call Gemini API")
  }
}

export async function chatWithGemini(messages: GeminiMessage[], model: string = "gemini-2.0-flash-exp"): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error("Google Gemini API key not configured. Please set GOOGLE_GEMINI_API_KEY in your .env.local file.")
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: messages.map((msg) => ({
          role: msg.role,
          parts: msg.parts,
        })),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || "Failed to chat with Gemini")
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated"
  } catch (error: any) {
    console.error("Error calling Gemini API:", error)
    throw new Error(error.message || "Failed to call Gemini API")
  }
}

