export const metadata = {
  title: "PROJECT MANAGER",
  description: "PM ассистент",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, padding: 0, background: "#0C0C14", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}