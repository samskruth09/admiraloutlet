# Admiral Outlet — online ordering

A one-page ordering site for the Admiral Outlet. A student picks a drink, builds it,
enters their first name, and taps **Pay**. The page:

1. logs the full order (drink, every option, name, total, order number) to the Outlet's
   Google Sheet, and
2. sends the student straight to a private Givebacks item priced at exactly their total.

No copying, no re-picking options on Givebacks. Plain HTML/CSS/JS, hosted free on
GitHub Pages.

## Files

| File | What it is |
| --- | --- |
| `menu.js` | **The file you edit.** Drinks, options, prices, the 18 pay links, the order-log URL. |
| `index.html`, `styles.css`, `app.js` | The page itself. |
| `google-apps-script/Code.gs` | The order-log script that lives inside the Google Sheet. |

## Pay links (Givebacks)

Givebacks can't be pre-filled from another site, so each possible order total has its
own private Givebacks item. The menu can add up to 18 different totals:

$3.00 · 3.25 · 3.50 · 3.75 · 4.00 · 4.50 · 4.75 · 5.00 · 5.50 · 5.75 · 6.25 · 6.50 ·
7.00 · 7.25 · 7.75 · 8.00 · 8.50 · 8.75

For each one: create a Givebacks item priced exactly at that amount (name it like
"Online Order – $5.50"), make it a **private listing**, and paste its link into
`payLinks` at the bottom of `menu.js`.

If a price in the menu changes, the set of possible totals can change too. A total with
no link makes the page tell the student to order at the counter, so nobody is ever sent
to the wrong amount.

## Order log (Google Sheet)

One-time setup, about 3 minutes, in the Google account that should own the log:

1. Go to [sheets.new](https://sheets.new). Name it **Admiral Outlet Orders**.
2. **Extensions → Apps Script.** Delete the sample code, paste all of
   `google-apps-script/Code.gs`, and click **Save**.
3. In the toolbar's function dropdown pick **`setup`**, then click **Run**.
   Google asks for permission: **Review permissions** → pick your account →
   **Advanced** → **Go to (project name) (unsafe)** → **Allow**. The warning appears
   because the script is yours and unpublished. It can only touch this one Sheet.
4. **Deploy → New deployment.** Click the gear → **Web app**.
   Execute as: **Me**. Who has access: **Anyone**. Click **Deploy**.
5. Copy the **Web app URL** (ends in `/exec`) into `orderLogUrl` in `menu.js`.

The Sheet gets two tabs:
- **Orders** — one row per order.
- **Choices** — one row per option picked. Use this for pivot tables
  (Insert → Pivot table) like most popular syrup or hot vs. cold.

Rows are logged when a student taps Pay, which is before they finish paying, so the
log can include the occasional abandoned order. Givebacks is the record of what was
actually paid.

## Hosting

The site is on GitHub Pages. Any change pushed to the `main` branch goes live within
a minute or two. Local notes (`BACKLOG.md`, `PRODUCT.md`, `DESIGN.md`) and tool folders
are kept out of the public repo by `.gitignore`.

## Running it locally

Open `index.html` in a browser. Everything works without a server.
