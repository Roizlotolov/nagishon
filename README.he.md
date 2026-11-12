<div dir="rtl">

# nagishon (נגישון)

[![CI](https://github.com/Roizlotolov/nagishon/actions/workflows/ci.yml/badge.svg)](https://github.com/Roizlotolov/nagishon/actions/workflows/ci.yml)
[![גרסת npm](https://img.shields.io/npm/v/nagishon.svg)](https://www.npmjs.com/package/nagishon)
[![גודל](https://img.shields.io/bundlephobia/minzip/nagishon)](https://bundlephobia.com/package/nagishon)
[![רישיון: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

תפריט נגישות חינמי בקוד פתוח (MIT) לאתרים, בעברית ומימין לשמאל כברירת מחדל. כתוב ב־TypeScript ללא תלויות זמן ריצה, ללא בקשות רשת וללא עוגיות. [English README](README.md).

## מה זה, ומה זה לא

**מה זה:** כפתור «נגישות» שמבקרים פותחים כדי להתאים את האתר לצורכיהם: גודל טקסט (100%–200%), ניגודיות כהה או בהירה, גווני אפור, הדגשת קישורים וכותרות, גופן קריא, ריווח טקסט לפי WCAG 1.4.12, עצירת תנועה, סמן גדול וסרגל קריאה. הבחירות נשמרות בדפדפן של המבקר (`localStorage`) ולא נשלחות לשום מקום. התפריט גם מקשר להצהרת הנגישות שלכם ולערוץ פנייה.

**מה זה לא:** זה לא דרך להפוך אתר לעומד בדרישות. תפריט לא יכול לתקן טקסט חלופי חסר, שדות טופס בלי תווית, מבנה כותרות שבור, מלכודות מקלדת או עיצוב בניגודיות נמוכה, והוא לא מחליף עמידה של האתר עצמו בתקן הישראלי ת"י 5568 (המבוסס על WCAG). התקנת התפריט לבדה אינה מקיימת את תקנות שוויון זכויות לאנשים עם מוגבלות. ראו בו שכבת נוחות מעל אתר נגיש.

- רקע משפטי (בעברית, לא ייעוץ משפטי): [docs/research/israel-accessibility-law.he.md](docs/research/israel-accessibility-law.he.md)
- מה בעל האתר עדיין צריך לעשות: [docs/compliance-checklist.he.md](docs/compliance-checklist.he.md)
- תבנית הצהרת נגישות: [docs/accessibility-statement-template.he.md](docs/accessibility-statement-template.he.md)

## התקנה ב־30 שניות

הוסיפו שורה אחת לפני `</body>`:

```html
<script src="https://cdn.jsdelivr.net/npm/nagishon@1/dist/nagishon.iife.js" defer data-nagishon data-statement-url="/accessibility"></script>
```

אופציונלי, מונע הבהוב של ההגדרות השמורות בביקורים חוזרים. הדביקו **בתוך `<head>`**, בלי `defer` ובלי `async`. הסקריפט מחיל את ההגדרות השמורות לפני הציור הראשון:

```html
<script src="https://cdn.jsdelivr.net/npm/nagishon@1/dist/prepaint.js"></script>
```

מאפייני data שתג הסקריפט מכיר: `data-locale`, `data-position`, `data-statement-url`, `data-contact-url`, `data-hotkey`, `data-text-scaling`, `data-skip-link` (סלקטור, למשל `#main`), `data-accent`, `data-background`, `data-foreground`, `data-radius`, `data-theme` (‏`auto`, ‏`light`, ‏`dark`), `data-offset-block`, `data-offset-inline`, `data-launcher-shape` (‏`pill`, ‏`circle`), `data-launcher-size` (‏`md`, ‏`lg`), `data-launcher-icon` (‏`solid`, ‏`outline`), `data-launcher-style` (‏`accent`, ‏`neutral`), `data-launcher-label`, `data-z-index`, `data-features` (רשימה מופרדת בפסיקים של התכונות היחידות להפעלה, למשל `textScale,contrast`), ו־`data-nagishon-manual` כדי לדלג על אתחול אוטומטי ולקרוא ל־`Nagishon.init()` בעצמכם.

```html
<script>
  Nagishon.init({ locale: "he", statementUrl: "/accessibility", skipLink: { target: "#main" } });
</script>
```

## npm / ESM

```bash
npm install nagishon
```

```ts
import { init } from "nagishon";

const nagishon = init({
  statementUrl: "/accessibility",
  contactUrl: "mailto:accessibility@your-domain.example",
  skipLink: { target: "#main" },
});
```

`init()` אידמפוטנטי: קריאה שנייה מחזירה את המופע הקיים. קראו ל־`nagishon.destroy()` כדי להסיר אותו.

## Next.js (App Router)

```tsx
// app/layout.tsx
import { NAGISHON_PREPAINT } from "nagishon/prepaint";
import { NagishonWidget } from "nagishon/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <script dangerouslySetInnerHTML={{ __html: NAGISHON_PREPAINT }} />
      </head>
      <body>
        {children}
        <NagishonWidget statementUrl="/accessibility" />
      </body>
    </html>
  );
}
```

ב־`nagishon/react` כבר מופיע `"use client"`, ולכן אפשר לייבא אותו מתוך Server Component. הרכיב לא מציג דבר בשרת ומתעגן אחרי ההידרציה. סקריפט ה־pre-paint מוסיף מאפייני `data-nagishon-*` ל־`<html>` לפני ההידרציה, ולכן מומלץ להוסיף `suppressHydrationWarning` ל־`<html>`.

## React / Vite

```tsx
import { NagishonWidget, useNagishon } from "nagishon/react";

export function App() {
  return (
    <>
      <NagishonWidget statementUrl="/accessibility" skipLink={{ target: "#main" }} />
      <main id="main">...</main>
      <OpenButton />
    </>
  );
}

function OpenButton() {
  const { state, open } = useNagishon();
  return <button onClick={open}>נגישות (טקסט {state.textScale * 100}%)</button>;
}
```

`useNagishon()` מחזיר `{ state, set, setState, reset, open, close, instance }`, בטוח ל־SSR ומאזין לאירוע `change` של המופע. כדי להשתמש בכפתור משלכם, רנדרו `<NagishonWidget launcher={{ hidden: true }} />` וקראו ל־`open()`.

## אפשרויות

| אפשרות | טיפוס | ברירת מחדל | תיאור |
|---|---|---|---|
| `locale` | `"he" \| "en" \| "ar" \| "ru"` (כל מחרוזת אחרת חוזרת ל־`"he"`) | `"he"` | שפת הממשק. |
| `dir` | `"rtl" \| "ltr"` | לפי השפה (`he`, `ar` הן RTL) | כיוון הטקסט בתפריט. |
| `position` | `"start" \| "end"` | `"start"` | הצד הלוגי של הכפתור: `start` הוא הצד הימני בדף עברי (RTL) והשמאלי בדף LTR. |
| `offset` | `{ block?: number; inline?: number }` | `{ block: 20, inline: 20 }` | מרחק בפיקסלים מהקצה התחתון (`block`) ומהצד שנבחר ב־`position` (`inline`). |
| `statementUrl` | `string` | אין | קישור «הצהרת נגישות». אם לא מוגדר, הקישור לא מוצג. מומלץ מאוד (תקנה 35ה). |
| `contactUrl` | `string` | אין | קישור אופציונלי «דיווח על בעיית נגישות» (`mailto:`, `tel:` או `https:`). |
| `hotkey` | `string \| false` | `"Alt+Shift+A"` | קיצור לפתיחה וסגירה, בפורמט `Mod+Key` כש־Mod הוא `Alt`, `Ctrl`, `Shift` או `Meta`, מחוברים ב־`+`. `false` מכבה אותו. |
| `textScaling` | `"elements" \| "root"` | `"elements"` | אסטרטגיית הגדלת הטקסט, ראו בהמשך. |
| `skipLink` | `{ target: string; label?: string } \| false` | `false` | מוסיף קישור «דילוג לתוכן המרכזי» כאלמנט הראשון ב־`<body>`. |
| `features` | `Partial<Record<keyof NagishonState, boolean>>` | הכול `true` | הסתרת בקרות בודדות, למשל `{ bigCursor: false }`. |
| `theme` | `Partial<{ preset: "auto" \| "light" \| "dark"; accent: string; background: string; foreground: string; radius: string; zIndex: number }>` | `{ preset: "auto" }` | התאמות ויזואליות, ראו «עיצוב». `auto` עוקב אחרי `prefers-color-scheme`. |
| `launcher` | `{ label?: string; showText?: boolean; hidden?: boolean; shape?: "pill" \| "circle"; size?: "md" \| "lg"; icon?: "solid" \| "outline"; style?: "accent" \| "neutral" }` | `{ shape: "pill", size: "md", icon: "solid", style: "accent", showText: true, hidden: false }` | `shape: "circle"` (או `showText: false`) מציג אייקון בלבד (השם הנגיש מגיע מ־`label`). `size`: ‏`md` הוא 48px, ‏`lg` הוא 56px. `icon: "outline"` הוא סמל הנגישות הקווי המוכר; `style: "neutral"` נותן עיגול בצבע הרקע עם מסגרת דקה במקום מילוי ב־accent. `hidden: true` מסיר את הכפתור המובנה וקוראים ל־`open()` בעצמכם. |
| `initialState` | `Partial<NagishonState>` | אין | מוחל רק כשאין למבקר מצב שמור. |
| `storageKey` | `string` | `"nagishon:v1"` | מפתח ב־`localStorage`. אם שיניתם אותו, העבירו את אותו מפתח לסקריפט ה־pre-paint (`prepaintScript(key)` מתוך `nagishon/prepaint`). |
| `onChange` | `(state: NagishonState) => void` | אין | נקרא אחרי כל שינוי. |

מפתחות המצב: `textScale` (‏1, 1.25, 1.5, 1.75, 2), `contrast` (‏`"none" | "dark" | "light"`), ‏`grayscale`, ‏`underlineLinks`, ‏`highlightHeadings`, ‏`readableFont`, ‏`textSpacing`, ‏`stopMotion`, ‏`bigCursor`, ‏`readingGuide` (בוליאניים). סרגל הקריאה מוצע במכשירי הצבעה (עכבר) בלבד.

## API של המופע

```ts
const nagishon = init();
nagishon.open(); nagishon.close(); nagishon.toggle();
nagishon.getState();                    // NagishonState
nagishon.set("contrast", "dark");       // מפתח אחד
nagishon.setState({ textScale: 1.5, underlineLinks: true });
nagishon.reset();                       // חזרה לברירות מחדל, מפתח האחסון נמחק
const off = nagishon.on("change", (state) => console.log(state)); // וגם "open" ו־"close"
off();
nagishon.destroy();                     // מסיר DOM, מאזינים ו־observers; האחסון נשאר
```

`get()` מחזיר את המופע הנוכחי או `null`. בגרסת תג הסקריפט אותן פונקציות זמינות ב־`window.Nagishon` (‏`init`, ‏`get`, ‏`version`).

## אירועים

התפריט שולח אירועים על `window`:

- `nagishon:ready`: אחרי האתחול.
- `nagishon:change`: בכל שינוי מצב, והמצב ב־`event.detail`.

```js
window.addEventListener("nagishon:change", (e) => console.log(e.detail.textScale));
```

## עיצוב

העבירו את האפשרות `theme`; הערכים הם ערכי CSS רגילים.

```ts
init({ theme: { accent: "#0b4aa8", radius: "8px", zIndex: 10000 } });
```

`theme.preset` הוא `"auto"` כברירת מחדל (עוקב אחרי `prefers-color-scheme`); `"light"` או `"dark"` כופים ערכה אחת.

### מיקום וצבע הכפתור

`position` בוחר צד (`"start"` הוא הקצה הימני בדפי RTL והשמאלי בדפי LTR, ‏`"end"` ההפך) ו־`offset` את המרחק בפיקסלים מהתחתית ומאותו צד. `theme.accent` צובע את הכפתור ואת הבקרים הנבחרים; הטקסט עליו הופך לשחור או ללבן אוטומטית.

```html
<script src="https://cdn.jsdelivr.net/npm/nagishon@1/dist/nagishon.iife.js" defer data-nagishon
  data-position="end" data-offset-block="24" data-offset-inline="16"
  data-launcher-shape="circle" data-launcher-size="lg" data-accent="#ff6a00" data-theme="dark"></script>
```

```ts
init({
  position: "end",
  offset: { block: 24, inline: 16 },
  launcher: { shape: "circle", size: "lg" },
  theme: { accent: "#ff6a00", preset: "dark" },
});
```

שימו לב לניגודיות: טקסט על צבע ה־`accent` וה־`background` שלכם צריך להגיע ל־4.5:1, וגבולות רכיבי ממשק ל־3:1. התפריט עובר אוטומטית לגרסה כהה לפי `prefers-color-scheme: dark`, ולצבעי שחור/לבן/צהוב מפורשים כשהדף במצב ניגודיות גבוהה.

## גודל טקסט: בחירת אסטרטגיה

| אסטרטגיה | איך זה עובד | מתאים ל | פשרות |
|---|---|---|---|
| `elements` (ברירת מחדל) | קוראת פעם אחת את `font-size` המחושב של כל אלמנט טקסט ומציבה inline גודל מוגדל (וגם `line-height` בפיקסלים). `MutationObserver` מגדיל תוכן שנוסף מאוחר יותר. ב־100% הערכים המקוריים משוחזרים. | אתרים עם px או יחידות מעורבות, בוני דפים, וכל אתר שבסיס הפריסה בו אינו גודל השורש. | נוגעת באלמנטים רבים (העבודה מחולקת למקטעים כדי למנוע תקיעות); `font-size` inline גובר על ה־CSS שלכם כל עוד ההגדלה פעילה. |
| `root` | מציבה גודל מוגדל על `html`. | אתרים שבנויים ב־`rem`/`em`. הכי זולה והכי נקייה. | לא משפיעה על טקסט שהוגדר בפיקסלים. |

חלון התפריט נמצא ב־Shadow DOM, אינו מוגדל על ידי אף אסטרטגיה, ומכבד זום של הדפדפן.

עוד הערה: מצב גווני האפור משתמש ב־`filter: grayscale(1)` על `<html>`. `filter` על השורש יוצר בלוק מכיל לצאצאים עם `position: fixed`, ובאתרים מסוימים זה עלול להזיז אלמנטים קבועים. אם זה רלוונטי לאתר שלכם, הסתירו את הבקרה עם `features: { grayscale: false }`.

## פרטיות

אין בקשות רשת, אין עוגיות, אין אנליטיקס ואין גופנים חיצוניים. האחסון היחיד הוא `localStorage` תחת `nagishon:v1` (נמחק כשההגדרות חוזרות לברירת המחדל). ההגדרות מסתנכרנות בין לשוניות של אותו origin דרך אירוע `storage`.

## הנגישות של התפריט עצמו

התפריט נבנה לעמוד ב־WCAG 2.1 AA, וזה נבדק אוטומטית ולא רק מוצהר:

- axe-core (תגיות `wcag2a`, ‏`wcag2aa`, ‏`wcag21a`, ‏`wcag21aa`) רץ ב־Playwright על דף ההדגמה כשהחלון סגור, פתוח, פתוח כשהדף בניגודיות כהה, ובשפה האנגלית (LTR).
- בדיקות מקלדת מתוסרטות: Tab מגיע לכפתור, Enter פותח, המיקוד עובר לכותרת החלון, Tab ו־Shift+Tab נשארים בתוך החלון, Escape סוגר ומחזיר מיקוד, קיצור `Alt+Shift+A` וקישור הדילוג.
- בדיקות שכל בקרה משנה את מאפיין `data-nagishon-*` ואת מצב `aria-checked`/`aria-pressed`, שהגדרות נשמרות לפני הציור הראשון, ושאיפוס מנקה הכול.
- התפריט מוצג ב־Shadow DOM, ובדף ההדגמה יש CSS עוין (`button, a { all: unset }`, גופן בסיס קטן) כדי לוודא בידוד.
- כל הבקרות בגודל 44x44 פיקסלים לפחות, המיקוד תמיד נראה, שינויים מוכרזים באזור `aria-live="polite"`, והדף שמאחורי החלון הופך ל־inert בזמן שהוא פתוח.

בדיקות אוטומטיות לא מוצאות הכול. אם נתקלתם בבעיה עם קורא מסך או טכנולוגיה מסייעת אחרת, פתחו issue.

## הערות לגבי חוק הנגישות בישראל

ההערות כאן הן תקציר ולא ייעוץ משפטי; המקורות ב[מסמך המחקר](docs/research/israel-accessibility-law.he.md).

- **הצהרת נגישות (תקנה 35ה):** חובה לפרסם את ההצהרה במקום בולט באתר. קשרו אליה מהכותרת התחתונה בכל דף, והעבירו `statementUrl` כדי שגם התפריט יקשר אליה. תבנית למילוי: [docs/accessibility-statement-template.he.md](docs/accessibility-statement-template.he.md). כתבו רק עובדות נכונות ואל תטענו לבדיקה שלא בוצעה.
- **ערוץ פנייה ו־60 הימים לתיקון (35א(ד)):** הציבו דרך עובדת לדווח על חלק לא נגיש באתר (העבירו `contactUrl`) וטפלו בדיווחים. סטייה מהתקן אינה נחשבת בדרך כלל להפרה אלא אם נשלחה הודעה והיא לא תוקנה תוך 60 יום, ובינתיים יש להציע דרך חלופית לקבל את השירות.
- **כל השאר נמצא באתר עצמו:** עברו על [docs/compliance-checklist.he.md](docs/compliance-checklist.he.md) (טקסט חלופי, תוויות, מבנה כותרות, גישה מהמקלדת, ניגודיות, כתוביות כשנדרש, בדיקה תקופתית).

## תמיכה בדפדפנים

שתי הגרסאות האחרונות של Chrome, Edge, Firefox ו־Safari (דסקטופ), ו־Safari ב־iOS 16 ומעלה. אין תמיכה ב־Internet Explorer.

## Examples / דוגמאות

דוגמאות להרצה (תג סקריפט, אפשרויות, Next.js, React/Vite, וורדפרס, כפתור משלכם, תת־קבוצה של תכונות, אירועים): [examples/](examples/README.md).

## כתב ויתור

nagishon ניתן כשירות לציבור, בחינם, **כמות שהוא (as is)**, ללא אחריות מכל סוג וללא התחייבות לתמיכה או למענה (ראו רישיון MIT). השימוש בו הוא בחירתכם ועל אחריותכם; הוא אינו ייעוץ משפטי ואינו הופך אתר לעומד בחוק או בתקן כלשהו. אין ערוץ פנייה למתחזק מלבד מעקב ה-issues הציבורי ב-GitHub, שנקרא לפי יכולת וללא התחייבות.

## תרומה

ראו [CONTRIBUTING.md](CONTRIBUTING.md). בקצרה: Node 24, הריצו `npm run check && npm run test:e2e`, השתמשו במאפייני CSS לוגיים בלבד, וכתבו עברית בלשון רבים ניטרלית מגדר. דיווח על בעיות אבטחה: [SECURITY.md](SECURITY.md). הערות גרסה: [CHANGELOG.md](CHANGELOG.md).

## רישיון

[MIT](LICENSE) © 2026 Roi Zlotolov

</div>
