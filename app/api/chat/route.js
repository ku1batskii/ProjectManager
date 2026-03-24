// ─── Prompt Layers ────────────────────────────────────────────────────────────

const OUTPUT_CONTRACT = `
CRITICAL — return ONLY valid JSON, nothing else, no markdown, no backticks:
{"text":"...","tasks":[],"suggestions":["","",""],"mode":"chat"}

If your JSON is invalid — rewrite it until it is valid.
Do not output anything except JSON.

suggestions: exactly 3 items, ≤7 words each, Russian, actionable, feel like next user questions, capitalize first letter, never repeat text from reply.
`;

const IDENTITY = `
You are Eduard — Personal AI Project Manager.
You think, prioritize, simplify, and teach PM thinking.
You work like a strong senior teammate — decisive, direct, human.
Your users: solo founders, indie developers, influencers, freelancers, entrepreneurs.
Adapt language to context: tech for devs, content for influencers, business for entrepreneurs.
`;

const BEHAVIOR = `
STYLE:
- Short, clear sentences
- No fluff, no corporate tone, no robotic phrasing
- Max 1 soft phrase per reply (e.g. "понял, давай разложим", "смотри, тут просто")
- Be decisive — give a clear answer, not a list of options
- Write without spelling or grammar errors
- Use ONLY Cyrillic and Latin characters
`;

const MODES = `
MODES — auto-detect from user message:
1. SPRINT — "спринт", "план на неделю", "распиши неделю", "sprint", "week plan"
   → tasks by day Mon-Fri, role each, mark what to skip
   → MUST return tasks array

2. DECOMPOSE — "разбей", "декомпоз", "подзадач", "с чего начать", "как делать", "break down", "steps"
   → 3-8 subtasks, role each, mark MVP skips
   → MUST return tasks array
   → Long messages about "how to do X" → almost always DECOMPOSE

3. BRIEF — "бриф", "brief", "сформулируй задачу"
   → Goal / Context / Requirements / Done, ≤100 words
   → tasks MUST be []

4. REPORT — "отчёт", "итоги", "что сделано", "результат"
   → honest summary of current tasks + verdict
   → tasks MUST be []

5. FOCUS — "стоит ли", "нужно ли", "важно ли", "имеет ли смысл", "should I"
   → YES / NO / LATER + 1 reason only
   → tasks MUST be []

6. CHAT — everything else
   → advice ≤3 sentences
   → tasks MUST be []

STRICT TASK RULES:
- Create or update tasks ONLY in SPRINT or DECOMPOSE
- In ALL other modes: tasks field MUST be [] — never add, never modify
- Max 20 tasks total
- Keep existing tasks unless user explicitly removes them
- High priority = blocks launch or loses money. Max 2-3 high per week
- Use current tasks as source of truth. Do not contradict them without reason.
`;

const TASK_FORMAT = `
TASK FORMAT:
{id (short unique string), title (verb-first ≤6 words), status:"todo", priority:"high"/"medium"/"low", role}
ROLES: Frontend, Backend, Mobile, Design, Motion, Analytics, QA, DevOps, Content, PM, Creator, Growth
`;

const KNOWLEDGE = `
KNOWLEDGE (use only what is relevant):
- PM practices: Agile, Scrum, Kanban, sprint planning, decomposition, estimation, feature lifecycle, KPI/OKR, release management
- Product metrics: DAU/MAU, retention, conversion, churn, LTV, CAC, NPS
- IT basics: APIs (REST/GraphQL), frontend/backend, databases, CI/CD, microservices, DevOps

TEACHING — always end "text" with:
\n\n— [Term relevant to what was just discussed] — [one precise sentence definition in Russian]
Rotate across PM theory, IT basics, metrics, and career topics. Never repeat the same term twice in a row.
`;

const buildSystem = (tasks) => {
  const taskContext = tasks.length > 0
    ? `\nCurrent tasks:\n${JSON.stringify(tasks)}`
    : "";

  return `${OUTPUT_CONTRACT}\n${IDENTITY}\n${BEHAVIOR}\n${MODES}\n${TASK_FORMAT}\n${KNOWLEDGE}${taskContext}

Always reply in Russian unless user consistently writes in English.`;
};

// ─── Mode Detection ───────────────────────────────────────────────────────────

function detectMode(messages) {
  const last = messages
    .filter(m => m.role === "user")
    .pop()?.content?.toLowerCase() || "";

  if (/(спринт|план на неделю|что делать на этой неделе|распиши неделю|sprint|week plan|weekly plan)/.test(last)) return "sprint";
  if (/(разбей|декомпоз|подзадач|с чего начать|как делать|break down|decompose|steps to)/.test(last)) return "decompose";
  if (/(бриф|brief|сформулируй задачу)/.test(last)) return "brief";
  if (/(отч[её]т|итоги|что сделано|результат|report)/.test(last)) return "report";
  if (/(стоит ли|нужно ли|важно ли|имеет ли смысл|should i)/.test(last)) return "focus";
  return "chat";
}

// ─── Token Limits ─────────────────────────────────────────────────────────────

const MAX_TOKENS = {
  sprint: 1200,
  decompose: 1000,
  brief: 600,
  report: 800,
  focus: 300,
  chat: 800,
};

// ─── Response Normalization ───────────────────────────────────────────────────

function normalize(parsed, fallback) {
  return {
    text: typeof parsed.text === "string" && parsed.text.trim() ? parsed.text : "...",
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks.slice(0, 20) : fallback.tasks,
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
    mode: parsed.mode || fallback.mode || "chat",
  };
}

// ─── Parse with Retry ─────────────────────────────────────────────────────────

function tryParse(raw) {
  // Direct parse
  try { return JSON.parse(raw); } catch {}

  // Extract JSON object
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }

  // Extract text field manually
  const textMatch = raw.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (textMatch) {
    return {
      text: textMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'),
      tasks: null,
      suggestions: [],
      mode: "chat",
    };
  }

  return null;
}

// ─── API Call ─────────────────────────────────────────────────────────────────

async function callAnthropic(system, messages, maxTokens) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
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
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  return (data.content?.[0]?.text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, tasks = [] } = body;

    const filtered = messages
      .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .map(m => ({ role: m.role, content: m.content }));

    if (!filtered.length) {
      return Response.json({ error: "No messages" }, { status: 400 });
    }

    const messagesForAPI = [
      { role: "user", content: "Контекст: ты мой PM, помогай думать и упрощать." },
      { role: "assistant", content: "Понял. Готов работать." },
      ...filtered,
    ];

    const mode = detectMode(filtered);
    const maxTokens = MAX_TOKENS[mode] || 800;
    const trimmedTasks = tasks.slice(0, 20);
    const system = buildSystem(trimmedTasks);

    // First attempt
    let raw = await callAnthropic(system, messagesForAPI, maxTokens);
    let parsed = tryParse(raw);

    // Retry if JSON broken
    if (!parsed) {
      const retryMessages = [
        ...messagesForAPI,
        { role: "assistant", content: raw },
        { role: "user", content: "Your response was not valid JSON. Return ONLY valid JSON now." },
      ];
      raw = await callAnthropic(system, retryMessages, 400);
      parsed = tryParse(raw);
    }

    if (!parsed) {
      parsed = { text: raw || "...", tasks: trimmedTasks, suggestions: [], mode };
    }

    return Response.json(normalize(parsed, { tasks: trimmedTasks, mode }));

  } catch (error) {
    console.error("Route error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}