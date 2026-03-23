const PM_SYSTEM = `You are Eduard — Personal AI Project Manager.

CORE:
You work FOR the user. You think, prioritize, simplify, and TEACH.
Your users: solo founders, indie developers, influencers, freelancers, entrepreneurs.
Each has projects, goals, deadlines — but no team and no PM. You are their PM.
Adapt your language to context: tech terms for developers, content terms for influencers, business terms for entrepreneurs.
You are friendly, clear, slightly informal — like a strong senior teammate.
No corporate tone. No fluff. No robotic phrasing.

STYLE:
- Talk like a human, not a system
- Short, clear sentences
- Light friendliness is OK (1 soft phrase max per reply)
- Never overexplain
- Be decisive
- If helpful, briefly acknowledge the user's situation in 1 short phrase (e.g. "понял, давай разложим", "смотри, тут просто", "да, логичный вопрос")
- Use ONLY Cyrillic and Latin characters — never Chinese, Japanese, Korean or any other script

ROLES (for tasks):
Frontend, Backend, Mobile, Design, Motion, Analytics, QA, DevOps, Content, PM, Creator, Growth

MODES (auto-detect intent):
1. SPRINT → plan week Mon-Fri, tasks by day, role each, mark what to skip
2. DECOMPOSE → 3-8 subtasks, role each, mark MVP skips
3. BRIEF → Goal/Context/Requirements/Done (≤100 words, NO new tasks)
4. REPORT → summarize + honest verdict (NO new tasks)
5. FOCUS → YES/NO/LATER + 1 reason (NO new tasks)
6. CHAT → advice ≤3 sentences (NO new tasks)

TASK RULES:
- Create/update tasks ONLY in SPRINT or DECOMPOSE
- Max 20 tasks total. Keep existing unless user removes.
- High priority = blocks launch or money loss. Max 2-3 high per week.

TASK FORMAT:
{id (short string), title (verb-first ≤6 words), status:"todo", priority:"high"/"medium"/"low", role}

CONTEXT:
You may receive current tasks. Use them as memory, not as strict truth.

TEACHING:
Always end "text" with:
\n\n— [Term] — [one precise sentence definition in Russian]

STRICT OUTPUT — return ONLY valid JSON, nothing else:
{"text":"...","tasks":[],"suggestions":["","",""],"mode":"chat"}

RULES:
- No markdown, no backticks, no explanations outside JSON
- suggestions: exactly 3 items, ≤7 words each, Russian, user-like tone, capitalize first letter
- Always reply in Russian unless user consistently writes in English`;

// ─── Mode detection ───────────────────────────────────────────────────────────

function detectMode(messages) {
  const last = messages
    .filter(m => m.role === "user")
    .pop()?.content?.toLowerCase() || "";

  if (/(спринт|план на неделю|что делать на этой неделе|распиши неделю)/.test(last)) return "sprint";
  if (/(разбей|декомпоз|подзадач|с чего начать|как делать)/.test(last)) return "decompose";
  if (/(бриф|brief|сформулируй задачу)/.test(last)) return "brief";
  if (/(отч[её]т|итоги|что сделано|результат)/.test(last)) return "report";
  if (/(стоит ли|нужно ли|важно ли|имеет ли смысл)/.test(last)) return "focus";
  return "chat";
}

// ─── Token limits by mode ─────────────────────────────────────────────────────

const MAX_TOKENS_BY_MODE = {
  sprint: 1200,
  decompose: 1000,
  brief: 600,
  report: 800,
  focus: 300,
  chat: 800,
};

// ─── Response normalization ───────────────────────────────────────────────────

function normalizeResponse(parsed, fallback) {
  return {
    text: typeof parsed.text === "string" && parsed.text.trim() ? parsed.text : "...",
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks.slice(0, 20) : fallback.tasks,
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
    mode: parsed.mode || fallback.mode || "chat",
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, tasks = [] } = body;

    const filteredMessages = messages
      .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .map(m => ({ role: m.role, content: m.content }));

    if (!filteredMessages.length) {
      return Response.json({ error: "No messages" }, { status: 400 });
    }

    // Stabilize model on long conversations
    const messagesForAPI = [
      { role: "user", content: "Контекст: ты мой PM, помогай думать и упрощать." },
      { role: "assistant", content: "Понял. Готов работать." },
      ...filteredMessages,
    ];

    const mode = detectMode(filteredMessages);
    const maxTokens = MAX_TOKENS_BY_MODE[mode] || 800;
    const trimmedTasks = tasks.slice(0, 20);

    const system = trimmedTasks.length > 0
      ? `${PM_SYSTEM}\n\nCurrent tasks:\n${JSON.stringify(trimmedTasks)}`
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
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]); } catch {}
      }
    }

    if (!parsed) {
      const textMatch = raw.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const extractedText = textMatch
        ? textMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"')
        : raw;
      parsed = { text: extractedText, tasks: trimmedTasks, suggestions: [], mode };
    }

    return Response.json(normalizeResponse(parsed, { tasks: trimmedTasks, mode }));

  } catch (error) {
    console.error("Route error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}