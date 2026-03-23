const PM_SYSTEM = `You are Eduard — Personal AI Project Manager. Direct, no fluff. Work FOR the user, TEACH simultaneously.

ROLES (for tasks): Frontend, Backend, Mobile, Design, Motion, Analytics, QA, DevOps, Content, PM

MODES (auto-detect):
1. SPRINT — "спланируй спринт", "план на неделю" → tasks by day Mon-Fri, role each, flag what to skip
2. DECOMPOSE — "разбей", "декомпозируй", "подзадачи" → 3-8 subtasks, role each, flag MVP skips
3. BRIEF — "бриф" → Goal/Context/Requirements/Done, max 100 words, NO new tasks
4. REPORT — "отчёт", "итоги" → summarize tasks, honest verdict, NO new tasks
5. FOCUS — "стоит ли", "нужно ли" → YES/NO/LATER + one reason, NO new tasks
6. CHAT — everything else → advice, max 3 sentences, NO new tasks

TASK FORMAT: {id, title (verb-first ≤6 words), status:"todo", priority:"high"/"medium"/"low", role}
- Create tasks ONLY in modes 1-2. Other modes: return tasks unchanged.
- Max 20 tasks. Keep existing unless user removes.
- High = blocks launch or loses money. Max 2-3 high per week.

TEACHING: always end "text" with:
\n\n— [Term] — [one precise sentence definition in Russian]

RESPONSE: valid JSON only, no markdown, no backticks:
{"text":"...ending with — definition","tasks":[],"suggestions":["s1","s2","s3"],"mode":"chat"}

suggestions: 3 items, ≤7 words, Russian, contextual, sound like the user. Always capitalize first letter.
ALWAYS reply in Russian. Use only Cyrillic and Latin characters. Never use Chinese, Japanese, Korean or any other non-Latin/Cyrillic characters.

// Dynamic max_tokens by mode — faster and cheaper
const MAX_TOKENS_BY_MODE = {
  sprint: 1200,
  decompose: 1000,
  brief: 600,
  report: 800,
  focus: 300,
  chat: 800,
};

// Detect mode from last user message to set tokens before API call
function detectMode(messages) {
  const last = messages.filter(m => m.role === "user").pop()?.content?.toLowerCase() || "";
  if (/спланируй|план на неделю|sprint|что делать на этой неделе/.test(last)) return "sprint";
  if (/разбей|декомпозируй|подзадачи|breakdown|с чего начать/.test(last)) return "decompose";
  if (/бриф|brief/.test(last)) return "brief";
  if (/отчёт|итоги|что сделано|report/.test(last)) return "report";
  if (/стоит ли|нужно ли|важно ли|should i/.test(last)) return "focus";
  return "chat";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, tasks = [] } = body;

    const messagesForAPI = messages
      .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .map(m => ({ role: m.role, content: m.content }));

    if (!messagesForAPI.length) {
      return Response.json({ error: "No messages" }, { status: 400 });
    }

    const mode = detectMode(messagesForAPI);
    const maxTokens = MAX_TOKENS_BY_MODE[mode] || 500;

    // Only include tasks in context if they exist — saves tokens
    const system = tasks.length > 0
      ? `${PM_SYSTEM}\n\nТекущие задачи: ${JSON.stringify(tasks)}`
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
        max_tokens: maxTokens,
        system,
        messages: messagesForAPI,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return Response.json({ error: err.error?.message || "API error" }, { status: response.status });
    }

    const data = await response.json();
    const raw = (data.content?.[0]?.text || "")
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try to find JSON object
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]); } catch {}
      }
    }

    // Fallback: extract text field manually
    if (!parsed) {
      const textMatch = raw.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const extractedText = textMatch
        ? textMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"')
        : raw;
      parsed = { text: extractedText, tasks, suggestions: [], mode };
    }

    return Response.json({
      text: parsed.text || "...",
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : tasks,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
      mode: parsed.mode || mode,
    });

  } catch (error) {
    console.error("Route error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}