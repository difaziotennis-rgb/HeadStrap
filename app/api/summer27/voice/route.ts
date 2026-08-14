import { NextResponse } from "next/server";

type Body = {
  transcript?: string;
  today?: string;
  weekday?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const transcript = (body.transcript || "").trim();
    if (!transcript) {
      return NextResponse.json({ error: "Nothing to parse." }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ ok: true, usedModel: false, intent: null });
    }

    const today = body.today || "";
    const weekday = body.weekday || "";
    const prompt = `You parse spoken tennis-club requests into JSON.

Today is ${weekday} ${today}. Club courts are Court 3 (court-1) and Court 4 (court-2), hours 7–20.
Clinics include Tennis 101, Men's Cardio, weekend AM cardio, weekend point play, ladies doubles, weeknight clinics, juniors.

Return ONLY JSON:
{
  "intent": "check_court" | "book_court" | "check_clinic" | "book_clinic" | "unknown",
  "date": "YYYY-MM-DD" or null,
  "hour": 7-20 integer or null (4pm=16, 9am=9),
  "timeOfDay": "morning" | "afternoon" | "evening" | null,
  "clinicHint": short string or null,
  "courtId": "court-1" | "court-2" | null
}

Rules:
- "tomorrow" is the day after today.
- "Saturday AM clinic" → next Saturday, timeOfDay morning, check_clinic.
- "book a court at 9am" → book_court, hour 9, date today if still before 9 else tomorrow unless they named a day.
- Do not invent a date if none was said, except book_court as above.

Request: ${transcript}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        messages: [
          { role: "system", content: "Return only valid JSON. No markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ ok: true, usedModel: false, intent: null });
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content || "";
    const json = raw.replace(/```json|```/g, "").trim();
    const intent = JSON.parse(json) as Record<string, unknown>;
    if (typeof intent.hour === "string") intent.hour = Number(intent.hour);
    if (typeof intent.hour === "number" && Number.isNaN(intent.hour)) intent.hour = null;
    return NextResponse.json({ ok: true, usedModel: true, intent });
  } catch {
    return NextResponse.json({ ok: true, usedModel: false, intent: null });
  }
}
