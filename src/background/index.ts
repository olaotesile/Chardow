// Chardow Background Service Worker
// Handles keyboard shortcuts and communication between content script and sidepanel

chrome.commands.onCommand.addListener((command) => {
    console.log('Chardow: Command received:', command)
    if (command === 'toggle-selection-mode') {
        // Send message to content script to toggle selection mode
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_SELECTION_MODE' })
            }
        })
    }
})

async function ensureContentScriptInjected(tabId: number) {
    try {
        // Try to send a "ping" message
        await chrome.tabs.sendMessage(tabId, { type: 'PING' })
        console.log('Chardow: Content script already active in tab:', tabId)
    } catch (e) {
        console.log('Chardow: Content script not found, injecting into tab:', tabId)
        // If it fails, inject the script
        const manifest = chrome.runtime.getManifest()
        const contentScriptPath = manifest.content_scripts?.[0]?.js?.[0]

        if (contentScriptPath) {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: [contentScriptPath]
            })
        } else {
            console.error('Chardow: Could not find content script path in manifest')
        }
    }
}

// Handle messages from content script or sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ELEMENT_SELECTED') {
        if (sender.tab?.windowId) {
            chrome.sidePanel.open({ windowId: sender.tab.windowId })
        }
        chrome.runtime.sendMessage(message)
        sendResponse({ success: true })
    } else if (message.type === 'START_SELECTION_MODE') {
        console.log('Chardow: START_SELECTION_MODE received')
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const tabId = tabs[0]?.id
            if (tabId) {
                await ensureContentScriptInjected(tabId)
                chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_SELECTION_MODE' }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Chardow: Relay error after injection:', chrome.runtime.lastError.message)
                    }
                })
            }
        })
        sendResponse({ success: true })
    }
    return true
})

// Allow opening side panel on action click
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Chardow: Failed to set panel behavior:', error))
