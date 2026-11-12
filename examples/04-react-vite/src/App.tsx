import { NagishonWidget, useNagishon } from "nagishon/react";

export function App() {
  return (
    <>
      {/* הכפתור הצף מוסתר; הכפתור שבכותרת פותח את התפריט */}
      <NagishonWidget launcher={{ hidden: true }} statementUrl="/accessibility" skipLink={{ target: "#main" }} />
      <Header />
      <main id="main" tabIndex={-1}>
        <h1>דוגמה: nagishon עם React ו־Vite</h1>
        <TextScaleLine />
      </main>
    </>
  );
}

function Header() {
  const { open } = useNagishon();
  return (
    <header>
      <strong>דוגמה: אתר קטן</strong>
      <button type="button" onClick={open}>
        הגדרות נגישות
      </button>
    </header>
  );
}

function TextScaleLine() {
  const { state } = useNagishon();
  return <p>גודל הטקסט הנוכחי: {state.textScale * 100}%</p>;
}
