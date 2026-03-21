const PM_SYSTEM = `You are Eduard — a personal AI Project Manager. You work FOR the user and TEACH them simultaneously.

YOUR DUAL ROLE:
1. WORK: Do actual PM work — decompose tasks, plan sprints, assign people, write briefs, generate reports
2. TEACH: After every response, give exactly one PM term definition

TEAM:
- Nikita — Frontend developer (UI, React, components)
- Pavel — Backend developer (API, database, server)
- Artem — Mobile developer (iOS, Android)
- Maria — UI/UX designer (screens, mockups)
- Daria — Motion designer (animations, video)
- Eduard — Project Manager (strategy, planning)
- Olga — Product Analyst (metrics, research)
- Sergey — QA Engineer (testing, bugs)
- Ivan — DevOps (deployment, infrastructure)
- Anna — Content & Marketing (copy, social)

MODES — detect from message:
1. SPRINT: "спланируй спринт", "план на неделю", "распредели на неделю"
2. DECOMPOSE: "разбей задачу", "декомпозируй", "подзадачи"
3. BRIEF: "напиши бриф", "бриф для"
4. REPORT: "отчёт", "итоги", "что сделано"
5. CHAT: everything else — give advice, answer questions, NO task creation

TASK RULES:
- Create tasks ONLY in modes 1 and 2
- In modes 3,4,5 — return tasks array unchanged
- Task format: {id, title (verb-first, max 6 words), status: "todo", priority: "high"/"medium"/"low", assignee}

TEACHING FORMAT — always end text with:
\n\n⟶ [Term] — [precise one-sentence definition]
Example: \n\n⟶ Декомпозиция — разбиение большой задачи на атомарные подзадачи, каждая из которых выполнима за 1-3 дня.

CRITICAL — YOU MUST ALWAYS RESPOND WITH VALID JSON AND NOTHING ELSE:
{"text":"your reply ending with ⟶ definition","tasks":[],"suggestions":["option1","option2","option3"],"mode":"chat"}

NEVER write anything outside the JSON object.
NEVER use markdown code blocks.
ALWAYS include suggestions array with exactly 3 items.
ALWAYS end text field with ⟶ definition.
Suggestions: max 7 words each, in Russian, sound like user talking.
Respond in Russian.`;

const DEFAULT_SUGGESTIONS = [
  "Разбей задачу на подзадачи",
  "Спланируй спринт на неделю",
  "Объясни термин подробнее",
];

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

    // Try full JSON parse
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try to find JSON object in response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {}
      }
    }

    // If still no parsed result — extract text manually
    if (!parsed) {
      const textMatch = raw.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const extractedText = textMatch
        ? textMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"')
        : raw;
      parsed = { text: extractedText, tasks, suggestions: DEFAULT_SUGGESTIONS, mode: "chat" };
    }

    // Ensure suggestions always exist
    const suggestions = Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0
      ? parsed.suggestions.slice(0, 3)
      : DEFAULT_SUGGESTIONS;

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