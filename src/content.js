/**
 * Alt Text Auto-Fill - Content Script
 * By Software for Progress Foundation
 *
 * Automatically generates and fills missing alt text for images
 * to improve web accessibility for screen reader users.
 *
 * Learn more at: https://softwareforprogress.org
 */

// [Rest of the content.js code remains exactly the same as before]
class AltTextGenerator {
    constructor() {
        this.enabled = true;
        this.processed = new WeakSet();
        this.loadSettings();
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(["enabled"]);
            this.enabled = result.enabled !== false;
        } catch (e) {
            this.enabled = true;
        }
    }

    generateAltText(img) {
        const altParts = [];

        // Analyze filename
        const filename = this.extractFilename(img.src);
        if (filename) {
            const cleanName = filename
                .replace(/[-_]/g, " ")
                .replace(/\.(jpg|jpeg|png|gif|webp|svg)/gi, "")
                .replace(/\d{4,}/g, "")
                .trim();

            if (cleanName && cleanName.length > 2) {
                altParts.push(cleanName);
            }
        }

        // Check for common patterns in URL
        const patterns = {
            logo: /logo|brand|emblem/i,
            "profile photo": /avatar|profile|user|member/i,
            icon: /icon|ico|symbol/i,
            banner: /banner|hero|header|cover/i,
            "product image": /product|item|merchandise|shop/i,
            thumbnail: /thumb|preview|small/i,
            screenshot: /screenshot|screen|capture/i,
            diagram: /diagram|chart|graph|figure/i,
            map: /map|location|geography/i,
            infographic: /infographic|info|data/i,
        };

        const src = img.src.toLowerCase();
        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(src)) {
                altParts.push(type);
                break;
            }
        }

        // Analyze image dimensions
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        if (aspectRatio > 3) {
            altParts.push("panoramic image");
        } else if (aspectRatio < 0.5) {
            altParts.push("portrait image");
        } else if (img.naturalWidth === img.naturalHeight) {
            altParts.push("square image");
        }

        // Check surrounding context
        const context = this.getImageContext(img);
        if (context) {
            altParts.push(context);
        }

        // Analyze CSS classes
        const cssHints = this.analyzeCSSClasses(img);
        if (cssHints) {
            altParts.push(cssHints);
        }

        if (altParts.length > 0) {
            return this.formatAltText(altParts);
        }

        if (img.naturalWidth < 50 || img.naturalHeight < 50) {
            return "Decorative icon";
        }

        return "Image";
    }

    extractFilename(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split("/").pop();
            return filename || null;
        } catch {
            const parts = url.split("/");
            return parts[parts.length - 1] || null;
        }
    }

    getImageContext(img) {
        const link = img.closest("a");
        if (link) {
            const linkText = link.textContent.trim();
            if (linkText && linkText.length < 50) {
                return `Link: ${linkText}`;
            }
            if (link.title) {
                return link.title;
            }
        }

        const figure = img.closest("figure");
        if (figure) {
            const caption = figure.querySelector("figcaption");
            if (caption) {
                const captionText = caption.textContent.trim();
                if (captionText && captionText.length < 100) {
                    return captionText;
                }
            }
        }

        const parent = img.parentElement;
        if (parent) {
            const heading = parent.querySelector("h1, h2, h3, h4, h5, h6");
            if (heading) {
                return heading.textContent.trim();
            }
        }

        return null;
    }

    analyzeCSSClasses(img) {
        const classes = img.className.toLowerCase();
        const hints = [];

        if (classes.includes("avatar") || classes.includes("profile")) {
            hints.push("profile picture");
        }
        if (classes.includes("logo")) {
            hints.push("logo");
        }
        if (classes.includes("icon")) {
            hints.push("icon");
        }
        if (classes.includes("thumbnail")) {
            hints.push("thumbnail");
        }
        if (classes.includes("hero") || classes.includes("banner")) {
            hints.push("banner");
        }

        return hints.length > 0 ? hints.join(", ") : null;
    }

    formatAltText(parts) {
        const unique = [...new Set(parts)];
        const filtered = unique.filter((part) => part && part.length > 1);

        if (filtered.length === 0) return "Image";

        const formatted =
            filtered[0].charAt(0).toUpperCase() + filtered[0].slice(1);

        if (filtered.length === 1) {
            return formatted;
        }

        return formatted + " - " + filtered.slice(1).join(", ");
    }

    processImage(img) {
        if (this.processed.has(img)) return;
        if (img.alt && img.alt.trim().length > 0) return;

        if (img.naturalWidth < 10 || img.naturalHeight < 10) {
            img.alt = "";
            this.processed.add(img);
            return;
        }

        const altText = this.generateAltText(img);
        img.alt = altText;
        img.setAttribute("data-auto-alt", "true");
        this.processed.add(img);
        this.showFeedback(img);
    }

    showFeedback(img) {
        img.classList.add("alt-text-processed");
        setTimeout(() => {
            img.classList.remove("alt-text-processed");
        }, 2000);
    }

    processAllImages() {
        if (!this.enabled) return;

        const images = document.querySelectorAll('img:not([alt]), img[alt=""]');
        images.forEach((img) => {
            if (img.complete && img.naturalWidth > 0) {
                this.processImage(img);
            } else {
                img.addEventListener("load", () => this.processImage(img), {
                    once: true,
                });
            }
        });
    }

    observe() {
        this.processAllImages();

        const observer = new MutationObserver((mutations) => {
            if (!this.enabled) return;

            for (const mutation of mutations) {
                if (mutation.type === "childList") {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeName === "IMG") {
                            if (node.complete) {
                                this.processImage(node);
                            } else {
                                node.addEventListener(
                                    "load",
                                    () => this.processImage(node),
                                    { once: true }
                                );
                            }
                        } else if (node.querySelectorAll) {
                            const images = node.querySelectorAll(
                                'img:not([alt]), img[alt=""]'
                            );
                            images.forEach((img) => {
                                if (img.complete) {
                                    this.processImage(img);
                                } else {
                                    img.addEventListener(
                                        "load",
                                        () => this.processImage(img),
                                        { once: true }
                                    );
                                }
                            });
                        }
                    });
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
}

const altGenerator = new AltTextGenerator();

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => altGenerator.observe());
} else {
    altGenerator.observe();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle") {
        altGenerator.enabled = request.enabled;
        if (request.enabled) {
            altGenerator.processAllImages();
        }
    } else if (request.action === "process") {
        altGenerator.processAllImages();
    } else if (request.action === "getStats") {
        const total = document.querySelectorAll("img").length;
        const withAlt = document.querySelectorAll(
            'img[alt]:not([alt=""])'
        ).length;
        const processed = document.querySelectorAll(
            'img[data-auto-alt="true"]'
        ).length;
        sendResponse({ total, withAlt, processed });
    }
    return true;
});
