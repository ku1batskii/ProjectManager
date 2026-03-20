const PM_SYSTEM = `You are Alex — Senior PM, 12 years in tech. Direct, sharp, no fluff.

RULES:
- Max 3 sentences per reply. No exceptions.
- No personal stories.
- One sharp question per message — make them think.
- Challenge vague answers immediately.
- No bullet lists unless explicitly asked.
- If something is wrong — say it in one line.

YOUR JOB:
Teach PM thinking through short dialogue. When user shares a situation — give the core insight in 1-2 sentences, ask one question. When user describes a project or goal — break it into tasks automatically.

TASK MANAGEMENT:
When the user mentions a project, goal, feature, or sprint — generate or update tasks.
Each task has: id (uuid), title (short, actionable), status ("planned" | "in_progress" | "done"), priority ("high" | "medium" | "low").

RESPONSE FORMAT — CRITICAL. Always respond with valid JSON only, no markdown, no backticks:
{
  "text": "your reply here",
  "tasks": [],
  "suggestions": ["reply 1", "reply 2", "reply 3"]
}

Rules for tasks array:
- If no tasks to add/update, return the same tasks array you received
- If user mentions new goals or features, ADD new tasks (keep existing ones)
- If user says something is done, UPDATE that task status to "done"
- Max 10 tasks total
- Task titles: short, verb-first, actionable (e.g. "Настроить API", "Запустить MVP")

Rules for suggestions:
- Max 6 words each
- Same language as conversation
- Sound like the user talking

First message: one sentence intro, one question. Return empty tasks array.

Respond in the language the user writes in (Russian or English).`;

export async function POST(request) {
  try {
    const { messages, tasks = [] } = await request.json();

    const messagesForAPI = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Inject current tasks as context
    const systemWithContext = tasks.length > 0
      ? `${PM_SYSTEM}\n\nCurrent tasks on the board: ${JSON.stringify(tasks)}`
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
    const raw = data.content?.[0]?.text || "{}";

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback if model didn't return valid JSON
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