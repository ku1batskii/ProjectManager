// ─── Core Prompt ──────────────────────────────────────────────────────────────

const CORE = `
You are Eduard — Personal AI Project Manager. Senior-level, clear, practical, supportive, execution-first.
Users: solo founders, indie devs, influencers, freelancers, and tiny teams. Adapt language to their domain.

OUTPUT: return ONLY valid JSON, no markdown, no backticks:
{"text":"...","tasks":[],"suggestions":["","",""],"mode":"chat"}

TONE AND BEHAVIOR RULES:
- Be calm, practical, supportive, and execution-first.
- Do not be harsh, dismissive, or confrontational.
- Never start with "Стоп", "Нет", or similar abrupt framing unless the request is truly contradictory or impossible.
- If the user gives a concrete task, help execute it first.
- Do not block progress when the user already has a clear enough direction.
- If the request is imperfect but actionable, improve it and move forward instead of arguing.
- Only challenge the user when the task is genuinely too vague to execute.
- When user asks to break something into tasks, your default job is to decompose it, not debate whether it should exist.
- Prefer: clarify lightly + execute.
- Avoid: overcorrecting, reframing too aggressively, or forcing strategic discussion when user asked for action.

CRITICAL PRODUCT RULES:
1. Planning and task creation are NOT the same thing.
2. If user asks for advice, direction, analysis, prioritization, or a plan → give text only, tasks=[].
3. Create tasks ONLY when user explicitly asks to:
   - break down / decompose
   - create tasks / add tasks
   - make a sprint / week plan
   - turn plan into tasks
   - show on timeline / taskboard
4. If intent is unclear → tasks=[].
5. Never auto-change task statuses. Read current statuses and progress, but do not modify statuses by yourself.
6. Never suggest working on tasks with status "done".
7. Prefer helping user finish high-value work already in progress.
8. If task progress is above 70%, prefer finishing it unless another task is much more important.
9. Limit active focus to 1-2 important tasks, not everything at once.
10. Avoid duplicate tasks. If a very similar task already exists, do not recreate it.

Always prioritize decisions using PROJECT context if provided.
Avoid repeating previous answers. Build on conversation.

DECISION PRIORITY:
1. Blocks launch or money → highest
2. Validates demand / reduces uncertainty → high
3. Removes risk / dependency → medium
4. Everything else → low / skip

Think like an operator:
- Simpler > complex
- Faster feedback > perfect
- MVP > full scope
- Finish important work > start random work

If idea is weak (no clear user, no clear value, too broad) → say so briefly and suggest a simpler path.
If user overthinks → reduce scope and give the smallest useful next action.
If too many tasks exist → keep only highest leverage tasks.

CURRENT TASK CONTEXT RULES:
You may receive existing tasks with:
- status: todo / inprogress / review / done
- progress: 0-100
- subtasks
Use them to reason.
Interpret them as:
- todo → not started
- inprogress → user is actively working
- review → near completion, needs checking
- done → completed, do not suggest doing it again

MODES (follow Current mode strictly):

SPRINT:
- return tasks
- group work for a solo operator across Mon-Fri
- max 3 tasks/day in text
- first days = core, last days = optional

DECOMPOSE:
- return tasks
- break work into execution-ready tasks
- include subtasks
- MVP slice first
- no duplicates
- use current task list to avoid overlap

BRIEF:
- Goal / Context / Requirements / Done
- ≤100 words
- tasks=[]

REPORT:
- honest summary + verdict
- tasks=[]

FOCUS:
- YES / NO / LATER + 1 reason
- tasks=[]

CHAT:
STRICT FORMAT:
- Line 1: short reframe or main issue
- Line 2: what to do
- Line 3: next concrete action NOW
Then: \\n\\n— [Term] — [1 practical sentence]
tasks=[]

TASK FORMAT V2:
{
  "id": "t_...",
  "title": "verb-first, result-oriented, <= 60 chars",
  "status": "todo",
  "priority": "high|medium|low",
  "role": "Frontend|Backend|Mobile|Design|Motion|Analytics|QA|DevOps|Content|PM|Creator|Growth",
  "impact": 1-5,
  "effort": 1-5,
  "urgency": 1-5,
  "progress": 0-100,
  "stage": "idea|validation|mvp|growth",
  "notes": "",
  "subtasks": [
    { "id": "s_...", "text": "specific action", "done": false }
  ]
}

TASK QUALITY RULES:
- Task titles imply completion, not vague activity
- Good: "Опубликовать лендинг с формой"
- Bad: "Сделать лендинг"
- 2-6 subtasks preferred
- Each subtask should be concrete and small
- Do not create more than 8 tasks at once
- Default new tasks status="todo"
- progress for new tasks = 0
- If existing similar task already exists, skip creating duplicate
- If user asked for a plan, give plan in text, not tasks

SUGGESTIONS:
- exactly 3
- Russian
- actionable
- <= 7 words each
- capitalize first letter
- do not repeat the reply
- prioritize: clarify goal, cut scope, next step now

TEACHING:
Always end "text" with:
\\n\\n— [Term] — [1 practical Russian sentence]
Rotate across PM / product / execution / metrics / systems.
Never repeat exact same teaching if avoidable.

Reply in Russian unless user writes English consistently.
Write without spelling or grammar mistakes.
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inferStage(messages) {
  const text = messages.map((m) => m.content).join(" ").toLowerCase();
  if (/(идея|idea|хочу сделать|планирую|только думаю|пока нет продукта)/.test(text)) return "idea";
  if (/(тестирую|гипотеза|нет пользователей|ищу пользователей|проверяю спрос|validation)/.test(text)) return "validation";
  if (/(раст[её]м|масштаб|growth|оптимизация метрик|тысячи пользователей)/.test(text)) return "growth";
  return "mvp";
}

function wantsTaskCreation(text) {
  return /(разбей|декомпоз|подзадач|создай задач|добавь задач|сделай задач|таск(и|ов)?|список задач|turn .* into tasks|create tasks|decompose|break down|taskboard|таймлайн|timeline|спринт|план на неделю|распиши неделю)/i.test(
    text
  );
}

function wantsPlanOnly(text) {
  return /(дай план|план действий|что делать дальше|как лучше|как сделать|strategy|стратег|roadmap|с чего начать|помоги понять|объясни)/i.test(
    text
  );
}

function detectMode(messages) {
  const last = messages.filter((m) => m.role === "user").pop()?.content || "";
  const lower = last.toLowerCase();

  if (/(бриф|brief|сформулируй задачу)/.test(lower)) return "brief";
  if (/(отч[её]т|итоги|что сделано|результат|report)/.test(lower)) return "report";
  if (/(стоит ли|нужно ли|важно ли|имеет ли смысл|should i)/.test(lower)) return "focus";

  if (wantsTaskCreation(lower)) {
    if (/(спринт|план на неделю|распиши неделю|sprint|week plan)/.test(lower)) return "sprint";
    return "decompose";
  }

  return "chat";
}

function normalizeTaskTitle(title) {
  if (typeof title !== "string") return "Сделать следующий шаг";
  return title.trim().replace(/\s+/g, " ").slice(0, 60) || "Сделать следующий шаг";
}

function makeTaskId(i = 0) {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${i}`;
}

function makeSubtaskId(i = 0) {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${i}`;
}

function uniqueByTitle(tasks) {
  const seen = new Set();
  const out = [];
  for (const task of tasks) {
    const key = (task.title || "").trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(task);
  }
  return out;
}

function buildTaskContext(tasks = []) {
  if (!Array.isArray(tasks) || tasks.length === 0) return "";
  const compact = tasks.slice(0, 30).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status || "todo",
    priority: t.priority || "medium",
    role: t.role || "PM",
    progress:
      typeof t.progress === "number"
        ? t.progress
        : Array.isArray(t.subtasks) && t.subtasks.length > 0
        ? Math.round((t.subtasks.filter((s) => s.done).length / t.subtasks.length) * 100)
        : 0,
    subtasks: Array.isArray(t.subtasks)
      ? t.subtasks.map((s) => ({
          id: s.id,
          text: s.text,
          done: !!s.done,
        }))
      : [],
  }));
  return `\nCURRENT TASKS (read, reason, avoid duplicates, do not auto-change status):\n${JSON.stringify(compact)}`;
}

function buildSystem(tasks, mode, context, strict = false) {
  const parts = [CORE, `\nCurrent mode: ${mode}`];

  const ctx = [];
  if (context?.goal) ctx.push(`goal: ${context.goal}`);
  if (context?.audience) ctx.push(`audience: ${context.audience}`);
  if (context?.stage) ctx.push(`stage: ${context.stage}`);
  if (context?.priority) ctx.push(`priority: ${context.priority}`);
  if (Array.isArray(context?.constraints) && context.constraints.length) {
    ctx.push(`constraints: ${context.constraints.join(", ")}`);
  }

  if (ctx.length > 0) {
    parts.push(`\nPROJECT CONTEXT:\n${ctx.join("\n")}`);
  }

  const taskCtx = buildTaskContext(tasks);
  if (taskCtx) parts.push(taskCtx);

  if (strict) parts.push("\nReturn ONLY valid JSON. No commentary outside JSON.");
  return parts.join("\n");
}

const MAX_TOKENS = {
  sprint: 1400,
  decompose: 1200,
  brief: 700,
  report: 800,
  focus: 400,
  chat: 900,
};

const TEMPERATURE = {
  sprint: 0.2,
  decompose: 0.2,
  brief: 0.3,
  report: 0.3,
  focus: 0.2,
  chat: 0.35,
};

function score(output) {
  let s = 0;
  if (typeof output.text === "string" && output.text.trim().length >= 10) s++;
  if (Array.isArray(output.tasks) && output.tasks.length <= 20) s++;
  if (Array.isArray(output.suggestions) && output.suggestions.length === 3) s++;
  return s;
}

function validateMode(output, mode) {
  if (mode === "chat") {
    if (!output?.text) return false;
    const parts = output.text.split("\n\n");
    const main = parts[0] || "";
    const lines = main.split("\n").filter((l) => l.trim());
    return lines.length === 3;
  }

  if (mode === "sprint" || mode === "decompose") {
    return Array.isArray(output.tasks) && output.tasks.length > 0;
  }

  return true;
}

function repair(parsed) {
  if (!parsed || typeof parsed !== "object") parsed = {};
  if (!Array.isArray(parsed.tasks)) parsed.tasks = [];
  if (!Array.isArray(parsed.suggestions)) parsed.suggestions = [];
  if (typeof parsed.text !== "string") parsed.text = "";
  return parsed;
}

function normalizeSubtasks(subtasks) {
  if (!Array.isArray(subtasks)) return [];
  return subtasks
    .map((s, i) => {
      if (typeof s === "string") {
        return { id: makeSubtaskId(i), text: s.trim().slice(0, 80), done: false };
      }
      return {
        id: typeof s?.id === "string" && s.id.trim() ? s.id : makeSubtaskId(i),
        text: typeof s?.text === "string" ? s.text.trim().slice(0, 80) : "",
        done: false,
      };
    })
    .filter((s) => s.text)
    .slice(0, 8);
}

function normalizeTasks(tasks, mode, contextStage, existingTasks = []) {
  if (!Array.isArray(tasks)) return [];
  const existingTitles = new Set(existingTasks.map((t) => (t.title || "").trim().toLowerCase()));

  const normalized = tasks
    .map((t, i) => {
      const title = normalizeTaskTitle(t?.title);
      return {
        id: typeof t?.id === "string" && t.id.trim() ? t.id : makeTaskId(i),
        title,
        status: "todo",
        priority: ["high", "medium", "low"].includes(t?.priority) ? t.priority : i < 2 ? "high" : "medium",
        role: typeof t?.role === "string" && t.role.trim() ? t.role : "PM",
        impact: Number.isFinite(t?.impact) ? Math.min(5, Math.max(1, Number(t.impact))) : i < 2 ? 5 : 3,
        effort: Number.isFinite(t?.effort) ? Math.min(5, Math.max(1, Number(t.effort))) : 2,
        urgency: Number.isFinite(t?.urgency) ? Math.min(5, Math.max(1, Number(t.urgency))) : i < 2 ? 4 : 3,
        progress: 0,
        stage: ["idea", "validation", "mvp", "growth"].includes(t?.stage) ? t.stage : contextStage || "mvp",
        notes: typeof t?.notes === "string" ? t.notes.trim().slice(0, 240) : "",
        subtasks: normalizeSubtasks(t?.subtasks),
      };
    })
    .filter((t) => t.title && !existingTitles.has(t.title.toLowerCase()));

  return uniqueByTitle(normalized).slice(0, mode === "sprint" ? 15 : 8);
}

function enforce(parsed, mode, contextStage, existingTasks) {
  if (!parsed.text || parsed.text.trim().length < 10) {
    parsed.text =
      "Ты смотришь слишком широко и теряешь фокус.\nСузь задачу до одного результата.\nСделай сейчас один конкретный шаг.\n\n— MVP — сначала доведи до жизни самый маленький рабочий кусок.";
  }

  parsed.text = parsed.text.slice(0, 1400);

  if (mode === "chat") {
    const parts = parsed.text.split("\n\n");
    const main = parts[0] || "";
    const teaching = parts.length > 1 ? parts[parts.length - 1] : "";
    const lines = main.split("\n").filter((l) => l.trim()).slice(0, 3);
    const teachingBlock = teaching && teaching.includes("—")
      ? `\n\n${teaching}`
      : "\n\n— Фокус — добивай самый важный следующий шаг, а не всё сразу.";
    parsed.text = lines.join("\n") + teachingBlock;
  }

  if (mode !== "sprint" && mode !== "decompose") {
    parsed.tasks = [];
  }

  parsed.tasks = normalizeTasks(parsed.tasks, mode, contextStage, existingTasks);
  return parsed;
}

const WEAK_WORDS = ["улучшить", "оптимизировать", "проанализировать", "изучить", "рассмотреть"];

function isWeakSuggestion(s) {
  return WEAK_WORDS.some((w) => s.toLowerCase().includes(w));
}

function normalizeSuggestion(s) {
  if (!s || typeof s !== "string") return null;
  const trimmed = s.trim().split(" ").slice(0, 7).join(" ");
  if (trimmed.length < 3 || trimmed.length > 60) return null;
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
    decompose: ["Сузить результат задачи", "Выбрать первый шаг", "Открыть taskboard сейчас"],
    sprint: ["Убрать лишние задачи", "Выбрать главный фокус", "Начать с понедельника"],
    focus: ["Уточнить контекст решения", "Сравнить альтернативы", "Проверить риск сейчас"],
    brief: ["Уточнить целевого пользователя", "Сократить требования", "Добавить критерии готовности"],
    report: ["Проверить главный блокер", "Пересобрать приоритеты", "Выбрать следующий шаг"],
    chat: ["Сузить цель сейчас", "Убрать лишнее", "Сделать первый шаг"],
  };
  return map[mode] || ["Сузить цель сейчас", "Убрать лишнее", "Сделать первый шаг"];
}

function normalize(parsed, mode, contextStage, existingTasks) {
  const repaired = repair(parsed);
  const enforced = enforce(repaired, mode, contextStage, existingTasks);

  return {
    text: enforced.text,
    tasks: enforced.tasks,
    suggestions: fixSuggestions(enforced.suggestions) || fallbackSuggestions(mode),
    mode,
  };
}

function sanitizeOutput(o) {
  return {
    text: typeof o?.text === "string" && o.text.trim() ? o.text : "...",
    tasks: Array.isArray(o?.tasks) ? o.tasks : [],
    suggestions: Array.isArray(o?.suggestions) ? o.suggestions.slice(0, 3) : [],
    mode: typeof o?.mode === "string" ? o.mode : "chat",
  };
}

function tryParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {}

  const m = raw.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      return JSON.parse(m[0]);
    } catch {}
  }

  const t = raw.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (t) {
    return {
      text: t[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'),
      tasks: [],
      suggestions: [],
    };
  }

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
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, tasks = [], context = {} } = body;

    const filtered = (messages || [])
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim()
      )
      .map((m) => ({ role: m.role, content: m.content }));

    if (!filtered.length) {
      return Response.json({ error: "No messages" }, { status: 400 });
    }

    const inferredStage = context.stage || inferStage(filtered);
    const effectiveContext = { ...context, stage: inferredStage };

    const mode = detectMode(filtered);
    const maxTokens = MAX_TOKENS[mode] || 900;
    const temp = TEMPERATURE[mode] || 0.3;
    const trimmedTasks = Array.isArray(tasks) ? tasks.slice(0, 30) : [];

    const lastMsg = filtered[filtered.length - 1];
    const messagesWithHint = [
      ...filtered.slice(0, -1),
      { ...lastMsg, content: `[MODE: ${mode}] ${lastMsg.content}` },
    ];

    const system = buildSystem(trimmedTasks, mode, effectiveContext);
    const strictSystem = buildSystem(trimmedTasks, mode, effectiveContext, true);

    let raw = await callAnthropic(system, messagesWithHint, maxTokens, temp);
    let parsed = tryParse(raw);

    const weak =
      !parsed ||
      score({
        text: parsed.text,
        tasks: parsed.tasks || [],
        suggestions: parsed.suggestions || [],
      }) < 2 ||
      !validateMode(parsed, mode);

    if (weak) {
      raw = await callAnthropic(
        strictSystem,
        [
          ...messagesWithHint,
          {
            role: "user",
            content:
              'Previous response was invalid. Return ONLY valid JSON with keys: text, tasks, suggestions, mode.',
          },
        ],
        700,
        0.1
      );
      parsed = tryParse(raw);
    }

    if (!parsed || !validateMode(parsed, mode)) {
      raw = await callAnthropic(
        strictSystem,
        [
          ...messagesWithHint,
          {
            role: "user",
            content:
              'Return minimal valid JSON now. If task creation was not explicitly requested, tasks must be [].',
          },
        ],
        450,
        0.1
      );
      parsed = tryParse(raw);
    }

    if (!parsed) {
      parsed = { text: raw || "...", tasks: [], suggestions: [] };
    }

    if (mode === "chat" && wantsPlanOnly(lastMsg.content) && !wantsTaskCreation(lastMsg.content)) {
      parsed.tasks = [];
    }

    const normalized = normalize(parsed, mode, inferredStage, trimmedTasks);
    return Response.json(sanitizeOutput(normalized));
  } catch (error) {
    console.error("Route error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}