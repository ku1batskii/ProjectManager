// ─── Core Prompt ──────────────────────────────────────────────────────────────

const CORE = `
You are Eduard — Personal AI Project Manager. Senior-level, decisive, direct. No fluff.
Users: solo founders, indie devs, influencers, freelancers. Adapt language to their domain.

OUTPUT: return ONLY valid JSON, no markdown, no backticks:
{"text":"...","tasks":[],"suggestions":["","",""],"mode":"chat"}

Always prioritize decisions using PROJECT context if provided.
Avoid repeating previous answers. Build on conversation.

DECISION (in order):
1. Blocks launch → high
2. Brings money/validates → high
3. Reduces risk → medium
4. Everything else → low/skip
Simpler > complex. Faster feedback > perfect. MVP > full scope.
If idea is weak (no clear user, no clear value, too broad) → say so in 1 sentence + suggest simpler path.
If user overthinks → call it out + give smallest next action.
If too many tasks → drop lowest impact, keep 1-2 high.

MODES (follow Current mode strictly):

SPRINT: group by day Mon-Fri, max 3 tasks/day, user works alone.
Day 1 (Mon): [task (role)], [task (role)]
First days = core. Last days = optional. MUST return tasks.

DECOMPOSE: execution order, each task 1-4h, MVP slice first, mark skips. MUST return tasks.

BRIEF: Goal/Context/Requirements/Done ≤100 words. tasks=[].
REPORT: honest summary + verdict. tasks=[].
FOCUS: YES/NO/LATER + 1 reason. tasks=[].

CHAT (strict format):
- Line 1: what user is doing wrong OR reframe their goal
- Line 2: what to do
- Line 3: next concrete action NOW
Then on new paragraph: \n\n— [Term] — [definition]
tasks=[].

TASK FORMAT: {id, title (verb-first, result-oriented ≤6 words), status:"todo", priority:"high"/"medium"/"low", role}
ROLES: Frontend, Backend, Mobile, Design, Motion, Analytics, QA, DevOps, Content, PM, Creator, Growth
NOT "сделать лендинг" → "опубликовать лендинг с формой". Title implies done.

SUGGESTIONS: exactly 3, ≤7 words, Russian, capitalize. Actionable ≤10 min. Never generic, never repeat reply.
Priority: 1) clarify goal 2) cut scope 3) next step now.

TEACHING: always end "text" with \n\n— [Term] — [1 practical Russian sentence, helps act immediately]
Rotate: PM, IT, metrics, career. Never repeat same term.

Reply in Russian unless user writes English consistently.
Write without spelling errors. Cyrillic and Latin only.
`;

// ─── System Builder ───────────────────────────────────────────────────────────

const buildSystem = (tasks, mode, context, strict = false) => {
  const parts = [CORE, `\nCurrent mode: ${mode}`];

  if (context && Object.keys(context).length > 0) {
    const ctx = [];
    if (context.goal)     ctx.push(`goal: ${context.goal}`);
    if (context.audience) ctx.push(`audience: ${context.audience}`);
    if (context.stage)    ctx.push(`stage: ${context.stage}`);
    if (ctx.length > 0) {
      parts.push(`\nPROJECT (use in every decision):\n${ctx.join("\n")}`);
    }
  }

  if (tasks.length > 0) {
    parts.push(`\nCurrent tasks:\n${JSON.stringify(tasks)}`);
  }

  if (strict) {
    parts.push("\nReturn ONLY JSON. No text outside JSON.");
  }

  return parts.join("\n");
};

// ─── Stage Inference ──────────────────────────────────────────────────────────

function inferStage(messages) {
  const text = messages.map(m => m.content).join(" ").toLowerCase();
  if (/(идея|idea|хочу сделать|планирую|только думаю|пока нет продукта)/.test(text))      return "idea";
  if (/(тестирую|гипотеза|нет пользователей|ищу пользователей|проверяю спрос)/.test(text)) return "validation";
  if (/(растём|масштаб|оптимизация метрик|тысячи пользователей)/.test(text))               return "growth";
  return "mvp"; // safe default
}

// ─── Scoring (on raw parsed, before normalize) ────────────────────────────────

function score(output) {
  let s = 0;
  if (typeof output.text === "string" && output.text.trim().length >= 10) s++;
  if (Array.isArray(output.tasks) && output.tasks.length <= 20) s++;
  if (Array.isArray(output.suggestions) && output.suggestions.length === 3) s++;
  return s;
}

// ─── Mode Validation ──────────────────────────────────────────────────────────

function validateMode(output, mode) {
  if (mode === "chat") {
    const lines = (output.text || "").split("\n").filter(l => l.trim());
    return lines.length >= 3;
  }
  if (mode === "sprint" || mode === "decompose") {
    return Array.isArray(output.tasks) && output.tasks.length > 0;
  }
  return true;
}

// ─── Enforce ──────────────────────────────────────────────────────────────────

function enforce(parsed, mode) {
  // Empty text protection
  if (!parsed.text || parsed.text.trim().length < 10) {
    parsed.text = "Сформулируй цель чётко и начни с одного действия.\nСделай это сейчас.\nОпредели первый шаг.\n\n— MVP — минимальный продукт, который решает одну проблему одного пользователя достаточно хорошо, чтобы за него заплатили.";
  }

  // Truncate total
  if (typeof parsed.text === "string") {
    parsed.text = parsed.text.slice(0, 600);
  }

  // CHAT: keep only last teaching block, limit main to 3 lines
  if (mode === "chat" && typeof parsed.text === "string") {
    const parts = parsed.text.split("\n\n");
    const main = parts[0] || "";
    const teaching = parts.length > 1 ? parts[parts.length - 1] : "";
    const lines = main.split("\n").filter(l => l.trim()).slice(0, 3);
    parsed.text = lines.join("\n") + (teaching ? "\n\n" + teaching : "");
  }

  // Force empty tasks for non-task modes
  if (mode !== "sprint" && mode !== "decompose") {
    parsed.tasks = [];
  }

  // Validate and normalize task shape
  if (Array.isArray(parsed.tasks)) {
    parsed.tasks = parsed.tasks.map((t, i) => ({
      id: typeof t.id === "string" && t.id.trim() ? t.id : `t_${Date.now()}_${i}`,
      title: (typeof t.title === "string" ? t.title : "task").slice(0, 60),
      status: "todo",
      priority: ["high", "medium", "low"].includes(t.priority)
        ? t.priority
        : (i < 2 ? "high" : "medium"),
      role: typeof t.role === "string" && t.role.trim() ? t.role : "PM",
    })).slice(0, mode === "sprint" ? 15 : 20); // Sprint: max 5 days × 3 tasks
  }

  return parsed;
}

// ─── Suggestions ──────────────────────────────────────────────────────────────

const WEAK_WORDS = ["улучшить", "оптимизировать", "проанализировать", "изучить", "рассмотреть"];

function isWeakSuggestion(s) {
  return WEAK_WORDS.some(w => s.toLowerCase().includes(w));
}

function normalizeSuggestion(s) {
  if (!s || typeof s !== "string") return null;
  const trimmed = s.trim().split(" ").slice(0, 7).join(" ");
  if (trimmed.length < 3) return null;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function fixSuggestions(arr) {
  if (!Array.isArray(arr) || arr.length !== 3) return null;
  const fixed = arr.map(normalizeSuggestion);
  if (!fixed.every(Boolean)) return null;
  if (fixed.some(isWeakSuggestion)) return null;
  return fixed;
}

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
  if (/(спринт|план на неделю|распиши неделю|sprint|week plan)/.test(last))                  return "sprint";
  if (/(разбей|декомпоз|подзадач|с чего начать|как делать|break down|decompose)/.test(last)) return "decompose";
  if (/(бриф|brief|сформулируй задачу)/.test(last))                                           return "brief";
  if (/(отч[её]т|итоги|что сделано|результат|report)/.test(last))                             return "report";
  if (/(стоит ли|нужно ли|важно ли|имеет ли смысл|should i)/.test(last))                      return "focus";
  return "chat";
}

// ─── Tokens & Temperature ─────────────────────────────────────────────────────

const MAX_TOKENS  = { sprint:1200, decompose:1000, brief:600, report:800, focus:300, chat:800 };
const TEMPERATURE = { sprint:0.2,  decompose:0.2,  brief:0.3, report:0.3, focus:0.2, chat:0.4 };

// ─── Normalize ────────────────────────────────────────────────────────────────

function normalize(parsed, fallbackTasks, mode) {
  const enforced = enforce(parsed, mode);
  const needsTasks = mode === "sprint" || mode === "decompose";

  return {
    text: enforced.text,
    tasks: Array.isArray(enforced.tasks) ? enforced.tasks : (needsTasks ? [] : fallbackTasks),
    suggestions: fixSuggestions(enforced.suggestions) || fallbackSuggestions(mode),
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

async function callAnthropic(system, messages, maxTokens, temperature = 0.3) {
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
      temperature,
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
    const temp = TEMPERATURE[mode] || 0.3;
    const trimmedTasks = tasks.slice(0, 20);

    // Auto-infer stage if not provided
    if (!context.stage) context.stage = inferStage(filtered);

    // Inject mode hint into last user message
    const lastMsg = filtered[filtered.length - 1];
    const messagesWithHint = [
      ...filtered.slice(0, -1),
      { ...lastMsg, content: `[MODE: ${mode}] ${lastMsg.content}` },
    ];

    const system = buildSystem(trimmedTasks, mode, context);
    const strictSystem = buildSystem(trimmedTasks, mode, context, true);

    // Attempt 1
    let raw = await callAnthropic(system, messagesWithHint, maxTokens, temp);
    let parsed = tryParse(raw);

    // Score raw output BEFORE normalize
    const needsRetry = !parsed
      || score({ text: parsed.text, tasks: parsed.tasks || [], suggestions: parsed.suggestions || [] }) < 2
      || !validateMode(parsed, mode);

    // Attempt 2 — strict fix
    if (needsRetry) {
      raw = await callAnthropic(strictSystem, [
        ...messagesWithHint,
        { role: "assistant", content: raw },
        { role: "user", content: "Invalid or incomplete response. Return ONLY valid JSON now." },
      ], 600, 0.1);
      parsed = tryParse(raw);
    }

    // Attempt 3 — minimal JSON
    if (!parsed || !validateMode(parsed, mode)) {
      raw = await callAnthropic(strictSystem, [
        ...messagesWithHint,
        { role: "assistant", content: raw },
        { role: "user", content: "Return minimal valid JSON: {text, tasks, suggestions, mode}." },
      ], 400, 0.1);
      parsed = tryParse(raw);
    }

    if (!parsed) parsed = { text: raw || "...", tasks: null, suggestions: [] };

    return Response.json(normalize(parsed, trimmedTasks, mode));

  } catch (error) {
    console.error("Route error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}