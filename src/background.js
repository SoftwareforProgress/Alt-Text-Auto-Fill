/**
 * Background Service Worker - Alt Text Auto-Fill
 * By Software for Progress Foundation
 *
 * Handles image fetching and other background tasks
 */

// Your existing background code...
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ enabled: true });
    console.log("Alt Text Auto-Fill Extension installed");
});

chrome.contextMenus.create({
    id: "generateAlt",
    title: "Generate Alt Text for This Image",
    contexts: ["image"],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "generateAlt") {
        chrome.tabs.sendMessage(tab.id, {
            action: "processImage",
            src: info.srcUrl,
        });
    }
});

// Image fetching handler with blob support
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchImageAsBlob") {
        // Fetch image and return as base64 for blob creation
        fetch(request.url)
            .then((response) => {
                if (!response.ok)
                    throw new Error(`HTTP error! status: ${response.status}`);
                const mimeType =
                    response.headers.get("content-type") || "image/jpeg";
                return response
                    .arrayBuffer()
                    .then((buffer) => ({ buffer, mimeType }));
            })
            .then(({ buffer, mimeType }) => {
                // Convert to base64
                let binary = "";
                const bytes = new Uint8Array(buffer);
                const len = bytes.byteLength;

                // Process in chunks to avoid stack overflow on large images
                const chunkSize = 8192;
                for (let i = 0; i < len; i += chunkSize) {
                    const chunk = bytes.slice(i, Math.min(i + chunkSize, len));
                    binary += String.fromCharCode.apply(null, chunk);
                }

                const base64 = btoa(binary);
                sendResponse({
                    success: true,
                    base64: base64,
                    mimeType: mimeType,
                });
            })
            .catch((error) => {
                console.error("Background: Failed to fetch image:", error);
                sendResponse({
                    success: false,
                    error: error.message,
                });
            });

        return true; // Will respond asynchronously
    }

    // Legacy data URL method (kept for compatibility)
    if (request.action === "fetchImage") {
        fetch(request.url)
            .then((response) => response.blob())
            .then((blob) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    sendResponse({
                        success: true,
                        dataUrl: reader.result,
                    });
                };
                reader.readAsDataURL(blob);
            })
            .catch((error) => {
                console.error("Background: Failed to fetch image:", error);
                sendResponse({
                    success: false,
                    error: error.message,
                });
            });

        return true; // Will respond asynchronously
    }
});
