# Reverb Merch

Marketing site for **Reverb Merch** — corporate gifting and branded merchandise
across Pakistan, GCC, and Australia.

Live site: [reverbmerch.netlify.app](https://reverbmerch.netlify.app/) · Instagram: [@reverbmerch](https://instagram.com/reverbmerch)

## Stack

Static HTML/CSS/JS — no build step, no framework.

- `index.html` — the whole site
- `css/style.css` — all styling
- `data/portfolio.json` — "Our Work" portfolio items, fetched client-side and
  rendered into the portfolio grid
- `images/` — portfolio and page images
- `admin/` — [Decap CMS](https://decapcms.org) admin panel for editing the
  portfolio and uploading images without touching code
- Contact form submissions are handled by [Netlify Forms](https://docs.netlify.com/forms/setup/)

## Local development

No build step — just serve the folder over HTTP (a plain `file://` open won't
work since the portfolio grid fetches `data/portfolio.json`):

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Deploying

Deployed on Netlify from this Git repo (not drag-and-drop), so that pushes —
including edits made through `/admin` — trigger automatic redeploys.

Full deployment steps, Netlify Identity/Git Gateway setup, and day-to-day
content-editing instructions are in **[DEVELOPER.md](DEVELOPER.md)**.

## Admin panel

Visit `/admin` on the deployed site to manage portfolio items and upload
images through a browser UI, without editing HTML/JSON by hand. Requires a
Netlify Identity login — see [DEVELOPER.md](DEVELOPER.md#admin-panel-decap-cms)
for setup and access.
