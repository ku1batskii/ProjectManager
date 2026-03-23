"use client";

import { useState } from "react";
import Link from "next/link";

const CONTENT = {
  en: {
    nav_cta: "Get your first plan →",
    badge: "Early access · $4.99/mo",
    hero_title: "Stop guessing\nwhat to do next.",
    hero_sub: "Eduard turns your chaos into a clear execution plan in 60 seconds. AI Project Manager for solo builders.",
    hero_bullets: [
      "Get a weekly sprint plan instantly",
      "Break any idea into actionable tasks",
      "Know what NOT to do — focus filter",
    ],
    hero_cta: "Get your first plan →",
    hero_secondary: "See how it works",
    social_proof: "Used by 200+ solo founders this week",
    how_label: "HOW IT WORKS",
    how_steps: [
      { n: "1", title: "Describe your situation", desc: "Tell Eduard what's happening — project, tasks, blockers, ideas. Any format." },
      { n: "2", title: "Eduard analyzes it", desc: "He detects what mode you need: sprint, decomposition, brief, focus check, or report." },
      { n: "3", title: "You get a clear plan", desc: "Actionable tasks, roles, priorities. Ready to execute. No thinking required." },
    ],
    for_who_label: "BUILT FOR",
    for_who: [
      { emoji: "🛠", label: "Solo founders", desc: "Ship faster without drowning in tasks" },
      { emoji: "📱", label: "Indie developers", desc: "Stay focused on code, not project chaos" },
      { emoji: "🎬", label: "Influencers", desc: "Plan content, launches and collabs" },
      { emoji: "⚡", label: "Freelancers", desc: "Manage clients like a senior PM" },
    ],
    features_label: "WHAT YOU GET",
    features: [
      { icon: "◈", title: "Weekly plan in 60 seconds", desc: "Describe your week — get a structured sprint plan with tasks by day, roles, and priorities." },
      { icon: "◉", title: "Any idea → executable tasks", desc: "One message. Eduard breaks it into 3–8 subtasks with MVP flags. No overengineering." },
      { icon: "◎", title: "Instant focus filter", desc: "Not sure if something is worth doing? YES / NO / LATER — with one clear reason." },
      { icon: "◐", title: "Brief in one minute", desc: "Describe a feature → clean brief with goal, context, requirements, definition of done." },
      { icon: "◑", title: "Honest weekly report", desc: "What's done. What's blocked. What's next. No sugarcoating." },
      { icon: "◒", title: "Learn PM as you work", desc: "Every reply ends with one precise PM term definition. No courses needed." },
    ],
    demo_label: "SEE IT IN ACTION",
    demo_user: "Plan my sprint: launch landing, fix chat bugs, record product demo video, add analytics",
    demo_reply: `Got it. Here's your week:\n\nMON — Design\n· Create landing wireframe\n· Record product demo (15 min)\n\nTUE — Frontend\n· Build landing page\n· Fix chat input bug\n\nWED — Frontend + Analytics\n· Deploy landing\n· Set up Vercel Analytics\n\nTHU — Content\n· Edit & publish demo video\n· Write launch tweet thread\n\nFRI — Buffer\n· Fix remaining bugs\n· Prep for launch Monday\n\nSkip for now: A/B testing, onboarding flow, mobile app\n\n— Sprint — a fixed time period (usually 1–2 weeks) during which a team executes a pre-agreed set of tasks.`,
    pricing_label: "PRICING",
    pricing_tag: "EARLY ACCESS",
    pricing_price: "$4.99",
    pricing_period: "per month · cancel anytime",
    pricing_compare: "Less than 1 hour of a freelance PM — but replaces one completely.",
    pricing_cta: "Get your first plan →",
    pricing_features: [
      "Unlimited conversations",
      "Sprint planning & task decomposition",
      "Brief & report generation",
      "Full session history saved",
      "PM education built-in",
    ],
    trust_quote: "Saved me 10+ hours/week. I finally know what to work on each morning.",
    trust_author: "— indie developer, building in public",
    faq_label: "FAQ",
    faq: [
      { q: "Do I need PM experience?", a: "No. Eduard explains every decision and teaches you PM thinking as you work." },
      { q: "What if I work alone?", a: "Perfect for that. Eduard assigns roles to show what type of work each task requires — even if you do everything yourself." },
      { q: "Is my data private?", a: "Yes. Each account is isolated. Your sessions and tasks are visible only to you." },
      { q: "Can I cancel anytime?", a: "Yes. No contracts. Cancel from your profile in one click." },
      { q: "What's the early access price?", a: "Currently $4.99/mo. Price will increase as we add more features. Early users lock in this rate." },
    ],
    final_cta_title: "From chaos to clear plan.\nIn 60 seconds.",
    final_cta_btn: "Start free today →",
    footer: "PROJECTME · 2025 · Built by a solo founder, for solo founders",
    online: "online",
  },
  ru: {
    nav_cta: "Получить первый план →",
    badge: "Ранний доступ · $4.99/мес",
    hero_title: "Хватит гадать\nчто делать дальше.",
    hero_sub: "Эдуард превращает твой хаос в чёткий план действий за 60 секунд. AI Project Manager для соло-строителей.",
    hero_bullets: [
      "Готовый спринт-план за одно сообщение",
      "Любая идея → конкретные подзадачи",
      "Фокус-фильтр: что делать не нужно",
    ],
    hero_cta: "Получить первый план →",
    hero_secondary: "Как это работает",
    social_proof: "Используют 200+ соло-фаундеров на этой неделе",
    how_label: "КАК ЭТО РАБОТАЕТ",
    how_steps: [
      { n: "1", title: "Опиши ситуацию", desc: "Расскажи Эдуарду что происходит — проект, задачи, блокеры, идеи. В любом формате." },
      { n: "2", title: "Эдуард анализирует", desc: "Он определяет нужный режим: спринт, декомпозиция, бриф, фокус-чек или отчёт." },
      { n: "3", title: "Ты получаешь план", desc: "Конкретные задачи, роли, приоритеты. Готово к выполнению. Думать не нужно." },
    ],
    for_who_label: "ДЛЯ КОГО",
    for_who: [
      { emoji: "🛠", label: "Соло-фаундеры", desc: "Запускайте быстрее без хаоса задач" },
      { emoji: "📱", label: "Инди-разработчики", desc: "Фокус на коде, а не на управлении" },
      { emoji: "🎬", label: "Инфлюенсеры", desc: "Планируйте контент и запуски продуктов" },
      { emoji: "⚡", label: "Фрилансеры", desc: "Управляйте клиентами как senior PM" },
    ],
    features_label: "ЧТО ТЫ ПОЛУЧАЕШЬ",
    features: [
      { icon: "◈", title: "Недельный план за 60 секунд", desc: "Опиши неделю — получи структурированный спринт с задачами по дням, ролями и приоритетами." },
      { icon: "◉", title: "Любая идея → задачи", desc: "Одно сообщение. Эдуард разбивает на 3–8 подзадач с MVP-флагами. Без оверинжиниринга." },
      { icon: "◎", title: "Мгновенный фокус-фильтр", desc: "Не уверен стоит ли делать? ДА / НЕТ / ПОТОМ — с одной чёткой причиной." },
      { icon: "◐", title: "Бриф за одну минуту", desc: "Опиши фичу → готовый бриф: цель, контекст, требования, критерии готовности." },
      { icon: "◑", title: "Честный недельный отчёт", desc: "Что сделано. Что застряло. Что дальше. Без прикрас." },
      { icon: "◒", title: "Учись PM в процессе работы", desc: "Каждый ответ заканчивается точным определением PM-термина. Курсы не нужны." },
    ],
    demo_label: "ПОСМОТРИ КАК ЭТО РАБОТАЕТ",
    demo_user: "Спланируй спринт: запустить лендинг, починить баги чата, записать демо-видео, добавить аналитику",
    demo_reply: `Понял. Вот твоя неделя:\n\nПН — Design\n· Сделать вайрфрейм лендинга\n· Записать демо-видео (15 мин)\n\nВТ — Frontend\n· Собрать лендинг\n· Починить баг инпута в чате\n\nСР — Frontend + Analytics\n· Задеплоить лендинг\n· Настроить Vercel Analytics\n\nЧТ — Content\n· Смонтировать и опубликовать видео\n· Написать тред про запуск\n\nПТ — Буфер\n· Дофиксить оставшиеся баги\n· Подготовиться к запуску в пн\n\nОтложить: A/B тесты, онбординг, мобильное приложение\n\n— Спринт — фиксированный период времени (обычно 1–2 недели), за который команда выполняет заранее согласованный набор задач.`,
    pricing_label: "ЦЕНА",
    pricing_tag: "РАННИЙ ДОСТУП",
    pricing_price: "$4.99",
    pricing_period: "в месяц · отмена в любой момент",
    pricing_compare: "Дешевле одного часа PM-консультанта — но заменяет его полностью.",
    pricing_cta: "Получить первый план →",
    pricing_features: [
      "Неограниченные разговоры",
      "Планирование спринтов и декомпозиция",
      "Генерация брифов и отчётов",
      "Полная история сессий",
      "PM-образование встроено",
    ],
    trust_quote: "Экономлю 10+ часов в неделю. Наконец знаю что делать каждое утро.",
    trust_author: "— инди-разработчик, строю в паблике",
    faq_label: "ВОПРОСЫ",
    faq: [
      { q: "Нужен ли опыт в PM?", a: "Нет. Эдуард объясняет каждое решение и учит PM-мышлению в процессе работы." },
      { q: "Что если я работаю один?", a: "Идеально. Эдуард назначает роли чтобы показать какой тип работы требует каждая задача." },
      { q: "Мои данные в безопасности?", a: "Да. Каждый аккаунт изолирован. Ваши сессии и задачи видны только вам." },
      { q: "Можно отменить в любой момент?", a: "Да. Никаких контрактов. Отмена в один клик из профиля." },
      { q: "Что такое цена раннего доступа?", a: "Сейчас $4.99/мес. Цена вырастет с добавлением новых функций. Ранние пользователи фиксируют эту ставку." },
    ],
    final_cta_title: "От хаоса к чёткому плану.\nЗа 60 секунд.",
    final_cta_btn: "Начать бесплатно →",
    footer: "PROJECTME · 2025 · Сделано соло-фаундером для соло-фаундеров",
    online: "онлайн",
  },
};

export default function LandingPage() {
  const [lang, setLang] = useState("en");
  const t = CONTENT[lang];

  return (
    <div style={{ background: "#0C0C14", color: "#E2E8F0", fontFamily: "'Sora','Segoe UI',sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #1D4ED830; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 2px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.4} }
        .f1{animation:fadeUp .6s ease both}
        .f2{animation:fadeUp .6s .1s ease both}
        .f3{animation:fadeUp .6s .2s ease both}
        .f4{animation:fadeUp .6s .3s ease both}
        .f5{animation:fadeUp .6s .4s ease both}
        .cta{background:#1D4ED8;color:#fff;border:none;padding:14px 28px;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-block;transition:all .2s;white-space:nowrap}
        .cta:hover{background:#2563EB;transform:translateY(-1px);box-shadow:0 8px 32px #1D4ED840}
        .sec{background:transparent;border:1px solid #1E293B;color:#64748B;padding:14px 28px;border-radius:12px;font-size:15px;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-block;transition:all .2s;white-space:nowrap}
        .sec:hover{border-color:#334155;color:#94A3B8}
        .card{background:#0E0E1A;border:1px solid #1E293B;border-radius:14px;padding:24px;transition:border-color .2s}
        .card:hover{border-color:#334155}
        .faq-item{border-bottom:1px solid #1E293B;padding:20px 0}
        @media(max-width:640px){
          .h1{font-size:36px!important}
          .grid3{grid-template-columns:1fr!important}
          .grid4{grid-template-columns:1fr 1fr!important}
          .grid2{grid-template-columns:1fr!important}
          .wrap{padding:0 16px!important}
        }
      `}</style>

      {/* NAV */}
      <div style={{ position:"sticky", top:0, zIndex:100, background:"#0C0C14E0", backdropFilter:"blur(16px)", borderBottom:"1px solid #1E293B" }}>
        <nav style={{ padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", maxWidth:1100, margin:"0 auto", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"#161622", border:"2px solid #334155", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#94A3B8" }}>E</div>
            <span style={{ fontWeight:700, fontSize:14, letterSpacing:-0.3 }}>PROJECTME</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ display:"flex", background:"#0E0E1A", border:"1px solid #1E293B", borderRadius:10, padding:3 }}>
              {["en","ru"].map(l => (
                <button key={l} onClick={() => setLang(l)} style={{ background:lang===l?"#161622":"transparent", border:"none", color:lang===l?"#E2E8F0":"#475569", padding:"8px 14px", borderRadius:7, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", letterSpacing:1, transition:"all .15s" }}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <Link href="/pm-agent" className="cta" style={{ padding:"12px 20px", fontSize:13, borderRadius:10 }}>{t.nav_cta}</Link>
          </div>
        </nav>
      </div>

      <div className="wrap" style={{ maxWidth:1100, margin:"0 auto", padding:"0 24px" }}>

        {/* HERO */}
        <section style={{ padding:"90px 0 70px", textAlign:"center" }}>
          <div className="f1" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#0E0E1A", border:"1px solid #1E293B", borderRadius:20, padding:"6px 14px", fontSize:12, color:"#64748B", marginBottom:28 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#22C55E", animation:"pulse-dot 2s infinite" }}/>
            {t.badge}
          </div>

          <h1 className="f2 h1" style={{ fontSize:58, fontWeight:800, lineHeight:1.05, letterSpacing:-2, marginBottom:20, background:"linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", whiteSpace:"pre-line" }}>
            {t.hero_title}
          </h1>

          <p className="f3" style={{ fontSize:18, color:"#64748B", lineHeight:1.7, maxWidth:500, margin:"0 auto 28px" }}>
            {t.hero_sub}
          </p>

          <div className="f4" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, marginBottom:36 }}>
            {t.hero_bullets.map((b,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:14, color:"#94A3B8" }}>
                <span style={{ color:"#22C55E", fontSize:12 }}>✓</span>{b}
              </div>
            ))}
          </div>

          <div className="f5" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", marginBottom:24 }}>
            <Link href="/pm-agent" className="cta">{t.hero_cta}</Link>
            <a href="#how" className="sec">{t.hero_secondary}</a>
          </div>

          <div style={{ fontSize:12, color:"#334155" }}>{t.social_proof}</div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" style={{ marginBottom:100 }}>
          <h2 style={{ fontSize:13, color:"#475569", letterSpacing:3, textTransform:"uppercase", marginBottom:48, textAlign:"center" }}>{t.how_label}</h2>
          <div className="grid3" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {t.how_steps.map((s,i) => (
              <div key={i} style={{ background:"#0E0E1A", border:"1px solid #1E293B", borderRadius:14, padding:"28px 24px" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:"#1D4ED820", border:"1px solid #1D4ED840", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#3B82F6", marginBottom:16 }}>{s.n}</div>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:8 }}>{s.title}</div>
                <div style={{ fontSize:13, color:"#64748B", lineHeight:1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* DEMO */}
        <section style={{ marginBottom:100 }}>
          <h2 style={{ fontSize:13, color:"#475569", letterSpacing:3, textTransform:"uppercase", marginBottom:40, textAlign:"center" }}>{t.demo_label}</h2>
          <div style={{ background:"#0E0E1A", border:"1px solid #1E293B", borderRadius:20, overflow:"hidden", boxShadow:"0 40px 100px #00000050" }}>
            <div style={{ borderBottom:"1px solid #1E293B", padding:"14px 20px", display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:"#161622", border:"2px solid #334155", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#94A3B8" }}>E</div>
              <div>
                <div style={{ fontWeight:700, fontSize:13 }}>Eduard</div>
                <div style={{ fontSize:10, color:"#22C55E" }}>{t.online}</div>
              </div>
            </div>
            <div style={{ padding:"24px 20px", display:"flex", flexDirection:"column", gap:14 }}>
              {[{role:"user",text:t.demo_user},{role:"assistant",text:t.demo_reply}].map((m,i) => (
                <div key={i} style={{ display:"flex", flexDirection:m.role==="user"?"row-reverse":"row", gap:8, alignItems:"flex-end" }}>
                  {m.role==="assistant" && (
                    <div style={{ width:26, height:26, borderRadius:"50%", background:"#161622", border:"1px solid #334155", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#94A3B8", flexShrink:0 }}>E</div>
                  )}
                  <div style={{ maxWidth:"82%", background:m.role==="user"?"linear-gradient(135deg,#1D4ED8,#1E40AF)":"#161622", border:m.role==="user"?"none":"1px solid #1E293B", borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px", padding:"11px 15px", fontSize:13, lineHeight:1.65, color:m.role==="user"?"#EFF6FF":"#CBD5E1", whiteSpace:"pre-line" }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOR WHO */}
        <section style={{ marginBottom:100 }}>
          <h2 style={{ fontSize:13, color:"#475569", letterSpacing:3, textTransform:"uppercase", marginBottom:40, textAlign:"center" }}>{t.for_who_label}</h2>
          <div className="grid4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
            {t.for_who.map((w,i) => (
              <div key={i} style={{ background:"#0E0E1A", border:"1px solid #1E293B", borderRadius:14, padding:"24px 20px", textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:10 }}>{w.emoji}</div>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>{w.label}</div>
                <div style={{ fontSize:12, color:"#64748B", lineHeight:1.5 }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ marginBottom:100 }}>
          <h2 style={{ fontSize:13, color:"#475569", letterSpacing:3, textTransform:"uppercase", marginBottom:40, textAlign:"center" }}>{t.features_label}</h2>
          <div className="grid3" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {t.features.map((f,i) => (
              <div key={i} className="card">
                <div style={{ fontSize:18, color:"#334155", marginBottom:12 }}>{f.icon}</div>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>{f.title}</div>
                <div style={{ fontSize:13, color:"#64748B", lineHeight:1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section style={{ marginBottom:100 }}>
          <h2 style={{ fontSize:13, color:"#475569", letterSpacing:3, textTransform:"uppercase", marginBottom:40, textAlign:"center" }}>{t.pricing_label}</h2>
          <div style={{ maxWidth:440, margin:"0 auto" }}>
            <div style={{ background:"#0E0E1A", border:"1px solid #1E293B", borderRadius:20, padding:"40px 36px", textAlign:"center" }}>
              <div style={{ display:"inline-block", background:"#1D4ED820", border:"1px solid #1D4ED840", borderRadius:20, padding:"4px 12px", fontSize:11, color:"#3B82F6", fontWeight:700, letterSpacing:1, marginBottom:20 }}>{t.pricing_tag}</div>
              <div style={{ fontSize:56, fontWeight:800, letterSpacing:-2, marginBottom:4 }}>{t.pricing_price}</div>
              <div style={{ fontSize:13, color:"#475569", marginBottom:12 }}>{t.pricing_period}</div>
              <div style={{ fontSize:13, color:"#64748B", fontStyle:"italic", marginBottom:32, lineHeight:1.5 }}>{t.pricing_compare}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:32, textAlign:"left" }}>
                {t.pricing_features.map((item,i) => (
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"center", fontSize:13, color:"#94A3B8" }}>
                    <span style={{ color:"#22C55E", flexShrink:0 }}>✓</span>{item}
                  </div>
                ))}
              </div>
              <Link href="/pm-agent" className="cta" style={{ width:"100%", textAlign:"center", display:"block" }}>{t.pricing_cta}</Link>
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section style={{ marginBottom:100, textAlign:"center" }}>
          <div style={{ maxWidth:520, margin:"0 auto", background:"#0E0E1A", border:"1px solid #1E293B", borderRadius:16, padding:"32px 28px" }}>
            <div style={{ fontSize:32, marginBottom:16, color:"#334155" }}>"</div>
            <div style={{ fontSize:16, color:"#94A3B8", lineHeight:1.7, marginBottom:16, fontStyle:"italic" }}>{t.trust_quote}</div>
            <div style={{ fontSize:12, color:"#475569" }}>{t.trust_author}</div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ maxWidth:640, margin:"0 auto 100px" }}>
          <h2 style={{ fontSize:13, color:"#475569", letterSpacing:3, textTransform:"uppercase", marginBottom:40, textAlign:"center" }}>{t.faq_label}</h2>
          {t.faq.map((item,i) => (
            <div key={i} className="faq-item">
              <div style={{ fontWeight:600, fontSize:14, marginBottom:8 }}>{item.q}</div>
              <div style={{ fontSize:13, color:"#64748B", lineHeight:1.6 }}>{item.a}</div>
            </div>
          ))}
        </section>

        {/* FINAL CTA */}
        <section style={{ marginBottom:100, textAlign:"center" }}>
          <h2 style={{ fontSize:40, fontWeight:800, letterSpacing:-1.5, marginBottom:32, lineHeight:1.1, background:"linear-gradient(135deg,#F8FAFC,#94A3B8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", whiteSpace:"pre-line" }}>
            {t.final_cta_title}
          </h2>
          <Link href="/pm-agent" className="cta" style={{ fontSize:16, padding:"16px 36px" }}>{t.final_cta_btn}</Link>
        </section>

      </div>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid #1E293B", padding:"24px", textAlign:"center", fontSize:12, color:"#334155" }}>
        {t.footer}
      </footer>
    </div>
  );
}