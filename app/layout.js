import './globals.css';
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "PM Assistant",
  description: "Personal AI Project Manager — plan sprints, decompose tasks, stay focused",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#0C0C14", overflow: "auto", display: "flex", flexDirection: "column" }}>
        <div data-main><ClerkProvider appearance={{
          variables: {
            colorBackground: "#0E0E1A",
            colorText: "#E2E8F0",
            colorInputBackground: "#161622",
            colorInputText: "#E2E8F0",
            colorPrimary: "#1D4ED8",
            colorTextSecondary: "#94A3B8",
            colorNeutral: "#334155",
            fontFamily: "'Sora', 'Segoe UI', sans-serif",
          },
          elements: {
            card: {
              background: "#0E0E1A",
              border: "1px solid #1E293B",
              boxShadow: "0 20px 60px #00000080",
            },
            headerTitle: { color: "#F8FAFC" },
            headerSubtitle: { color: "#64748B" },
            dividerLine: { background: "#1E293B" },
            dividerText: { color: "#475569" },
            formFieldLabel: { color: "#94A3B8" },
            footerActionText: { color: "#64748B" },
            footerActionLink: { color: "#3B82F6" },
          }
        }}>
          {children}</div>
        </ClerkProvider>
      </body>
    </html>
  );
}