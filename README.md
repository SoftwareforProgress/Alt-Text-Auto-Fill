# Alt Text Auto-Fill Chrome Extension

[![Build and Package Extension](https://github.com/SoftwareforProgress/Alt-Text-Auto-Fill/actions/workflows/build-extension.yml/badge.svg)](https://github.com/SoftwareforProgress/Alt-Text-Auto-Fill/actions/workflows/build-extension.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Software for Progress Foundation](https://img.shields.io/badge/by-Software%20for%20Progress%20Foundation-purple)](https://softwareforprogress.org)

Automatically generates and fills missing alt text for images to improve web accessibility for screen reader users.

## Features

-   **Completely Offline** - No internet connection required
-   **100% Free** - No API keys or accounts needed
-   **Privacy-Focused** - Images never leave your device
-   **Lightweight** - Under 50KB total size
-   **Smart Detection** - Analyzes filenames, context, and page structure
-   **Visual Feedback** - Shows when alt text is added

## Installation

### Option 1: Download Latest Release

1. Go to [Releases](https://github.com/SoftwareforProgress/Alt-Text-Auto-Fill/releases)
2. Download `alt-text-auto-fill.zip`
3. Extract the ZIP file
4. Open Chrome and go to `chrome://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the extracted folder

### Option 2: Build from Source

Clone the repository:

```bash
git clone https://github.com/SoftwareforProgress/Alt-Text-Auto-Fill.git
cd alt-text-auto-fill
```

Install dependencies:

```bash
npm install
```

Build the extension:

```bash
npm run build
```

The built extension will be in `dist/unpacked/`

## Development

### Prerequisites

-   Node.js 18+
-   npm or yarn

### Setup

Install dependencies:

```bash
npm install
```

Build extension:

```bash
npm run build
```

Watch for changes:

```bash
npm run watch
```

### Available Scripts

-   `npm run build` - Build the extension
-   `npm run package` - Create ZIP files for distribution
-   `npm run validate-manifest` - Validate manifest.json
-   `npm run watch` - Watch for changes and rebuild

## Automated Releases

This project uses GitHub Actions to automatically:

1. Generate icon files
2. Package the extension
3. Create releases when tags are pushed

To create a new release:

```bash
git tag v1.0.1
git push origin v1.0.1
```

## How It Works

The extension uses pattern-based detection to generate alt text:

-   Analyzes image filenames
-   Checks surrounding HTML context (links, captions, headings)
-   Examines CSS classes for hints
-   Evaluates image dimensions and aspect ratios

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details

## About Software for Progress Foundation

Software for Progress Foundation is dedicated to making technology more accessible and beneficial for everyone. Learn more at [softwareforprogress.org](https://softwareforprogress.org)

## Issues and Support

Found a bug or have a suggestion? [Open an issue](https://github.com/SoftwareforProgress/Alt-Text-Auto-Fill/issues)

---

**Making the web more accessible, one image at a time.**
