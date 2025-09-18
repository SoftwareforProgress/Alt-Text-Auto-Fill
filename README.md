# Alt Text Auto-Fill Chrome Extension

[![Build and Package Extension](https://github.com/SoftwareforProgress/Alt-Text-Auto-Fill/actions/workflows/build-extension.yml/badge.svg)](https://github.com/SoftwareforProgress/Alt-Text-Auto-Fill/actions/workflows/build-extension.yml)  
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)  
[![Software for Progress Foundation](https://img.shields.io/badge/by-Software%20for%20Progress%20Foundation-purple)](https://softwareforprogress.org)

Automatically generates and fills missing alt text for images to improve web accessibility for screen reader users.

**Current Version:** `1.1.0`  
**Powered By:** TensorFlow.js + coco-ssd  
**Size:** ~2MB, fully offline

---

## Features

-   **AI-Powered** – Uses TensorFlow.js with coco-ssd to detect objects in images
-   **Completely Offline** – No internet connection required
-   **100% Free** – No API keys or accounts needed
-   **Privacy-Focused** – Images never leave your device
-   **Lightweight** – ~2MB total size

---

## Installation

### Option 1: Download Latest Release

1. Go to [Releases](https://github.com/SoftwareforProgress/Alt-Text-Auto-Fill/releases)
2. Download `alt-text-auto-fill.zip`
3. Extract the ZIP file
4. Open Chrome and go to `chrome://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the extracted folder

### Option 2: Build from Source

```bash
git clone https://github.com/SoftwareforProgress/Alt-Text-Auto-Fill.git
cd alt-text-auto-fill
npm install
npm run build
```

The built extension will be in `dist/unpacked/`.

---

## Development

### Prerequisites

-   Node.js 18+
-   npm or yarn

### Available Scripts

-   `npm run install-deps` – Install dependencies
-   `npm run build` – Build the extension with webpack (production)
-   `npm run dev` – Run webpack in watch mode (development)
-   `npm run clean` – Remove the `dist` folder
-   `npm run package` – Build and create a distributable ZIP (`alt-text-auto-fill.zip`)

---

## How It Works

The extension combines **AI-powered object detection** with **heuristic fallbacks** to generate meaningful alt text for images.

1. **TensorFlow.js Backend Setup**

    - Tries `webgl`, then `wasm`, then `cpu`
    - Verifies the backend is functional before loading the model

2. **Model Loading**

    - Loads the **COCO-SSD model** (`lite_mobilenet_v2`) for object detection
    - Runs fully offline (~2MB)

3. **Alt Text Generation**

    - Runs object detection with a minimum confidence of 30%
    - Prioritizes people and animals in descriptions
    - Converts counts into natural language (e.g., _“Two people and a dog”_)
    - Falls back to heuristics (e.g., _“Square image”_, _“Wide banner image”_) if no objects are found or model fails

4. **Efficiency & Reliability**

    - Processes images in small batches to reduce memory pressure
    - Uses caching and periodic cleanup for loaded images
    - Handles **CORS-restricted images** by fetching via the background script
    - Cleans up blob URLs and disposes of the model safely on unload

5. **Dynamic Processing**

    - Uses a `MutationObserver` to detect new images added to the page
    - Processes them immediately once loaded

6. **User Controls & Stats**
    - Can be toggled on/off via Chrome messaging API
    - Exposes a `getStats` action (total images, with alt text, auto-filled)
    - Adds a temporary CSS highlight (`alt-text-processed`) when alt text is injected

---

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## License

MIT License – see [LICENSE](LICENSE) file for details

---

## About Software for Progress Foundation

### Empowering Open Source for a Better Future

We help developers build impactful Open Source software focused on **education, accessibility, and security**.

**Learn, build, and support software that makes a difference.**  
With one sign-up, you’ll unlock learning documents, funding opportunities, and everything you need to build Open Source software that makes a difference.

---

### About Us

At **Software for Progress Foundation**, we help Open Source developers create software that benefits all people.

Great software can change lives. Unfortunately, many people don't have access because it costs too much or isn't built with their needs in mind. Meanwhile, talented developers who want to build free, open software often struggle due to a lack of support and funding.

Every day, countless Open Source projects with massive potential are published, but many go unnoticed or unused. Without proper funding, guidance, or visibility, these tools never reach the people who could benefit from them the most.

Software for Progress Foundation is a nonprofit organization (**501(c)(3) status pending**) dedicated to solving this problem. By providing mentorship, resources, and funding to Open Source developers, we're not just supporting creators — we're directly helping people everywhere access the tools they desperately need.

Software for Progress Foundation empowers developers to create and sustain Open Source projects that improve **education, accessibility, and security**. By making software accessible to everyone, we help shape a more progressive future where technology serves the needs of all communities.

---

## Issues and Support

Found a bug or have a suggestion? [Open an issue](https://github.com/SoftwareforProgress/Alt-Text-Auto-Fill/issues)

---

**Making the web more accessible, one image at a time — with Software for Progress.**
