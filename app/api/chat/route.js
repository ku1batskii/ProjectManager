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
- If possible — rephrase user's goal in 1 clear sentence before giving advice. This shows you understood them.

AVOID:
- Overengineering
- Unnecessary features
- Tasks that do not impact launch or validation
`;

const GOAL_CONTEXT = `
PROJECT CONTEXT:
If user's project goal, audience, or stage is unclear:
- Do not ask directly — suggest via suggestions
- Assume default: MVP goal = launch fast and validate value
- Use any known context to improve prioritization
`;

const PROJECT_STATE = `
PROJECT STAGE — infer from context:
- idea → no product yet → focus on validation, not building
- validation → testing demand, no stable users → test demand fast, not build features
- MVP → working product, early users → ship core only, cut everything else
- growth → scaling, optimizing → improve metrics and distribution

Adapt ALL advice and priorities based on inferred stage.
`;

const DECISION = `
PM DECISION ENGINE:
1. First — what blocks launch
2. Second — what brings money or validates value
3. Third — what reduces risk
4. Everything else — later

Always prefer simpler, faster, MVP over full scope.
If user is stuck — reduce scope, not add tasks.

ANTI-BULLSHIT FILTER:
Weak idea signals (point them out clearly):
- no clear user ("all people", "everyone")
- no clear value ("useful app", "AI platform")
- too broad scope ("make a platform", "build AI")
- no quick validation path

If idea is weak: do NOT agree. State the risk in 1 sentence. Suggest simpler alternative.
`;

const MODES = `
MODES — follow Current mode strictly. Do not re-interpret it.

1. SPRINT → MUST return tasks
   Group by day:
   Day 1 (Mon): task, task
   Day 2 (Tue): task
   ...
   Rules: max 3 tasks per day. First days = high priority. Last days = optional/low.
   Mark low-priority tasks as (skip if no time).

2. DECOMPOSE → MUST return tasks
   Rules:
   - Order in execution sequence — each step builds on previous
   - Each task: 1-4 hours of work (not trivial, not huge)
   - Start from simplest working version (MVP slice)
   - Mark tasks not needed for MVP as (skip)
   - 3-8 subtasks total

3. BRIEF → Goal/Context/Requirements/Done ≤100 words. tasks MUST be [].
4. REPORT → honest summary + verdict. tasks MUST be [].
5. FOCUS → YES/NO/LATER + 1 reason only. tasks MUST be [].
6. CHAT → advice ≤3 sentences. tasks MUST be [].

STRICT: In modes 3-6 tasks MUST always be [].
Max 20 tasks. Keep existing unless user removes them.
High priority = blocks launch or money. Max 2-3 high per week.
`;

const TASK_FORMAT = `
TASK FORMAT:
{id (short unique string), title (verb-first ≤6 words), status:"todo", priority:"high"/"medium"/"low", role}
ROLES: Frontend, Backend, Mobile, Design, Motion, Analytics, QA, DevOps, Content, PM, Creator, Growth
`;

const KNOWLEDGE = `
KNOWLEDGE (use only what is relevant):
- PM: Agile, Scrum, Kanban, sprint planning, decomposition, estimation, KPI/OKR, release management
- Metrics: DAU/MAU, retention, conversion, churn, LTV, CAC, NPS
- IT: APIs, frontend/backend, databases, CI/CD, microservices, DevOps

TEACHING — always end "text" with:
\n\n— [Relevant term] — [one precise practical Russian sentence that helps user act immediately]
Rotate: PM theory, IT basics, metrics, career. Never repeat same term.
`;

const SUGGESTIONS_RULES = `
SUGGESTIONS — exactly 3 items, ≤7 words each, Russian, capitalize first letter.
Priority order for suggestions:
1. Clarify goal or audience
2. Reduce scope or cut feature
3. Move to execution

Must be actionable. Never generic. Never repeat text from reply.
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
    PROJECT_STATE,
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

// ─── Fallback Suggestions ─────────────────────────────────────────────────────

function fallbackSuggestions(mode) {
  if (mode === "decompose") return ["Уточнить цель задачи", "Сократить до MVP", "Начать с первого шага"];
  if (mode === "sprint")    return ["Убрать лишние задачи", "Определить главный приоритет", "Начать с понедельника"];
  if (mode === "focus")     return ["Объяснить контекст решения", "Оценить альтернативу", "Проверить быстро"];
  if (mode === "brief")     return ["Уточнить целевого пользователя", "Сократить требования", "Добавить критерии готовности"];
  if (mode === "report")    return ["Пересмотреть приоритеты", "Убрать лишние задачи", "Запланировать следующий шаг"];
  return ["Уточнить цель проекта", "Сократить объём работы", "Определить следующий шаг"];
}

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

  const tasks = Array.isArray(parsed.tasks)
    ? parsed.tasks.slice(0, 20)
    : (needsTasks ? [] : fallbackTasks);

  // Fix #4: ensure exactly 3 suggestions
  const suggestions =
    Array.isArray(parsed.suggestions) && parsed.suggestions.length === 3
      ? parsed.suggestions
      : fallbackSuggestions(mode);

  return {
    text: typeof parsed.text === "string" && parsed.text.trim() ? parsed.text : "...",
    tasks,
    suggestions,
    mode, // always use detected mode
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

    // Attempt 1
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

    // Attempt 3 — minimal JSON
    if (!parsed) {
      const retry2 = [
        ...filtered,
        { role: "assistant", content: raw },
        { role: "user", content: "Return minimal valid JSON with exactly these fields: text, tasks, suggestions, mode." },
      ];
      raw = await callAnthropic(system, retry2, 400);
      parsed = tryParse(raw);
    }

    if (!parsed) {
      parsed = { text: raw || "...", tasks: null, suggestions: [] };
    }

    return Response.json(normalize(parsed, trimmedTasks, mode));

  } catch (error) {
    console.error("Route error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}