# LeadSnap - Simple Lead Capture & CRM

A Chrome extension that lets freelancers capture leads from any website with one click and track them through a simple pipeline.

## Features

- **One-Click Capture**: Right-click on any text to capture lead info
- **Smart Parsing**: Auto-extracts name, email, phone, LinkedIn, and website
- **Pipeline View**: Track leads through New -> Contacted -> Proposal -> Won/Lost
- **List View**: Traditional list with search and filters
- **Export**: CSV and JSON export options
- **Freemium**: 25 leads free, unlimited with Pro ($9/mo)

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Run in development mode (opens Chrome with extension loaded)
pnpm dev

# Build for production
pnpm build

# Run unit tests
pnpm test

# Run E2E tests (requires built extension)
pnpm test:e2e
```

### Project Structure

```
leadsnap-extension/
├── entrypoints/
│   ├── popup/          # Extension popup UI (React)
│   ├── background.ts   # Service worker (context menu, messaging)
│   └── content.ts      # Content script (toast notifications)
├── src/
│   ├── components/     # React components
│   ├── lib/           # Utilities (parser, storage)
│   └── types/         # TypeScript types
├── public/
│   └── icon/          # Extension icons
└── e2e/               # Playwright E2E tests
```

### Tech Stack

- **Framework**: [WXT](https://wxt.dev/) (Web Extension Framework)
- **UI**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Storage**: WXT Storage API (chrome.storage.local)

## Creating Icons

The SVG icon is at `public/icon/leadsnap.svg`. To generate PNG icons:

1. Use a tool like [Figma](https://figma.com), [Inkscape](https://inkscape.org), or an online SVG-to-PNG converter
2. Export at sizes: 16x16, 32x32, 48x48, 96x96, 128x128
3. Save to `public/icon/` as `16.png`, `32.png`, etc.

## Publishing to Chrome Web Store

1. Build the extension: `pnpm build`
2. Zip the output: `pnpm zip`
3. Upload `.output/chrome-mv3.zip` to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

### Required Assets for Chrome Web Store

- Icon: 128x128 PNG
- Screenshots: 1280x800 or 640x400 (at least 1, up to 5)
- Promotional tile: 440x280
- Description: Up to 132 characters (short), up to 16,000 (detailed)

## License

MIT
