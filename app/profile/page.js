"use client";

import { UserProfile } from "@clerk/nextjs";
import Link from "next/link";

export default function ProfilePage() {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "#0C0C14",
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        background: "#0E0E1A",
        borderBottom: "1px solid #1E293B",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <Link href="/pm-agent" style={{
          textDecoration: "none",
          border: "1px solid #1E293B",
          color: "#64748B",
          padding: "6px 12px",
          borderRadius: 8,
          fontSize: 11,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          ← Back
        </Link>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#E2E8F0" }}>Profile</span>
      </div>

      {/* Clerk UserProfile */}
      <div style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        padding: "24px 16px",
      }}>
        <UserProfile
          appearance={{
            variables: {
              colorBackground: "#0E0E1A",
              colorText: "#E2E8F0",
              colorInputBackground: "#161622",
              colorInputText: "#E2E8F0",
              colorPrimary: "#1D4ED8",
              colorTextSecondary: "#94A3B8",
              fontFamily: "'Sora', 'Segoe UI', sans-serif",
            },
            elements: {
              rootBox: { width: "100%", maxWidth: 600 },
              card: {
                background: "#0E0E1A",
                border: "1px solid #1E293B",
                boxShadow: "none",
                width: "100%",
              },
              navbar: { borderRight: "1px solid #1E293B" },
              navbarButton: { color: "#94A3B8" },
              headerTitle: { color: "#F8FAFC" },
              headerSubtitle: { color: "#64748B" },
            }
          }}
        />
      </div>
    </div>
  );
}