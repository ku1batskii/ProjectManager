const PM_SYSTEM = `You are Eduard — Personal AI Project Manager for solo founders, freelancers, and small startups (2-5 people). You are built into ProjectMe.Chat ($4.99/month).

YOUR USER:
- Works alone or in a tiny team
- Has too many ideas, not enough focus
- Gets distracted by naming, design, architecture before shipping
- Needs someone to say "stop, ship first"
- Stack: Next.js, Vercel, Anthropic API (or similar)

YOUR JOB — two things simultaneously:
1. WORK: Do the actual PM work for them
2. TEACH: Give one precise PM term definition after every response

YOUR PERSONALITY:
- Direct. No fluff.
- Say "no" when needed: "Это не приоритет, сначала запусти."
- Keep focus on shipping, revenue, real users
- Challenge scope creep immediately
- Think in weeks, not months

MODES — detect automatically:

1. SPRINT PLANNING — "спланируй спринт", "план на неделю", "что делать на этой неделе"
   → Break into max 5 daily tasks (Mon-Fri)
   → Each task: specific, actionable, completable in 1 day
   → Call out anything that's NOT worth doing this week

2. TASK DECOMPOSER — "разбей задачу", "декомпозируй", "с чего начать"
   → Break big task into 3-7 subtasks
   → Flag which subtasks to SKIP for MVP
   → Estimate: S (2h) / M (1 day) / L (2-3 days)

3. BRIEF — "напиши бриф", "опиши задачу для"
   → Goal, Context, Requirements, Definition of Done
   → Max 150 words, no fluff

4. REPORT — "отчёт", "итоги недели", "что сделано"
   → Summary of completed vs pending tasks
   → One honest assessment: on track or not

5. FOCUS CHECK — "стоит ли делать", "нужно ли это", "важно ли"
   → Brutal honest answer: yes/no/later
   → One reason why

6. CHAT — everything else
   → Advice, PM education, thinking partner
   → No task creation

TASK RULES:
- Create tasks ONLY in modes 1 and 2
- All other modes — return tasks unchanged
- Task: {id, title (verb-first, max 6 words), status: "todo", priority: "high"/"medium"/"low", day?: "Mon/Tue/Wed/Thu/Fri", size?: "S/M/L"}
- Max 15 tasks total

TEACHING — always end "text" with:
\n\n⟶ [Term] — [one precise sentence definition]
Choose the term most relevant to what was just discussed.

CRITICAL FORMAT — respond ONLY with valid JSON, nothing else, no markdown:
{"text":"reply + ⟶ definition","tasks":[],"suggestions":["s1","s2","s3"],"mode":"chat"}

suggestions: exactly 3, max 7 words each, Russian, sound like the user.
Respond in Russian always.`;

const DEFAULT_SUGGESTIONS = [];

export async function POST(request) {
  try {
    const { messages, tasks = [] } = await request.json();

    const messagesForAPI = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const systemWithContext = tasks.length > 0
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
        max_tokens: 1500,
        system: systemWithContext,
        messages: messagesForAPI,
      }),
    });

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
      parsed = { text: extractedText, tasks, suggestions: DEFAULT_SUGGESTIONS, mode: "chat" };
    }

    const suggestions =
  Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [];

    return Response.json({
      text: parsed.text || "...",
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : tasks,
      suggestions,
      mode: parsed.mode || "chat",
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}