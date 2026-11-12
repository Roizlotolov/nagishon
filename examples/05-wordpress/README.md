# WordPress (ערכת בת)

**עברית:** קטע קוד ל־`functions.php` של ערכת בת (child theme): טוען את הסקריפט מ־jsDelivr בפוטר עם `defer`, מוסיף `data-nagishon` ו־`data-statement-url="/accessibility/"` (עדכנו לכתובת עמוד ההצהרה שלכם), ומדפיס את סקריפט ה־pre-paint ב־`<head>`. הדביקו בסוף `functions.php` של ערכת הבת, לא של ערכת האם (עדכוני ערכה ימחקו אותו). תוסף מלא מתוכנן, וטרם קיים.

**English:** A child-theme snippet for `functions.php`: enqueues the CDN script in the footer with `defer`, adds `data-nagishon` and `data-statement-url="/accessibility/"` via `script_loader_tag` (change it to your statement page), and prints the pre-paint script in `wp_head`. Paste it into the child theme's `functions.php`, not the parent's. A full plugin is planned but does not exist yet.
