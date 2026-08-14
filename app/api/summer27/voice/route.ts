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
    const prompt = `Parse a spoken tennis-club request. Today is ${weekday} ${today}.
Courts: Court 3 = court-1, Court 4 = court-2, hours 7–20.
Return ONLY JSON:
{
  "intent": "check_court"|"book_court"|"check_clinic"|"book_clinic"|"cancel"|"move"|"my_day"|"check_lesson"|"request_lesson"|"check_stringing"|"order_stringing"|"check_event"|"book_event"|"check_play"|"prices"|"unknown",
  "date": "YYYY-MM-DD"|null,
  "dateTo": "YYYY-MM-DD"|null,
  "hour": 7-20 or null,
  "hourTo": 7-20 or null,
  "timeOfDay": "morning"|"afternoon"|"evening"|null,
  "clinicHint": string|null,
  "courtId": "court-1"|"court-2"|null,
  "childName": string|null,
  "eventHint": string|null,
  "stringHint": "poly"|"gut"|"hybrid"|"synthetic"|"multifilament"|null,
  "tension": "52"|null,
  "priceTopic": "court"|"clinic"|"lesson"|"stringing"|"event"|"all"|null
}
Rules:
- tomorrow = next calendar day. this weekend = upcoming Sat (date) through Sun (dateTo).
- Saturday/Sunday morning clinics: 8am cardio, 9am point play. "sign up for 9am Sat clinic" → book_clinic, hour 9 (NOT 8), date next Saturday.
- If they name a clock time, set hour to that time in 24h (9am=9, 9pm=21) and do not pick a different clinic.
- "move my court at 4 to 5" → move, hour 16, hourTo 17.
- "put Emma in Tuesday juniors" → book_clinic, childName Emma, clinicHint juniors, date next Tuesday.
- "is my racket ready" → check_stringing. "poly at 52" → order_stringing.
- "how much is a guest court" → prices, priceTopic court.
- "anyone looking Saturday 11" → check_play.
- "what do I have this weekend" → my_day.
- sign up / sign me up / join / enroll / book = book_* intent.
- book/request never charges; we only route the player.

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
    for (const key of ["hour", "hourTo"] as const) {
      if (typeof intent[key] === "string") intent[key] = Number(intent[key]);
      if (typeof intent[key] === "number" && Number.isNaN(intent[key])) intent[key] = null;
    }
    return NextResponse.json({ ok: true, usedModel: true, intent });
  } catch {
    return NextResponse.json({ ok: true, usedModel: false, intent: null });
  }
}
