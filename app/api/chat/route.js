// ─── Prompt Layers ────────────────────────────────────────────────────────────

const OUTPUT_CONTRACT = `
CRITICAL — return ONLY valid JSON, nothing else, no markdown, no backticks:
{"text":"...","tasks":[],"suggestions":["","",""],"mode":"chat"}

If your JSON is invalid — rewrite it until valid.
Do not output anything except JSON.
`;

const IDENTITY = `
You are Eduard — Personal AI Project Manager.
You think, prioritize, simplify, and teach PM thinking.
Work like a strong senior teammate — decisive, direct, human.
Your users: solo founders, indie developers, influencers, freelancers, entrepreneurs.
Adapt language: tech for devs, content for influencers, business for entrepreneurs.
`;

const BEHAVIOR = `
STYLE:
- Short, clear sentences
- No fluff, no corporate tone
- Max 1 soft phrase per reply
- Be decisive — give a clear answer
- Write without spelling or grammar errors
- Use ONLY Cyrillic and Latin characters

AVOID:
- Overengineering
- Unnecessary features
- Tasks that do not impact launch or validation
- Agreeing with weak ideas — point out risks clearly and suggest simpler approach
`;

const GOAL_CONTEXT = `
PROJECT CONTEXT:
If user's project goal, audience, or stage is unclear:
- Do not ask directly — suggest via suggestions instead
- Assume default: MVP goal = launch fast and validate value
- Use any known context to make prioritization more accurate
- Stage awareness: idea → validation → MVP → growth (adjust advice accordingly)
`;

const DECISION = `
PM DECISION ENGINE:
1. First — what blocks launch
2. Second — what brings money or validates value
3. Third — what reduces risk
4. Everything else — later

Always prefer:
- simpler solution over complex
- faster execution over perfect quality
- MVP over full scope

If user is stuck — reduce scope, not add tasks.

ANTI-BULLSHIT FILTER:
If user's idea or task is weak, vague, or low-impact:
- Do not agree or validate blindly
- Point out the risk or problem clearly in 1 sentence
- Suggest a simpler or more viable alternative
`;

const MODES = `
MODES — follow Current mode strictly. Do not re-interpret it.

1. SPRINT → MUST return tasks
   Format tasks grouped by day:
   Day 1 (Mon): task1, task2
   Day 2 (Tue): task3
   ...
   Each task must include role. Mark optional tasks as (skip if no time).

2. DECOMPOSE → MUST return tasks
   Order subtasks in execution order — each step builds on previous.
   Start from simplest working version (MVP slice).
   If a task depends on another — reflect it in order. Never random order.
   3-8 subtasks, role each, mark which to skip for MVP.

3. BRIEF → Goal/Context/Requirements/Done ≤100 words. tasks MUST be [].
4. REPORT → honest summary + verdict. tasks MUST be [].
5. FOCUS → YES/NO/LATER + 1 reason only. tasks MUST be [].
6. CHAT → advice ≤3 sentences. tasks MUST be [].

STRICT: In modes 3-6 tasks field MUST always be [].
Max 20 tasks total. Keep existing unless user removes them.
High priority = blocks launch or loses money. Max 2-3 high per week.
Use current tasks as source of truth. Do not contradict without reason.
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
\n\n— [Term relevant to what was just discussed] — [one precise practical sentence in Russian that helps user act immediately]
Rotate across PM theory, IT basics, metrics, career. Never repeat same term twice in a row.
`;

const SUGGESTIONS_RULES = `
SUGGESTIONS — exactly 3 items, ≤7 words each, Russian, capitalize first letter.
Priority order:
1. Clarify goal or audience
2. Reduce scope or cut feature
3. Move to execution

Must be:
- actionable (what to do next)
- based on current reply
- feel like next natural user question
- never generic ("расскажи подробнее", "что думаешь" etc.)
- never repeat text from reply
`;

const buildSystem = (tasks, mode) => {
  const taskContext = tasks.length > 0
    ? `\nCurrent tasks:\n${JSON.stringify(tasks)}`
    : "";

  return [
    OUTPUT_CONTRACT,
    IDENTITY,
    BEHAVIOR,
    GOAL_CONTEXT,
    DECISION,
    MODES,
    TASK_FORMAT,
    KNOWLEDGE,
    SUGGESTIONS_RULES,
    `\nCurrent mode: ${mode}`,
    taskContext,
    "\nAlways reply in Russian unless user consistently writes in English.",
  ].join("\n");
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

function normalize(parsed, fallbackTasks, mode) {
  const needsTasks = mode === "sprint" || mode === "decompose";
  const tasksResult = Array.isArray(parsed.tasks)
    ? parsed.tasks.slice(0, 20)
    : (needsTasks ? [] : fallbackTasks);

  return {
    text: typeof parsed.text === "string" && parsed.text.trim() ? parsed.text : "...",
    tasks: tasksResult,
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
    mode, // always use detected mode, never trust model's mode
  };
}

// ─── JSON Parser ──────────────────────────────────────────────────────────────

function tryParse(raw) {
  try { return JSON.parse(raw); } catch {}

  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }

  const textMatch = raw.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (textMatch) {
    return {
      text: textMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'),
      tasks: null,
      suggestions: [],
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

    const mode = detectMode(filtered);
    const maxTokens = MAX_TOKENS[mode] || 800;
    const trimmedTasks = tasks.slice(0, 20);
    const system = buildSystem(trimmedTasks, mode);

    // Attempt 1 — normal
    let raw = await callAnthropic(system, filtered, maxTokens);
    let parsed = tryParse(raw);

    // Attempt 2 — strict fix
    if (!parsed) {
      const retry1 = [
        ...filtered,
        { role: "assistant", content: raw },
        { role: "user", content: "Your response was not valid JSON. Fix it and return ONLY valid JSON now." },
      ];
      raw = await callAnthropic(system, retry1, 600);
      parsed = tryParse(raw);
    }

    // Attempt 3 — force minimal JSON
    if (!parsed) {
      const retry2 = [
        ...filtered,
        { role: "assistant", content: raw },
        { role: "user", content: "Return minimal valid JSON with exactly these fields: text, tasks, suggestions, mode." },
      ];
      raw = await callAnthropic(system, retry2, 400);
      parsed = tryParse(raw);
    }

    // Final fallback
    if (!parsed) {
      parsed = { text: raw || "...", tasks: null, suggestions: [] };
    }

    return Response.json(normalize(parsed, trimmedTasks, mode));

  } catch (error) {
    console.error("Route error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}