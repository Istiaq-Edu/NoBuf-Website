# nobuff — Website

Landing page for [nobuff](https://github.com/Istiaq-Edu/nobuff), a zero-buffer video streaming desktop app powered by Telegram.

## Live

Once deployed, this site showcases nobuff's MSE prebuffering pipeline, features, and download links.

## Structure

```
index.html          — Single-page landing (self-contained CSS/JS)
assets/
  logo.svg          — App icon (shield + gradient)
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

## Replacing Screenshots

The screenshot section in `index.html` has placeholder cards. To add real screenshots:

1. Add your PNG/JPG files to `assets/`
2. In `index.html`, find each `.screenshot-placeholder` div
3. Add an `<img src="assets/your-screenshot.png" alt="...">` inside it
4. Add `style="display:block"` to the `<img>` and hide the placeholder icon/label

## License

MIT
