# Reverb Merch — Developer Handoff
## reverb-merch-master/

---

## Files

```
reverb-merch-master/
├── index.html          ← The full website (hero/case-study images embedded as base64;
│                          portfolio grid is rendered from data/portfolio.json)
├── data/
│   └── portfolio.json  ← "Our Work" portfolio items (title, description, category, image path)
├── admin/               ← Decap CMS admin panel (edit portfolio + upload images from the browser)
│   ├── index.html
│   └── config.yml
├── images/             ← Full-resolution images referenced by the portfolio grid
│   ├── logo.jpg
│   ├── vodworks-gift-set.png
│   ├── ibex-onboarding-kit.png
│   ├── vodworks-swag-box.png
│   ├── escorts-gift-set.png
│   ├── fiber-mountain-kit.png
│   ├── mozack-welcome-box.png
│   ├── unlayer-corporate-set.png
│   ├── noon-brand-merch.png
│   ├── ibex-awards-kits.png
│   ├── technomites-full-kit.png
│   ├── branded-notebooks.png
│   ├── unifonic-exhibition-kit.png
│   ├── retrocausal-keychain.png
│   ├── noon-academy-apparel.png
│   ├── contour-software-set.png
│   ├── lincoln-corners-mugs.png
│   ├── investkar-flasks.png
│   ├── macpac-keychain-pen.jpg
│   ├── macpac-pen-box.jpg
│   ├── exd-gift-box.jpg
│   ├── uploads/         ← New images uploaded via the admin panel land here
│   └── logos/          ← Drop client logo PNGs here (see Clients section below)
└── DEVELOPER.md        ← This file
```

---

## Quick Edits (no coding needed)

| What              | How                                                              |
|-------------------|------------------------------------------------------------------|
| WhatsApp number   | Find & replace `923183241305` in index.html                     |
| Email address     | Find & replace `hello@reverbmerch.com` in index.html            |
| Instagram handle  | Find & replace `reverbmerch` in index.html                      |
| Pricing           | Search `PKR 800`, `PKR 2,500`, `PKR 6,000` — edit inline       |
| Countdown date    | Search `new Date(now.getFullYear(), 10, 15)` — month is 0-based |

---

## Brand Colors (CSS variables at top of <style>)

```css
--p: #6B2D8B;   /* Purple  */
--m: #D4006A;   /* Magenta */
```
Change these 2 values to completely rebrand the site.

---

## Managing Portfolio Items ("Our Work")

The portfolio grid is **data-driven**: `index.html` fetches `data/portfolio.json` at
page load and renders each item into the grid (filtering and the click-to-zoom
lightbox both keep working automatically — nothing else to wire up).

**Option A — Admin panel (recommended, no coding):**
Use the `/admin` panel (see "Admin Panel" section below) to add, edit, reorder,
or delete portfolio items and upload new images directly from the browser.

**Option B — Edit the JSON directly:**
Open `data/portfolio.json` and add an entry to the `items` array:
```json
{
  "title": "Client Name Gift Set",
  "desc": "Description here",
  "cat": "gifts",
  "image": "images/your-new-image.png"
}
```
Categories: `gifts` `employee` `apparel` `events` `packaging` `stationery`

Place the referenced image file in `images/` (or `images/uploads/`), then commit
and push — Netlify redeploys automatically.

---

## Client Logos Section

Currently shows text fallback. To show actual logos:
1. Place PNG files in `images/logos/` folder
2. In index.html find the `.cl-box` elements
3. Replace text content with: `<img src="images/logos/clientname.png" alt="Client">`

---

## Contact Form

**On Netlify:** Works automatically once deployed — no config needed. Submissions
appear under the site's **Forms** tab in the Netlify dashboard (exportable as CSV,
with optional email notifications under Forms → Settings → Form notifications).

**On other hosts:** Replace form with Formspree:
1. Sign up at formspree.io
2. Change `<form name="contact" netlify>` to `<form action="https://formspree.io/f/YOUR_ID" method="POST">`

---

## Instagram Live Feed

Current section shows portfolio images linking to @reverbmerch.

To connect real Instagram feed:
1. Create a Meta Developer App at developers.facebook.com
2. Add Instagram Basic Display product
3. Get a long-lived access token
4. Replace the static `.ig-item` divs with a JS fetch from:
   `https://graph.instagram.com/me/media?fields=id,media_url,thumbnail_url,permalink&access_token=YOUR_TOKEN`
   (~2 hours dev work)

---

## Content Security Policy (`_headers`)

The site ships a CSP covering both the homepage and `/admin/*`. `script-src`
uses `'unsafe-inline'` (not hash-locked) specifically so that editing an inline
`<script>` block in `index.html` — including AI-assisted edits — never silently
breaks the page. An earlier hash-locked version broke the mockup tool, stats
counter, and nav twice from routine edits before being reverted; the remaining
protections (XSS-escaping on portfolio data via `escapeHTML()`, `noopener
noreferrer` on external links, frame/referrer/permissions headers) cover the
actual risk without that fragility.

`/admin/*` uses a separate, more permissive policy since Decap CMS needs
`unpkg.com`, GitHub/Gravatar APIs, and `blob:`/inline scripts to function.

---

## Deploying to Netlify (Free)

The site now lives in a git repo (needed for the admin panel to work — see below).
Deploy from Git rather than drag-and-drop so the repo stays connected and every
push (including admin panel edits) auto-deploys.

**1. Push the repo to GitHub** (already done for the initial setup — repeat only
if starting fresh):
```
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

**2. Create the Netlify site from Git:**
1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
2. Choose **GitHub**, authorize Netlify, and pick this repo
3. Build settings: leave **Build command** empty and **Publish directory** as `/`
   (this is a static site — nothing to build)
4. Click **Deploy site** — live URL in ~30 seconds
5. Add a custom domain in **Site configuration → Domain management**

**3. Enable the admin panel (Netlify Identity + Git Gateway):**
1. In the site dashboard: **Site configuration → Identity → Enable Identity**
2. Under **Identity → Registration**, set to **Invite only** (recommended, so
   the public can't self-register admin accounts)
3. Under **Identity → Services**, enable **Git Gateway** — this lets the admin
   panel commit changes to the repo on your behalf without you managing GitHub
   tokens
4. Go to the **Identity** tab → **Invite users** → enter your email → follow the
   invite link to set a password
5. Visit `https://YOUR-SITE.netlify.app/admin` and log in

Every push to `main` (whether from your own `git push` or from an edit made in
`/admin`) triggers a new Netlify deploy automatically.

---

## Admin Panel (Decap CMS)

`/admin` is a browser-based content editor (Decap CMS, formerly Netlify CMS) —
no coding needed for day-to-day content changes.

**What it can do:**
- Add, edit, reorder, and delete "Our Work" portfolio items (title, description,
  category, image) — edits `data/portfolio.json` under the hood
- Upload new images through the browser — stored in `images/uploads/` and
  committed to the repo automatically

**What it does *not* do:**
- Manage contact form submissions — those are handled entirely by Netlify Forms
  (see "Contact Form" section above); Decap CMS has no visibility into form data
- Edit arbitrary page copy (hero text, pricing, WhatsApp number, etc.) — those
  remain manual find-and-replace edits in `index.html` per the "Quick Edits"
  section above

**Requirements:** the site must be deployed from Git (not drag-and-drop) with
Identity + Git Gateway enabled — see the deploy steps above. Each editor needs
to be invited as an Identity user; there's no separate CMS password.

---

## Deploying to Custom Host (cPanel etc.)

1. Upload all files via FTP/File Manager
2. Place `index.html`, `data/`, and `images/` in `public_html/`
3. Contact form: use Formspree (see above)
4. Note: the `/admin` panel requires Netlify Identity + Git Gateway and will
   **not** work on a non-Netlify host

---

## Logo Mockup Tool

Built in HTML5 Canvas — no backend needed. User uploads a PNG logo,
it composites onto 8 product shapes. Drag to reposition, sliders for
size and opacity. WhatsApp button links to wa.me/923183241305.

---

*Built for Reverb Merch · reverbmerch.com · @reverbmerch*
