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
      <body style={{ margin: 0, padding: 0, background: "#0C0C14", overflow: "auto" }}>
        <ClerkProvider appearance={{
          variables: {
            colorBackground: "#0E0E1A",
            colorPrimary: "#3B82F6",
            colorText: "#E2E8F0",
            colorTextSecondary: "#94A3B8",
            colorBorder: "#2a2a3e",
            colorInputBackground: "#161622",
            colorInputBorder: "#334155",
            colorSuccessText: "#10B981",
            colorSuccess: "#10B981",
            colorDanger: "#EF4444",
          },
          elements: {
            rootBox: { background: "#0C0C14", color: "#E2E8F0" },
            cardBox: { background: "#161622", borderColor: "#2a2a3e" },
            footerActionLink: { color: "#3B82F6" },
          }
        }}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
