# NoBuf — Website

Landing page for [NoBuf](https://github.com/Istiaq-Edu/NoBuf), a zero-buffer video streaming desktop app powered by Telegram.

## Live

https://istiaq-edu.github.io/NoBuf-Website/

## Structure

```
index.html          — Single-page landing (self-contained CSS/JS)
assets/
  logo.png          — App logo
  banner.png        — Hero banner image
  favicon.png       — Browser favicon
```

## Development

Just open `index.html` in a browser. No build step, no dependencies.

```bash
# Or serve locally
python3 -m http.server 8080
```

## Deployment

Push to GitHub and enable GitHub Pages (Settings → Pages → Source: `main` branch, root `/`).

## Features

- Green theme matching the NoBuf app (`#1dfc9f` accent on `#013718` deep green)
- Dynamic version display — fetches latest release tag from GitHub API
- Download links point to latest GitHub Releases
- Fully responsive, zero dependencies

## Replacing Screenshots

The screenshot section has placeholder cards. To add real screenshots:

1. Add your PNG/JPG files to `assets/`
2. In `index.html`, find each `.screenshot-placeholder` div
3. Add an `<img src="assets/your-screenshot.png" alt="...">` inside it
4. Add `style="display:block"` to the `<img>` and hide the placeholder icon/label

## License

MIT
