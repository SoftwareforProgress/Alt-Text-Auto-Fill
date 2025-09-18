/**
 * Alt Text Auto-Fill - Fixed Version with Proper TensorFlow.js Management
 * By Software for Progress Foundation
 */

import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

class AltTextGenerator {
    constructor() {
        this.enableDebuging = false;
        this.enabled = true;
        this.processed = new WeakSet();
        this.model = null;
        this.modelReady = false;
        this.modelLoading = false;
        this.imageCache = new Map();
        this.backendReady = false;
        this.processingQueue = new Set(); // Track active processing
        if (this.enableDebuging) {
            console.log("Alt Text Auto-Fill: Initializing...");
        }
        this.init();
    }

    async init() {
        await this.setupTensorFlow();
        await this.loadSettings();
        await this.loadModel();
        this.observe();
        this.setupCacheCleanup();
    }

    async setupTensorFlow() {
        try {
            if (this.enableDebuging) {
                console.log("Alt Text Auto-Fill: Setting up TensorFlow...");
            }
            // Try backends in order, but don't loop - settle on first working one
            const backends = ["webgl", "wasm", "cpu"];
            let backendSet = false;

            for (const backend of backends) {
                try {
                    await tf.setBackend(backend);
                    await tf.ready();

                    // Verify backend is actually working
                    const testTensor = tf.tensor([1, 2, 3]);
                    await testTensor.data(); // Force computation
                    testTensor.dispose();

                    if (this.enableDebuging) {
                        console.log(
                            `Alt Text Auto-Fill: Successfully using ${backend} backend`
                        );
                    }

                    this.backendReady = true;
                    backendSet = true;
                    break;
                } catch (e) {
                    if (this.enableDebuging) {
                        console.log(
                            `Alt Text Auto-Fill: ${backend} backend failed:`,
                            e.message
                        );
                    }
                    this.backendReady = false;
                }
            }

            if (!backendSet) {
                throw new Error(
                    "No TensorFlow.js backend could be initialized"
                );
            }
        } catch (error) {
            console.error(
                "Alt Text Auto-Fill: Failed to setup TensorFlow:",
                error
            );
            this.backendReady = false;
        }
    }

    // Verify backend is still available before operations
    async verifyBackend() {
        try {
            if (!this.backendReady) return false;

            // Quick backend health check
            const testTensor = tf.scalar(1);
            const result = await testTensor.data();
            testTensor.dispose();

            return result.length === 1;
        } catch (error) {
            console.error(
                "Alt Text Auto-Fill: Backend verification failed:",
                error
            );
            this.backendReady = false;
            return false;
        }
    }

    setupCacheCleanup() {
        setInterval(() => {
            if (this.imageCache.size > 50) {
                if (this.enableDebuging) {
                    console.log("Alt Text Auto-Fill: Clearing image cache...");
                }
                const entries = Array.from(this.imageCache.entries());
                const toKeep = entries.slice(-20);

                // Clean up old entries properly
                entries.slice(0, -20).forEach(([key, img]) => {
                    this.cleanupImageData(img);
                });

                this.imageCache.clear();
                toKeep.forEach(([key, value]) =>
                    this.imageCache.set(key, value)
                );
            }
        }, 60000);
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(["enabled"]);
            this.enabled = result.enabled !== false;
        } catch (e) {
            this.enabled = true;
        }
    }

    async loadModel() {
        if (this.modelLoading || this.modelReady || !this.backendReady) return;

        this.modelLoading = true;

        try {
            // Verify backend before loading model
            if (!(await this.verifyBackend())) {
                throw new Error("TensorFlow backend not ready");
            }

            if (this.enableDebuging) {
                console.log("Alt Text Auto-Fill: Loading COCO-SSD model...");
            }

            this.model = await cocoSsd.load({
                base: "lite_mobilenet_v2",
            });

            this.modelReady = true;
            this.modelLoading = false;

            if (this.enableDebuging) {
                console.log("Alt Text Auto-Fill: ✅ Model ready!");
            }

            this.processAllImages();
        } catch (error) {
            console.error("Alt Text Auto-Fill: Failed to load model:", error);
            this.modelLoading = false;
            this.modelReady = false;
        }
    }

    async fetchImageViaBackground(imgUrl) {
        if (this.imageCache.has(imgUrl)) {
            return this.imageCache.get(imgUrl);
        }

        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { action: "fetchImageAsBlob", url: imgUrl },
                (response) => {
                    if (response && response.success) {
                        const blob = this.base64ToBlob(
                            response.base64,
                            response.mimeType
                        );
                        const blobUrl = URL.createObjectURL(blob);

                        const img = new Image();
                        img.onload = () => {
                            this.imageCache.set(imgUrl, img);
                            resolve(img);
                        };
                        img.onerror = () => {
                            URL.revokeObjectURL(blobUrl);
                            reject(new Error("Failed to load fetched image"));
                        };
                        img.src = blobUrl;
                        img._blobUrl = blobUrl;
                    } else {
                        reject(
                            new Error(
                                response?.error || "Failed to fetch image"
                            )
                        );
                    }
                }
            );
        });
    }

    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    cleanupImageData(img) {
        // Only clean up blob URLs, don't mess with TensorFlow scopes
        if (img && img._blobUrl) {
            URL.revokeObjectURL(img._blobUrl);
            delete img._blobUrl;
        }
    }

    async generateAltText(img) {
        // Comprehensive readiness check
        if (!this.modelReady || !this.model || !this.backendReady) {
            return this.getBasicDescription(img);
        }

        // Verify backend is still working
        if (!(await this.verifyBackend())) {
            return this.getBasicDescription(img);
        }

        let processedImg = null;
        const processingId = Math.random().toString(36);
        this.processingQueue.add(processingId);

        try {
            if (!img.complete || img.naturalWidth === 0) {
                return "Image";
            }

            let predictions = [];

            // Handle model detection without tf.tidy (model handles its own cleanup)
            try {
                predictions = await this.model.detect(img);

                if (this.enableDebuging) {
                    console.log(
                        `Alt Text Auto-Fill: Found ${predictions.length} objects`
                    );
                }
            } catch (corsError) {
                if (
                    corsError.message.includes("Tainted") ||
                    corsError.message.includes("cross-origin")
                ) {
                    if (this.enableDebuging) {
                        console.log(
                            "Alt Text Auto-Fill: CORS detected, fetching via background..."
                        );
                    }

                    processedImg = await this.fetchImageViaBackground(img.src);
                    predictions = await this.model.detect(processedImg);
                    if (this.enableDebuging) {
                        console.log(
                            `Alt Text Auto-Fill: Found ${predictions.length} objects`
                        );
                    }
                } else {
                    throw corsError;
                }
            }

            if (this.enableDebuging) {
                console.log(
                    `Alt Text Auto-Fill: Found ${predictions.length} objects`
                );
            }

            // Filter predictions
            predictions = predictions.filter((p) => p.score > 0.3);

            if (predictions.length === 0) {
                return this.getBasicDescription(img);
            }

            return this.createDescriptiveText(predictions, img);
        } catch (error) {
            console.error("Alt Text Auto-Fill: Generation error:", error);
            return this.getBasicDescription(img);
        } finally {
            // Clean up processed image
            if (processedImg && processedImg !== img) {
                this.cleanupImageData(processedImg);
            }

            this.processingQueue.delete(processingId);
        }
    }

    createDescriptiveText(predictions, img) {
        const objectCounts = {};

        for (const prediction of predictions) {
            const label = prediction.class;
            objectCounts[label] = (objectCounts[label] || 0) + 1;
        }

        const parts = [];

        // Sort by importance and count
        const sortedObjects = Object.entries(objectCounts).sort((a, b) => {
            if (a[0] === "person" && b[0] !== "person") return -1;
            if (b[0] === "person" && a[0] !== "person") return 1;

            const animals = [
                "cat",
                "dog",
                "bird",
                "horse",
                "sheep",
                "cow",
                "elephant",
                "bear",
                "zebra",
                "giraffe",
            ];
            const aIsAnimal = animals.includes(a[0]);
            const bIsAnimal = animals.includes(b[0]);
            if (aIsAnimal && !bIsAnimal) return -1;
            if (!aIsAnimal && bIsAnimal) return 1;

            return b[1] - a[1];
        });

        // Build description
        for (const [object, count] of sortedObjects.slice(0, 3)) {
            if (object === "person") {
                if (count === 1) {
                    parts.push("a person");
                } else if (count === 2) {
                    parts.push("two people");
                } else if (count <= 5) {
                    parts.push(
                        `${this.numberToWord(count).toLowerCase()} people`
                    );
                } else {
                    parts.push("a group of people");
                }
            } else {
                if (count === 1) {
                    parts.push(`a ${object}`);
                } else if (count === 2) {
                    parts.push(`two ${this.pluralize(object)}`);
                } else {
                    parts.push(`${count} ${this.pluralize(object)}`);
                }
            }
        }

        if (parts.length === 0) {
            return "Image with objects";
        }

        // Format as natural sentence
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        } else if (parts.length === 2) {
            const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            return `${first} and ${parts[1]}`;
        } else {
            const last = parts.pop();
            const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            parts[0] = first;
            return `${parts.join(", ")}, and ${last}`;
        }
    }

    numberToWord(num) {
        const words = [
            "",
            "One",
            "Two",
            "Three",
            "Four",
            "Five",
            "Six",
            "Seven",
            "Eight",
            "Nine",
            "Ten",
        ];
        return words[num] || num.toString();
    }

    pluralize(word) {
        const irregular = {
            person: "people",
            child: "children",
            man: "men",
            woman: "women",
            tooth: "teeth",
            foot: "feet",
            mouse: "mice",
            goose: "geese",
        };

        if (irregular[word]) return irregular[word];
        if (word.endsWith("fe")) return word.slice(0, -2) + "ves";
        if (word.endsWith("f")) return word.slice(0, -1) + "ves";
        if (word.endsWith("y") && !"aeiou".includes(word[word.length - 2])) {
            return word.slice(0, -1) + "ies";
        }
        if (
            word.endsWith("s") ||
            word.endsWith("x") ||
            word.endsWith("ch") ||
            word.endsWith("sh")
        ) {
            return word + "es";
        }
        return word + "s";
    }

    getBasicDescription(img) {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        if (width < 50 && height < 50) return "Small icon";
        if (aspectRatio > 3) return "Wide banner image";
        if (aspectRatio < 0.4) return "Tall portrait image";
        if (width > 1920) return "Large high-resolution image";
        if (Math.abs(aspectRatio - 1) < 0.1) return "Square image";

        return "Image";
    }

    async processImage(img) {
        if (this.processed.has(img)) return;
        if (img.alt && img.alt.trim().length > 0) return;
        if (img.naturalWidth < 10 || img.naturalHeight < 10) {
            img.alt = "";
            this.processed.add(img);
            return;
        }

        const altText = await this.generateAltText(img);
        img.alt = altText;
        img.setAttribute("data-auto-alt", "true");

        if (this.enableDebuging) {
            console.log(`Alt Text Auto-Fill: Set alt="${altText}"`);
        }
        this.processed.add(img);
        this.showFeedback(img);
    }

    showFeedback(img) {
        img.classList.add("alt-text-processed");
        setTimeout(() => img.classList.remove("alt-text-processed"), 2000);
    }

    async processAllImages() {
        if (!this.enabled || !this.modelReady || !this.backendReady) return;

        const images = document.querySelectorAll('img:not([alt]), img[alt=""]');

        if (this.enableDebuging) {
            console.log(
                `Alt Text Auto-Fill: Found ${images.length} images to process`
            );
        }

        // Smaller batch size to reduce memory pressure
        const batchSize = 3;
        for (let i = 0; i < images.length; i += batchSize) {
            const batch = Array.from(images).slice(i, i + batchSize);

            await Promise.all(
                batch.map(async (img) => {
                    if (img.complete && img.naturalWidth > 0) {
                        await this.processImage(img);
                    } else {
                        img.addEventListener(
                            "load",
                            () => this.processImage(img),
                            { once: true }
                        );
                    }
                })
            );

            // Wait between batches to prevent overwhelming the backend
            if (i + batchSize < images.length) {
                await new Promise((resolve) => setTimeout(resolve, 200));
            }
        }
    }

    observe() {
        if (this.modelReady && this.backendReady) {
            this.processAllImages();
        }

        const observer = new MutationObserver(async (mutations) => {
            if (!this.enabled || !this.modelReady || !this.backendReady) return;

            const imagesToProcess = [];
            for (const mutation of mutations) {
                if (mutation.type === "childList") {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeName === "IMG") {
                            imagesToProcess.push(node);
                        } else if (node.querySelectorAll) {
                            const images = node.querySelectorAll(
                                'img:not([alt]), img[alt=""]'
                            );
                            imagesToProcess.push(...images);
                        }
                    }
                }
            }

            for (const img of imagesToProcess) {
                if (img.complete && img.naturalWidth > 0) {
                    await this.processImage(img);
                } else {
                    img.addEventListener("load", () => this.processImage(img), {
                        once: true,
                    });
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    cleanup() {
        if (this.enableDebuging) {
            console.log("Alt Text Auto-Fill: Cleaning up resources...");
        }

        // Wait for active processing to complete
        const cleanup = () => {
            if (this.processingQueue.size > 0) {
                setTimeout(cleanup, 100);
                return;
            }

            // Clear cached images
            for (const img of this.imageCache.values()) {
                this.cleanupImageData(img);
            }
            this.imageCache.clear();

            // Dispose model safely
            if (this.model) {
                try {
                    this.model.dispose();
                } catch (e) {
                    console.warn("Model disposal error:", e);
                }
                this.model = null;
            }

            this.modelReady = false;
            this.backendReady = false;
        };

        cleanup();
    }
}

// Initialize
const altTextGenerator = new AltTextGenerator();

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
    altTextGenerator.cleanup();
});

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle") {
        altTextGenerator.enabled = request.enabled;
        if (request.enabled) {
            altTextGenerator.processAllImages();
        }
        sendResponse({ success: true });
    } else if (request.action === "process") {
        altTextGenerator.processAllImages();
        sendResponse({ success: true });
    } else if (request.action === "getStats") {
        const total = document.querySelectorAll("img").length;
        const withAlt = document.querySelectorAll(
            'img[alt]:not([alt=""])'
        ).length;
        const processed = document.querySelectorAll(
            'img[data-auto-alt="true"]'
        ).length;
        const modelReady =
            altTextGenerator.modelReady && altTextGenerator.backendReady;
        sendResponse({ total, withAlt, processed, modelReady });
    }
    return true;
});
