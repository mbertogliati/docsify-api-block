# Docsify API Block

A lightweight Docsify plugin that converts special HTML comments in your Markdown into beautiful, collapsible API blocks showing request and response sections.

- Renders method badge and path automatically.
- Smooth open/close animations using `<details>`.
- Works with any Markdown content inside the request/response sections.

## Installation

### CDN (recommended)
Add the CSS and JS to your Docsify site (in `index.html`):

```html
<!-- Load Docsify core first -->
<script src="https://cdn.jsdelivr.net/npm/docsify@4"></script>

<!-- Load the plugin CSS and JS (replace scope/name with your package) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mbertogliati/docsify-api-block@0.1.2/dist/api-block.css" />
<script src="https://cdn.jsdelivr.net/npm/@mbertogliati/docsify-api-block@0.1.2/dist/api-block.js"></script>
```

Alternatively, serve directly from this GitHub repo via jsDelivr (pin a tag):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mbertogliati/docsify-api-block@v0.1.2/dist/api-block.css" />
<script src="https://cdn.jsdelivr.net/gh/mbertogliati/docsify-api-block@v0.1.2/dist/api-block.js"></script>
```

### npm
Install and serve the assets from your build system or static host:

```bash
npm install @mbertogliati/docsify-api-block
```

Then include from `node_modules` or copy to your public assets:

```html
<link rel="stylesheet" href="/path-to-assets/api-block.css" />
<script src="/path-to-assets/api-block.js"></script>
```

## Example
See a minimal live example in `examples/index.html` (you can host it via GitHub Pages or open locally). It uses the GitHub CDN links above.

## Usage
Write specially formatted HTML comments in your Markdown. The plugin will replace them with a rendered API block during Docsify runtime.

Supported attributes on `api:start`:

- `method`: HTTP method (e.g., GET, POST, PUT, DELETE, PATCH)
- `path`: The endpoint path.
- `expanded` or `open`: Set to `"true"` to have the block open by default.

Example:

````markdown
<!-- api:start method="POST" path="/api/v1/orders/bulk/read" -->

> Important: Only up to 100 orders can be read at once.

```json
[
  1000000000000001,
  1000000000000002,
  1000000000000003,
  1000000000000004,
  1000000000000005
]
```

<!-- api:response -->

```json
[
  {
    "code": 200,
    "id": 1000000000000001,
    "date_created": "2022-01-01T12:00:00.000Z",
    "date_closed": "2022-01-01T12:05:00.000Z",
    "status": "paid",
    "context": { "channel": "marketplace", "site": "MLX" }
  },
  { "code": 404, "message": "order_not_found" }
]
```

<!-- api:end -->
````

The block above will render like a collapsible card with the method badge and path in the header, and the request and response sections inside.

## Styling
This plugin ships with default styles in `api-block.css`. You can override CSS variables to theme it:

- `--theme-border`
- `--theme-background`
- `--code-font-family`

Or customize classes directly such as `.apiblock`, `.apiblock-header`, `.apiblock-method`, `.apiblock-path`, etc.

## How it works
The plugin looks for comment sequences in the rendered HTML:

```
<!-- api:start ... --> ... <!-- api:response --> ... <!-- api:end -->
```

It parses attributes from `api:start`, constructs the HTML for the block, and wires up a small animation for opening and closing.

## Development
Source files live in `src/` and built assets in `dist/`.

- `npm run build` copies `src` files into `dist`.
- Publish to npm: bump the version in `package.json` and run `npm publish`.

## License
MIT. See `LICENSE`.
