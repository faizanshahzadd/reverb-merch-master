# Reverb Merch — Developer Handoff
## reverb-merch-master/

---

## Files

```
reverb-merch-master/
├── index.html          ← The full website (self-contained, all images embedded as base64)
├── images/             ← Full-resolution original images for reference / replacement
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

## Replacing Portfolio Images

The site embeds images as base64 inside index.html. To swap images:

**Option A — Quick (recommended for 1–2 swaps):**
1. Convert new image to base64: https://www.base64-image.de/
2. In index.html, find the old base64 block (search by alt text e.g. `alt="ibex-onboarding-kit"`)
3. Replace the `data:image/...base64,...` value with the new one

**Option B — Cleaner (for full rebuild):**
1. Replace files in `images/` folder with same filename
2. Run the Python build script (request from developer — regenerates index.html with new images embedded)

---

## Adding New Portfolio Items

Find this line in index.html:
```html
<!-- PORTFOLIO ITEMS -->
```
Add a new item following this pattern:
```html
<div class="pf-item" data-cat="gifts" onclick="openLB(this)"
  data-title="Client Name Gift Set" data-desc="Description here">
  <img src="images/your-new-image.png" alt="Client Name Gift Set">
  <div class="pf-ov"><div><h4>Client Name Gift Set</h4><p>Description here</p></div></div>
</div>
```
Categories: `gifts` `employee` `apparel` `events` `packaging` `stationery`

---

## Client Logos Section

Currently shows text fallback. To show actual logos:
1. Place PNG files in `images/logos/` folder
2. In index.html find the `.cl-box` elements
3. Replace text content with: `<img src="images/logos/clientname.png" alt="Client">`

---

## Contact Form

**On Netlify (drag & drop deploy):** Works automatically. No config needed.

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

## Deploying to Netlify (Free)

1. Go to netlify.com → Sign up free
2. Drag the entire `reverb-merch-master/` folder onto the deploy area
3. Done — live URL in ~30 seconds
4. Add custom domain in Site Settings → Domain Management

---

## Deploying to Custom Host (cPanel etc.)

1. Upload all files via FTP/File Manager
2. Place `index.html` and `images/` in `public_html/`
3. Contact form: use Formspree (see above)

---

## Logo Mockup Tool

Built in HTML5 Canvas — no backend needed. User uploads a PNG logo,
it composites onto 8 product shapes. Drag to reposition, sliders for
size and opacity. WhatsApp button links to wa.me/923183241305.

---

*Built for Reverb Merch · reverbmerch.com · @reverbmerch*
