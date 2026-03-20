export const metadata = {
  title: "PROJECT MIND",
  description: "Мышление Project Manager — персональный агент",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, padding: 0, background: "#0C0C14" }}>
        {children}
      </body>
    </html>
  );
}