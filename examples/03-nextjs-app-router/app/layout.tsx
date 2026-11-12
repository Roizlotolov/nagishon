import type { ReactNode } from "react";
import { NAGISHON_PREPAINT } from "nagishon/prepaint";
import { NagishonWidget } from "nagishon/react";

export const metadata = { title: "דוגמה: nagishon עם Next.js" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: סקריפט ה־pre-paint מוסיף data-nagishon-* ל־<html> לפני ההידרציה
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NAGISHON_PREPAINT }} />
      </head>
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", lineHeight: 1.7, color: "#1a1a2e" }}>
        {children}
        <NagishonWidget statementUrl="/accessibility" skipLink={{ target: "#main" }} />
      </body>
    </html>
  );
}
