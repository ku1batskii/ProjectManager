import Link from "next/link";

const FEATURES = [
  {
    icon: "◈",
    title: "Sprint Planning",
    desc: "Describe your week — Eduard breaks it into daily tasks with roles and priorities.",
  },
  {
    icon: "◉",
    title: "Task Decomposition",
    desc: "One big goal becomes 3–8 actionable subtasks. MVP-first, no overengineering.",
  },
  {
    icon: "◎",
    title: "Focus Check",
    desc: "Not sure if something is worth doing? Get a sharp YES / NO / LATER with one reason.",
  },
  {
    icon: "◐",
    title: "Brief Generator",
    desc: "Describe a feature — get a clean brief: goal, context, requirements, definition of done.",
  },
  {
    icon: "◑",
    title: "Weekly Report",
    desc: "Ask for a report — get an honest summary of what's done, what's blocked, what's next.",
  },
  {
    icon: "◒",
    title: "PM Education",
    desc: "Every reply ends with one precise PM term definition. Learn by doing, not by reading.",
  },
];

const FOR_WHO = [
  { emoji: "🛠", label: "Solo founders", desc: "Ship faster without drowning in tasks" },
  { emoji: "📱", label: "Indie developers", desc: "Stay focused on code, not project chaos" },
  { emoji: "🎬", label: "Influencers", desc: "Plan content, launches and collab projects" },
  { emoji: "⚡", label: "Freelancers", desc: "Manage multiple clients like a senior PM" },
];

const FAQ = [
  {
    q: "Do I need PM experience?",
    a: "No. Eduard explains every decision and teaches you PM thinking as you work.",
  },
  {
    q: "What if I work alone?",
    a: "Perfect for that. Eduard assigns roles to show you what type of work each task requires — even if you do everything yourself.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Each account is isolated. Your sessions and tasks are visible only to you.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no commitments. Cancel from your profile in one click.",
  },
];

export default function LandingPage() {
  return (
    <div style={{
      background: "#0C0C14",
      color: "#E2E8F0",
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
      minHeight: "100vh",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #1D4ED830; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 2px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .fade-1 { animation: fadeUp 0.6s ease forwards; }
        .fade-2 { animation: fadeUp 0.6s 0.15s ease both; }
        .fade-3 { animation: fadeUp 0.6s 0.3s ease both; }
        .fade-4 { animation: fadeUp 0.6s 0.45s ease both; }

        .cta-btn {
          background: #1D4ED8;
          color: #fff;
          border: none;
          padding: 14px 32px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          letter-spacing: 0.3px;
          transition: all 0.2s;
          display: inline-block;
          text-decoration: none;
        }
        .cta-btn:hover {
          background: #2563EB;
          transform: translateY(-1px);
          box-shadow: 0 8px 32px #1D4ED840;
        }

        .feature-card {
          background: #0E0E1A;
          border: 1px solid #1E293B;
          border-radius: 14px;
          padding: 24px;
          transition: border-color 0.2s;
        }
        .feature-card:hover {
          border-color: #334155;
        }

        .faq-item {
          border-bottom: 1px solid #1E293B;
          padding: 20px 0;
        }

        @media (max-width: 640px) {
          .hero-title { font-size: 36px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .who-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#0C0C14CC",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1E293B",
        padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        maxWidth: 1100, margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "#161622", border: "2px solid #334155",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#94A3B8",
          }}>E</div>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: -0.3 }}>PROJECT MIND</span>
        </div>
        <Link href="/pm-agent" className="cta-btn" style={{ padding: "8px 20px", fontSize: 13 }}>
          Open App →
        </Link>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

        {/* Hero */}
        <section style={{ padding: "100px 0 80px", textAlign: "center" }}>
          <div className="fade-1" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#0E0E1A", border: "1px solid #1E293B",
            borderRadius: 20, padding: "6px 14px",
            fontSize: 12, color: "#64748B", marginBottom: 32,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%", background: "#22C55E",
              animation: "pulse-dot 2s infinite",
            }} />
            AI Project Manager · $4.99/mo
          </div>

          <h1 className="fade-2 hero-title" style={{
            fontSize: 56, fontWeight: 800, lineHeight: 1.1,
            letterSpacing: -2, marginBottom: 24,
            background: "linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Your personal PM.<br />Always on. Never judges.
          </h1>

          <p className="fade-3" style={{
            fontSize: 18, color: "#64748B", lineHeight: 1.7,
            maxWidth: 520, margin: "0 auto 40px",
          }}>
            Tell Eduard what's happening. He plans sprints, decomposes tasks,
            writes briefs — and teaches you PM thinking along the way.
          </p>

          <div className="fade-4" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/pm-agent" className="cta-btn">
              Start for free →
            </Link>
            <a href="#features" style={{
              background: "transparent",
              border: "1px solid #1E293B",
              color: "#64748B",
              padding: "14px 28px",
              borderRadius: 12,
              fontSize: 15,
              cursor: "pointer",
              fontFamily: "inherit",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#94A3B8"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E293B"; e.currentTarget.style.color = "#64748B"; }}
            >
              See features
            </a>
          </div>
        </section>

        {/* Preview */}
        <section style={{ marginBottom: 100 }}>
          <div style={{
            background: "#0E0E1A",
            border: "1px solid #1E293B",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 40px 120px #00000060",
          }}>
            {/* Mock chat UI */}
            <div style={{
              background: "#0E0E1A",
              borderBottom: "1px solid #1E293B",
              padding: "14px 20px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "#161622", border: "2px solid #334155",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "#94A3B8",
              }}>E</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Eduard</div>
                <div style={{ fontSize: 10, color: "#22C55E" }}>online</div>
              </div>
            </div>
            <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { role: "user", text: "Разбей задачу: добавить онбординг для новых пользователей" },
                { role: "assistant", text: "Понял, давай разложим. Онбординг — это 5 шагов:\n\n1. Экран приветствия (Design)\n2. Выбор роли пользователя (PM)\n3. Первый диалог с агентом (Backend)\n4. Тур по интерфейсу (Frontend)\n5. Первая задача-пример (PM)\n\n— Онбординг — последовательность шагов, которая помогает новому пользователю понять ценность продукта за первые 3 минуты." },
              ].map((m, i) => (
                <div key={i} style={{
                  display: "flex",
                  flexDirection: m.role === "user" ? "row-reverse" : "row",
                  gap: 8, alignItems: "flex-end",
                }}>
                  {m.role === "assistant" && (
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "#161622", border: "1px solid #334155",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, color: "#94A3B8", flexShrink: 0,
                    }}>E</div>
                  )}
                  <div style={{
                    maxWidth: "78%",
                    background: m.role === "user" ? "linear-gradient(135deg, #1D4ED8, #1E40AF)" : "#161622",
                    border: m.role === "user" ? "none" : "1px solid #1E293B",
                    borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    padding: "10px 14px", fontSize: 13, lineHeight: 1.6,
                    color: m.role === "user" ? "#EFF6FF" : "#CBD5E1",
                    whiteSpace: "pre-line",
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For who */}
        <section style={{ marginBottom: 100 }}>
          <h2 style={{ fontSize: 13, color: "#475569", letterSpacing: 3, textTransform: "uppercase", marginBottom: 40, textAlign: "center" }}>
            FOR WHO
          </h2>
          <div className="who-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}>
            {FOR_WHO.map((w, i) => (
              <div key={i} style={{
                background: "#0E0E1A",
                border: "1px solid #1E293B",
                borderRadius: 14, padding: "24px 20px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{w.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{w.label}</div>
                <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" style={{ marginBottom: 100 }}>
          <h2 style={{ fontSize: 13, color: "#475569", letterSpacing: 3, textTransform: "uppercase", marginBottom: 40, textAlign: "center" }}>
            WHAT Eduard DOES
          </h2>
          <div className="features-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <div style={{ fontSize: 20, color: "#334155", marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section style={{ marginBottom: 100 }}>
          <h2 style={{ fontSize: 13, color: "#475569", letterSpacing: 3, textTransform: "uppercase", marginBottom: 40, textAlign: "center" }}>
            PRICING
          </h2>
          <div style={{ maxWidth: 420, margin: "0 auto" }}>
            <div style={{
              background: "#0E0E1A",
              border: "1px solid #1E293B",
              borderRadius: 20, padding: "40px 36px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 16, letterSpacing: 2 }}>MONTHLY</div>
              <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: -2, marginBottom: 4 }}>$4.99</div>
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 32 }}>per month · cancel anytime</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32, textAlign: "left" }}>
                {[
                  "Unlimited conversations",
                  "Sprint planning & task decomposition",
                  "Brief & report generation",
                  "Session history (all chats saved)",
                  "Personalized PM education",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "#94A3B8" }}>
                    <span style={{ color: "#22C55E", flexShrink: 0 }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
              <Link href="/pm-agent" className="cta-btn" style={{ width: "100%", textAlign: "center", display: "block" }}>
                Get started →
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: 100, maxWidth: 640, margin: "0 auto 100px" }}>
          <h2 style={{ fontSize: 13, color: "#475569", letterSpacing: 3, textTransform: "uppercase", marginBottom: 40, textAlign: "center" }}>
            FAQ
          </h2>
          {FAQ.map((item, i) => (
            <div key={i} className="faq-item">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{item.q}</div>
              <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{item.a}</div>
            </div>
          ))}
        </section>

      </div>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #1E293B",
        padding: "24px",
        textAlign: "center",
        fontSize: 12, color: "#334155",
      }}>
        PROJECT MIND · 2025 · Built by a solo founder, for solo founders
      </footer>
    </div>
  );
}