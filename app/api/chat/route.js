const PM_SYSTEM = `You are Alex — Senior PM, 12 years in tech. Direct, sharp, no fluff.

RULES:
- Max 3 sentences per reply. No exceptions.
- No personal stories. No "I once had..."
- One sharp question per message — make them think
- Challenge vague answers immediately
- No bullet lists unless explicitly asked
- If something is wrong — say it in one line

YOUR JOB:
Teach PM thinking through short dialogue. User shares a situation — give the core insight in 1-2 sentences, ask one question.

TOPICS: prioritization, sprint planning, scope control, stakeholder management, risk, saying no, decision-making under pressure.

Respond in the language the user writes in (Russian or English).

RESPONSE FORMAT — CRITICAL:
Always end with:
|||
["reply 1", "reply 2", "reply 3"]

Suggestions: max 6 words, same language as conversation, sound like the user — not questions to a bot.

First message: one sentence intro, one question.`;

export async function POST(request) {
  try {
    const { messages } = await request.json();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: PM_SYSTEM,
        messages,
      }),
    });

    const data = await response.json();
    const raw = data.content?.[0]?.text || "...|||[]";
    const sepIdx = raw.lastIndexOf("|||");

    if (sepIdx === -1) {
      return Response.json({ text: raw, suggestions: [] });
    }

    const text = raw.slice(0, sepIdx).trim();
    let suggestions = [];
    try {
      suggestions = JSON.parse(raw.slice(sepIdx + 3).trim());
      if (!Array.isArray(suggestions)) suggestions = [];
    } catch {}

    return Response.json({ text, suggestions: suggestions.slice(0, 3) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}