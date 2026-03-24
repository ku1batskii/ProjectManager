// ─── Core System Prompt (~250 lines, compressed) ─────────────────────────────

const CORE = `
You are Eduard — Personal AI Project Manager. Senior-level, decisive, direct. No fluff.
Users: solo founders, indie devs, influencers, freelancers. Adapt language to their domain.

OUTPUT: return ONLY valid JSON, no markdown, no backticks:
{"text":"...","tasks":[],"suggestions":["","",""],"mode":"chat"}

DECISION (in order):
1. Blocks launch → high
2. Brings money/validates → high
3. Reduces risk → medium
4. Everything else → low/skip

Always: simpler > complex. Faster feedback > perfect quality. MVP > full scope.
If stuck → cut tasks, not add. Max 2-3 high priority per week.
If idea is weak (no clear user, no clear value, too broad) → say so in 1 sentence + suggest simpler path.
If user overthinks → call it out + give smallest next action.

MODES (follow Current mode strictly):

SPRINT: group by day Mon-Fri, max 3 tasks/day, user works alone.
Day 1 (Mon): [task (role)], [task (role)]
First days = core/high. Last days = optional. Mark skips.
MUST return tasks.

DECOMPOSE: execution order, each task 1-4h, start from MVP slice, mark skips.
MUST return tasks.

BRIEF: Goal/Context/Requirements/Done ≤100 words. tasks=[].
REPORT: honest summary + verdict. tasks=[].
FOCUS: YES/NO/LATER + 1 reason. tasks=[].

CHAT:
- Line 1: what user is doing wrong OR reframe their goal
- Line 2: what to do
- Line 3: next action they can take NOW
tasks=[].

TASK FORMAT: {id, title (verb-first, result-oriented ≤6 words, implies done), status:"todo", priority:"high"/"medium"/"low", role}
ROLES: Frontend, Backend, Mobile, Design, Motion, Analytics, QA, DevOps, Content, PM, Creator, Growth

TASK QUALITY: specific, actionable, result-oriented. NOT "сделать лендинг" → "опубликовать лендинг с формой".
Max 20 tasks. If too many → drop lowest impact, keep 1-2 high.
Keep existing tasks unless user removes them.

SUGGESTIONS: exactly 3, ≤7 words, Russian, capitalize. Actionable (doable in ≤10 min). Never generic, never repeat reply.
Priority: 1) clarify goal 2) cut scope 3) next concrete step.

TEACHING: end "text" with \n\n— [Term] — [1 practical Russian sentence, helps act immediately]
Rotate: PM, IT, metrics, career. Never repeat same term.

Reply in Russian unless user writes English consistently.
Write without spelling errors. Cyrillic and Latin only.
`;

const buildSystem = (tasks, mode, context) => {
  const parts = [CORE, `\nCurrent mode: ${mode}`];

  if (context && Object.keys(context).length > 0) {
    const ctx = [];
    if (context.goal)     ctx.push(`goal: ${context.goal}`);
    if (context.audience) ctx.push(`audience: ${context.audience}`);
    if (context.stage)    ctx.push(`stage: ${context.stage}`);
    if (ctx.length > 0)   parts.push(`\nPROJECT:\n${ctx.join("\n")}`);
  }

  if (tasks.length > 0) {
    parts.push(`\nCurrent tasks:\n${JSON.stringify(tasks)}`);
  }

  return parts.join("\n");
};

// ─── Fallback Suggestions ─────────────────────────────────────────────────────

function fallbackSuggestions(mode) {
  const map = {
    decompose: ["Уточнить цель задачи", "Сократить до MVP", "Начать с первого шага"],
    sprint:    ["Убрать лишние задачи", "Определить главный приоритет", "Начать прямо сейчас"],
    focus:     ["Объяснить контекст решения", "Оценить альтернативу", "Проверить быстро"],
    brief:     ["Уточнить целевого пользователя", "Сократить требования", "Добавить критерии готовности"],
    report:    ["Пересмотреть приоритеты", "Убрать лишние задачи", "Запустить следующий шаг"],
  };
  return map[mode] || ["Уточнить цель проекта", "Сократить объём работы", "Сделать первый шаг сейчас"];
}

// ─── Mode Detection ───────────────────────────────────────────────────────────

function detectMode(messages) {
  const last = messages.filter(m => m.role === "user").pop()?.content?.toLowerCase() || "";
  if (/(спринт|план на неделю|распиши неделю|sprint|week plan)/.test(last))              return "sprint";
  if (/(разбей|декомпоз|подзадач|с чего начать|как делать|break down|decompose)/.test(last)) return "decompose";
  if (/(бриф|brief|сформулируй задачу)/.test(last))                                       return "brief";
  if (/(отч[её]т|итоги|что сделано|результат|report)/.test(last))                         return "report";
  if (/(стоит ли|нужно ли|важно ли|имеет ли смысл|should i)/.test(last))                  return "focus";
  return "chat";
}

// ─── Token Limits ─────────────────────────────────────────────────────────────

const MAX_TOKENS = { sprint:1200, decompose:1000, brief:600, report:800, focus:300, chat:800 };

// ─── Normalize ────────────────────────────────────────────────────────────────

function normalize(parsed, fallbackTasks, mode) {
  const needsTasks = mode === "sprint" || mode === "decompose";
  return {
    text: typeof parsed.text === "string" && parsed.text.trim() ? parsed.text : "...",
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks.slice(0, 20) : (needsTasks ? [] : fallbackTasks),
    suggestions: Array.isArray(parsed.suggestions) && parsed.suggestions.length === 3
      ? parsed.suggestions
      : fallbackSuggestions(mode),
    mode,
  };
}

// ─── JSON Parser ──────────────────────────────────────────────────────────────

function tryParse(raw) {
  try { return JSON.parse(raw); } catch {}
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  const t = raw.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (t) return { text: t[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'), tasks: null, suggestions: [] };
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
    .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "")
    .trim();
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, tasks = [], context = {} } = body;

    const filtered = messages
      .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .map(m => ({ role: m.role, content: m.content }));

    if (!filtered.length) return Response.json({ error: "No messages" }, { status: 400 });

    const mode = detectMode(filtered);
    const maxTokens = MAX_TOKENS[mode] || 800;
    const trimmedTasks = tasks.slice(0, 20);
    const system = buildSystem(trimmedTasks, mode, context);

    // Attempt 1
    let raw = await callAnthropic(system, filtered, maxTokens);
    let parsed = tryParse(raw);

    // Attempt 2 — strict fix
    if (!parsed) {
      raw = await callAnthropic(system, [
        ...filtered,
        { role: "assistant", content: raw },
        { role: "user", content: "Invalid JSON. Return ONLY valid JSON now." },
      ], 600);
      parsed = tryParse(raw);
    }

    // Attempt 3 — minimal JSON
    if (!parsed) {
      raw = await callAnthropic(system, [
        ...filtered,
        { role: "assistant", content: raw },
        { role: "user", content: "Return minimal valid JSON: {text, tasks, suggestions, mode}." },
      ], 400);
      parsed = tryParse(raw);
    }

    if (!parsed) parsed = { text: raw || "...", tasks: null, suggestions: [] };

    return Response.json(normalize(parsed, trimmedTasks, mode));

  } catch (error) {
    console.error("Route error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}