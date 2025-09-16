// background.js - Service worker for Alt Text Auto-Fill
// By Software for Progress Foundation

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ enabled: true });
    console.log(
        "Alt Text Auto-Fill by Software for Progress Foundation - Installed successfully"
    );
});

chrome.contextMenus.create({
    id: "generateAlt",
    title: "Generate Alt Text (Software for Progress)",
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
