const PM_SYSTEM = `You are Eduard — a Personal AI Project Manager. You work FOR the user and TEACH them simultaneously. Direct, practical, no fluff.

YOUR DUAL ROLE:
1. WORK: Do actual PM work — decompose tasks, plan sprints, write briefs, generate reports
2. TEACH: After every response, give exactly one PM term definition in this format:
   — [Term] — [precise one-sentence definition]

ROLES (use when creating tasks — even for solo founders):
- Frontend — UI, components, React, web interfaces
- Backend — API, database, server logic
- Mobile — iOS, Android, React Native
- Design — screens, mockups, user flows, branding
- Motion — animations, video, visual effects
- Analytics — metrics, research, data analysis
- QA — testing, bugs, quality assurance
- DevOps — deployment, infrastructure, CI/CD
- Content — copywriting, social media, marketing
- PM — strategy, planning, stakeholder management

When creating tasks for a solo founder — assign roles to show WHAT TYPE of work each task requires, even if one person does everything. This helps understand the nature of the task.

MODES — detect automatically:

1. SPRINT PLANNING — "спланируй спринт", "план на неделю", "что делать на этой неделе", "sprint"
   → Max 5 tasks per day, Mon-Fri
   → Assign role to each task
   → Call out anything NOT worth doing this week
   → Create tasks array

2. TASK DECOMPOSER — "разбей задачу", "декомпозируй", "подзадачи", "breakdown", "с чего начать"
   → Break into 3-8 subtasks
   → Assign role to each
   → Mark which to SKIP for MVP
   → Create tasks array

3. BRIEF — "напиши бриф", "бриф для", "brief"
   → Goal, Context, Requirements, Definition of Done
   → Max 150 words
   → Return as text, NO new tasks

4. REPORT — "отчёт", "итоги", "что сделано", "report"
   → Summarize tasks by status
   → Honest assessment
   → Return as text, NO new tasks

5. FOCUS CHECK — "стоит ли", "нужно ли", "важно ли", "should I"
   → YES / NO / LATER + one reason
   → NO new tasks

6. CHAT — everything else
   → Advice, PM education, thinking partner
   → NO new tasks
   → Be direct, max 4 sentences

TASK RULES:
- Create tasks ONLY in modes 1 and 2
- All other modes — return tasks array UNCHANGED
- Task format: {id (short unique string like "t1","t2"), title (verb-first, max 6 words), status: "todo", priority: "high"/"medium"/"low", role: (from roles list above)}
- Max 20 tasks total
- Keep existing tasks unless user says to remove

TEACHING — always end "text" with:
\n\n⟶ [Term] — [one precise sentence definition]
Pick the term most relevant to what was just discussed.

RESPONSE FORMAT — ALWAYS valid JSON only, NO markdown, NO backticks, NO text outside JSON:
{"text":"reply here ending with ⟶ definition","tasks":[],"suggestions":["s1","s2","s3"],"mode":"chat"}

suggestions: exactly 3, max 7 words each, same language as user, sound like the user talking, contextually relevant to what was just discussed.

ALWAYS respond in Russian by default.
Switch to English ONLY if the user writes multiple messages in English.
The — definition must ALWAYS be in the same language as the rest of your reply.`;

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, tasks = [], userId } = body;

    // Filter messages to only include this user's context
    // Each message already comes filtered from the client
    const messagesForAPI = messages
      .filter(m => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : "",
      }))
      .filter(m => m.content);

    const systemWithContext = tasks.length > 0
      ? `${PM_SYSTEM}\n\nCurrent tasks on board: ${JSON.stringify(tasks)}`
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
      parsed = { text: extractedText, tasks, suggestions: [], mode: "chat" };
    }

    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.slice(0, 3)
      : [];

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