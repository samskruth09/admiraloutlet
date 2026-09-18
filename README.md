# Admiral Outlet — online ordering

A one-page ordering site for the Admiral Outlet. A student picks a drink, builds it,
enters their first name, and taps **Pay**. The page:

1. sends the full order (drink, every option, name, total) to the Outlet's Google Sheet
   and waits for it to confirm and hand back today's order number, then
2. sends the student to a private Givebacks item priced at exactly their total.

If the Sheet can't be reached, the student is asked to try again and is never sent to pay,
so every payment has an order on file.

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

The log is a Google Sheet (**Admiral Outlet Orders**) with the script in `google-apps-script/Code.gs` deployed as a web app. Its
`/exec` URL is `orderLogUrl` in `menu.js`.

**Updating the script:** in the Sheet, **Extensions → Apps Script**, select everything in
the code box and replace it with the new `Code.gs` (it must start with `/**`, not
`function myFunction`). Save, then **Deploy → Manage deployments → pencil → Version: New
version → Deploy**. The URL stays the same. A deployment only runs code that was saved
before you clicked Deploy.

**Setting it up from scratch:** make a Sheet, paste the script as above, then **Deploy → New
deployment → gear → Web app**, with Execute as **Me** and access **Anyone**. Approve
Google's permission screen (**Advanced → Go to … (unsafe) → Allow**). The warning appears
because the script is yours and unpublished, and it can only touch that one Sheet. Put the
new `/exec` URL in `orderLogUrl`.

The tabs create themselves:
- **Orders** — one row per order, with today's order number (#1, #2, …) and **Paid**,
  **Made**, and **Notes** columns for the counter. Paid rows turn green; made rows fade out.
- **Choices** — one row per option picked. Use it for pivot tables
  (Insert → Pivot table), like most popular syrup or hot vs. cold.
- **Controls** — the **Online ordering on** checkbox, the message students see when it's
  off, and the **sold-out list** (drink or option names exactly as the site shows them).
  The site reads this when it loads, and the script re-checks it on every order.

Rows are logged when a student taps Pay, which is before they finish paying, so some rows
will never be paid. Givebacks is the record of what was actually paid. How the counter
verifies payment is in the officers' operations plan, which is kept off the public repo.

## Hosting

The site is on GitHub Pages. Any change pushed to the `main` branch goes live within
a minute or two. Local notes (`BACKLOG.md`, `PRODUCT.md`, `DESIGN.md`) and tool folders
are kept out of the public repo by `.gitignore`.

## Running it locally

Open `index.html` in a browser. Everything works without a server.
