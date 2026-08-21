# NoBuf · Website

Product site for [NoBuf](https://github.com/Istiaq-Edu/NoBuf) — a free desktop app that turns your Telegram channels into an instant-streaming video library.

**Live:** https://istiaq-edu.github.io/NoBuf-Website/

## Structure

```
index.html          Landing: hero, why-not-just-Telegram, highlights, gallery, setup, CTA
features.html       WATCH / ORGANIZE / POWER / TRUST bands, shortcuts, REST API example
download.html       Platform cards (live release links), first-run guide, update trust
faq.html            Accounts & privacy, using NoBuf, updates & install
404.html            Buffer-underrun joke page
styles.css          Shared design system (charcoal + green tokens, motion, components)
shared.js           Progressive enhancement: version fetch, reveals, scrollspy,
                    parallax, card spotlight, banner, code copy — optional by design
assets/             WebP screenshots, logo, favicons, social card
robots.txt          Crawler rules
sitemap.xml         Page index
```

No build step, no frameworks, no dependencies. Google Fonts (Inter, JetBrains Mono) is the only external request besides GitHub's API.

## Development

Open `index.html` in a browser, or serve locally:

```bash
python -m http.server 8080
```

## Editing guide

- **Design tokens** live at the top of `styles.css` (`--bg-*`, `--accent`, type scale, motion timing). Change there, not inline.
- **Copy discipline:** every factual/numeric claim traces to an evidence ledger (`reports/CLAIMS_LEDGER.md` while in-repo). If you add a claim, add its evidence first. Banned phrasings are listed in the same file.
- **Screenshots:** drop new captures into `assets/`, convert to WebP (~1600px wide, q82), keep `width`/`height` attributes on `<img>` tags to avoid layout shift. Regenerate `social-card.jpg` at 1200×630 when the hero shot changes.
- **Version numbers:** never hardcode a version except the static fallback text inside `data-version-slot` elements — `shared.js` overwrites those from the GitHub Releases API on load.
- **Animations** respect `prefers-reduced-motion` and degrade on touch/narrow viewports automatically. New effects must gate the same way (see `shared.js` matchMedia checks).

## Deployment

Push to `main`; GitHub Pages serves from root. Pages source: Settings → Pages → `main` / root.

## License

MIT. Not affiliated with Telegram FZ-LLC.
