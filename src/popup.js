// popup.js - Control panel logic
document.addEventListener("DOMContentLoaded", async () => {
    const toggle = document.getElementById("toggle");
    const processBtn = document.getElementById("processBtn");
    const totalEl = document.getElementById("total");
    const withAltEl = document.getElementById("withAlt");
    const processedEl = document.getElementById("processed");

    const { enabled = true } = await chrome.storage.sync.get(["enabled"]);
    toggle.checked = enabled;

    async function updateStats() {
        try {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });
            if (!tab) return;

            chrome.tabs.sendMessage(
                tab.id,
                { action: "getStats" },
                (response) => {
                    if (response) {
                        totalEl.textContent = response.total || 0;
                        withAltEl.textContent = response.withAlt || 0;
                        processedEl.textContent = response.processed || 0;
                    }
                }
            );
        } catch (error) {
            console.error("Error updating stats:", error);
        }
    }

    updateStats();

    toggle.addEventListener("change", async () => {
        const enabled = toggle.checked;
        await chrome.storage.sync.set({ enabled });

        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        if (tab) {
            chrome.tabs.sendMessage(tab.id, { action: "toggle", enabled });
        }
    });

    processBtn.addEventListener("click", async () => {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        if (tab) {
            chrome.tabs.sendMessage(tab.id, { action: "process" });
            setTimeout(updateStats, 1000);
        }
    });
});
