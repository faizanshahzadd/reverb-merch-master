# Reverb Merch — Developer Handoff
## reverb-merch-master/

---

## Files

```
reverb-merch-master/
├── index.html          ← The full website (hero/case-study images embedded as base64;
│                          portfolio grid is rendered from data/portfolio.json)
├── css/
│   └── style.css       ← All page styling (extracted from index.html's <style> block)
├── js/
│   ├── mockup.js       ← Logo mockup tool (products, print areas, rendering)
│   └── videos.js       ← Lazy play/pause for homepage videos
├── videos/             ← Homepage MP4s + posters (see Homepage Videos)
├── tools/              ← Scripts that render the videos
├── data/
│   └── portfolio.json  ← "Our Work" portfolio items (title, description, category, image path)
├── admin/               ← Decap CMS admin panel (edit portfolio + upload images from the browser)
│   ├── index.html
│   └── config.yml
├── images/             ← Full-resolution images referenced by the portfolio grid
│   ├── logo.jpg
│   ├── vodworks-gift-set.jpg
│   ├── ibex-onboarding-kit.jpg
│   ├── vodworks-swag-box.jpg
│   ├── escorts-gift-set.jpg
│   ├── fiber-mountain-kit.jpg
│   ├── mozack-welcome-box.jpg
│   ├── unlayer-corporate-set.jpg
│   ├── noon-brand-merch.jpg
│   ├── ibex-awards-kits.jpg
│   ├── technomites-full-kit.jpg
│   ├── branded-notebooks.jpg
│   ├── unifonic-exhibition-kit.jpg
│   ├── retrocausal-keychain.jpg
│   ├── noon-academy-apparel.jpg
│   ├── contour-software-set.jpg
│   ├── lincoln-corners-mugs.jpg
│   ├── investkar-flasks.jpg
│   ├── macpac-keychain-pen.jpg
│   ├── macpac-pen-box.jpg
│   ├── exd-gift-box.jpg
│   ├── uploads/         ← New images uploaded via the admin panel land here
│   └── logos/          ← Drop client logo PNGs here (see Clients section below)
├── README.md           ← Project overview / quick start (points here for detail)
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

## Brand Colors (CSS variables at top of css/style.css)

```css
--p: #6B2D8B;   /* Purple  */
--m: #D4006A;   /* Magenta */
```
Change these 2 values to completely rebrand the site.

All CSS lives in `css/style.css` (moved out of index.html's inline `<style>`
block for easier editing). It's linked via a single `<link rel="stylesheet"
href="css/style.css">` in the `<head>` — no build step, just edit and refresh.

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

## Live Reviews & Instagram Feed

The homepage pulls **real** Google reviews, Facebook recommendations and
Instagram posts through three Netlify Functions (API keys stay server-side,
responses are cached on Netlify's CDN for 1–6 hours). Front-end code is
`js/social.js`. Until a function is configured — or if an API is down — each
widget falls back automatically (review screenshots in `images/reviews/`,
portfolio photos for Instagram), so nothing ever renders empty.

Set these in **Netlify → Site configuration → Environment variables**, then
redeploy:

| Variable | Used by | Notes |
|----------|---------|-------|
| `GOOGLE_PLACES_API_KEY` | `google-reviews` | Google Cloud key with **Places API (New)** enabled. Restrict it to that API. |
| `GOOGLE_PLACE_ID` | `google-reviews` | Optional — defaults to the Reverb Merch Karachi listing. |
| `META_PAGE_ACCESS_TOKEN` | `facebook-reviews`, `instagram-feed` | Non-expiring **Page** token (steps below). |
| `FACEBOOK_PAGE_ID` | `facebook-reviews`, `instagram-feed` | Numeric Page ID (Page → About → Page transparency, or Graph Explorer `me?fields=id`). |
| `INSTAGRAM_USER_ID` | `instagram-feed` | Optional — looked up from the Page if omitted. |
| `META_GRAPH_VERSION` | Meta functions | Optional, default `v23.0`. Bump when Meta retires it (~2 years per version). |

**Google (≈10 min):** Google Cloud Console → create project → enable
*Places API (New)* → Credentials → *Create API key* → restrict to Places API
(New) → paste into `GOOGLE_PLACES_API_KEY`. Billing must be enabled on the
project; this usage sits well inside Google's free monthly tier. Google only
ever returns the 5 "most relevant" reviews; the card links to the full list
and to "Write a review".

**Facebook + Instagram — one token for both (≈20 min):**
1. Make sure @reverbmerch is an Instagram **Business/Creator** account linked
   to the Reverb Merch Facebook Page (Instagram app → Settings → Account type;
   then Page settings → Linked accounts).
2. At [developers.facebook.com](https://developers.facebook.com) create an app
   (type *Business*), add the **Instagram Graph API** product.
3. Open **Graph API Explorer**, pick the app, *Get User Access Token* with
   `pages_show_list`, `pages_read_engagement`, `pages_read_user_content`,
   `instagram_basic` → Generate.
4. Exchange it for a long-lived user token (Access Token Debugger → *Extend
   Access Token*), then in Explorer call `me/accounts` with that long-lived
   token and copy the `access_token` of the Reverb Merch Page. A Page token
   obtained this way **does not expire**.
5. Put it in `META_PAGE_ACCESS_TOKEN`, the Page's `id` in `FACEBOOK_PAGE_ID`.
6. For anyone other than app admins/testers to be served, switch the app to
   **Live** mode (needs a privacy policy URL — the site's `/about.html` page
   can host one).

Facebook no longer shows star averages for most Pages, so the card shows
"% recommend" from the fetched recommendations, plus the reviews that have
text.

*Legacy option:* `INSTAGRAM_ACCESS_TOKEN` (+ `INSTAGRAM_USER_ID`) from the
previous setup still works, but those tokens expire every 60 days.

**Check a function directly:** visit `/.netlify/functions/google-reviews`
(or `facebook-reviews`, `instagram-feed`) on the deployed site.
`{"configured":false}` means the env vars aren't set; an `error` field shows
the API's message.

---

## Mobile Layout Notes

**Hero section — grid track blowout gotcha:** `.hero` uses CSS Grid
(`minmax(0,1fr) minmax(0,1fr)` on desktop, `minmax(0,1fr)` on mobile). The
`minmax(0,...)` is load-bearing, not decorative — a bare `1fr` lets a grid
track grow to fit the **min-content size of its widest descendant**, and the
hero's marquee strip (`.mstrip-inner`, ~10 unwrapped 115px images) has an
unwrapped intrinsic width of ~1240px. With a bare `1fr`, that stretched the
whole `.hero` grid track to 1240px on mobile, centering the heading in a box
wider than the screen and shoving it off-canvas to the right (clipped by
`.hero`'s own `overflow:hidden`, so it just looked blank instead of
scrollable). If you add another grid with a wide/unwrapped child (another
marquee, a wide table, etc.), give it `minmax(0,1fr)` columns too, or it'll
silently reproduce this bug on narrow viewports.

**Mobile nav menu:** the hamburger (`#hbg`) toggles `.open` on `#navLinks`,
`#navbar`, `#hbg` itself, and `body` (`body.menu-open{overflow:hidden}` locks
background scroll while the menu is open). The hamburger icon animates into
an X via CSS transforms on its three `<span>`s (no separate close button
needed). The menu also closes on Escape and on tapping any nav link — see
`toggleMenu()`/`closeMenu()` near the bottom of `index.html`'s `<script>`.

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

## Homepage Videos

Four short, silent, looping MP4s live in `videos/` (each with a `-poster.jpg`):

| File | Where | What |
|------|-------|------|
| `hero-loop.mp4` | Hero, main tile | Slow pan/zoom through client kits |
| `showreel.mp4` | "See It In Motion" | Captioned showreel of real projects + stats/CTA |
| `process.mp4` | "See It In Motion" | Animated 4-step process |
| `logo-on-everything.mp4` | "See It In Motion" | One logo across 12 mockup products |

`js/videos.js` plays each video only while it's on screen (`preload="none"`
so nothing downloads until needed) and pauses it when scrolled away. Visitors
with *reduce motion* enabled get the poster and a play button instead.

**To swap in your own footage:** replace the MP4 (H.264, no audio, ideally
< 3 MB) and its poster JPG with the same filenames — no code changes needed.

**To regenerate them** (e.g. after adding portfolio photos):
```
pip install pillow imageio-ffmpeg playwright && playwright install chromium
python -m http.server 8765            # in the repo root, separate terminal
python tools/capture_mockups.py <tmp_dir>          # needs <tmp_dir>/vid/mk to exist
python tools/make_videos.py . <tmp_dir>/vid/mk     # writes videos/*.mp4
```
Showreel captions are set in `showreel()` in `tools/make_videos.py`.

---

## Logo Mockup Tool

Lives in `js/mockup.js` (HTML5 Canvas, no backend). 19 products across
drinkware, apparel, bags, stationery, tech, packaging and accessories — 7 are
real product photos in `images/mockups/`, the rest are drawn on the canvas with
selectable colours.

**How placement works:** every product has a *print area*. The uploaded logo is
auto-trimmed (transparent/white padding removed), fitted inside that area with
its aspect ratio preserved, clipped to it, wrapped around the cylinder on mugs,
flasks and bottles, and multiplied with the product's own lighting so it looks
printed rather than pasted on. Visitors can drag (snaps to the centre), resize
with the slider or mouse wheel, rotate, nudge with arrow keys, pick placement
presets (centre chest / left chest / full front …) and print styles (full
colour, white ink, black ink, gold foil, engraved), then download a PNG.
The WhatsApp button pre-fills the chosen product, colour, style and placement.

**Adding a product:** add an entry to `PRODUCTS` at the top of
`js/mockup.js`:
- *Photo product:* `photo: 'images/mockups/x.jpg'` and `area: [x, y, w, h]` as
  fractions of the photo (e.g. `.4` = 40% across).
- *Drawn product:* `colors: [...]`, `area` in canvas px (canvas is 600×480),
  plus a matching `PRODUCT_DRAWERS['Name']` function `(colour, ctx) => {...}`
  (and a `GROUND_SHADOWS` entry if it sits on a surface).
- Optional: `cyl: [x0, x1]` cylinder edges for wrap, `shape: 'circle'`,
  `rot` (base logo rotation, degrees), `style` (default print style), and
  `presets: [[label, fx, fy, scale%, rotation?]]`.

---

*Built for Reverb Merch · reverbmerch.com · @reverbmerch*
