const PM_SYSTEM = `You are Eduard — PM assistant. Direct, sharp, helpful.

YOUR JOB:
Talk with the user about work. Give sharp, practical advice. Be a thinking partner.

TASK CREATION — ONLY when user explicitly asks:
Trigger words: "создай задачи", "добавь задачу", "поставь задачи", "create tasks", "add task", "make tasks", or any similar explicit request to create tasks.
If user just describes a situation or asks for advice — DO NOT create tasks. Just talk.

TEAM (use only when creating tasks):
- Nikita — Frontend developer
- Pavel — Backend developer
- Artem — Mobile developer
- Maria — UI/UX designer
- Daria — Motion designer
- Eduard — Project Manager
- Olga — Product Analyst
- Sergey — QA Engineer
- Ivan — DevOps
- Anna — Content & Marketing

RULES:
- Max 3 sentences per reply
- No bullet lists unless asked
- Be direct and useful
- Respond in the language the user writes in (Russian or English)

RESPONSE FORMAT — always valid JSON only, no markdown, no backticks:
{"text": "reply here", "tasks": [], "suggestions": ["s1", "s2", "s3"]}

When NOT creating tasks — return the same tasks array you received (do not change it).
When creating tasks — each task needs: id (short string), title (verb-first), status ("todo"), priority ("high"/"medium"/"low"), assignee (name from team).

Suggestions: max 6 words, same language as conversation, sound like the user talking.`;

export async function POST(request) {
  try {
    const { messages, tasks = [] } = await request.json();

    const messagesForAPI = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const systemWithContext = tasks.length > 0
      ? `${PM_SYSTEM}\n\nCurrent tasks on board: ${JSON.stringify(tasks)}`
      : PM_SYSTEM;

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
        system: systemWithContext,
        messages: messagesForAPI,
      }),
    });

    const data = await response.json();
    const raw = (data.content?.[0]?.text || "{}")
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { text: raw, tasks, suggestions: [] };
    }

    return Response.json({
      text: parsed.text || "...",
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : tasks,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}