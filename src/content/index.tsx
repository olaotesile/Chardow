import { createRoot } from 'react-dom/client'
import { SelectionOverlay } from './SelectionOverlay'

// Chardow Content Script Entry Point
// Injects the selection overlay into every page

let isSelectionMode = false
let overlayRoot: ReturnType<typeof createRoot> | null = null
let shadowHost: HTMLElement | null = null

function createOverlay() {
    // Create a shadow DOM to isolate our styles from the page
    shadowHost = document.createElement('div')
    shadowHost.id = 'chardow-overlay-host'
    shadowHost.style.cssText = 'all: initial; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2147483647; pointer-events: none;'

    const shadowRoot = shadowHost.attachShadow({ mode: 'open' })

    // Add our styles to the shadow DOM
    const styleSheet = document.createElement('style')
    styleSheet.textContent = `
    * { box-sizing: border-box; }
    .chardow-highlight {
      position: fixed;
      pointer-events: none;
      border: 2px solid #ffffff;
      background: rgba(255, 255, 255, 0.05);
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.05);
      border-radius: 4px;
      transition: all 0.1s ease-out;
      z-index: 2147483647;
    }
    .chardow-label {
      position: fixed;
      background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
      color: #ffffff;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      z-index: 2147483647;
      pointer-events: none;
    }
    .chardow-mode-indicator {
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
      color: #ffffff;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      font-size: 12px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
      z-index: 2147483647;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chardow-pulse {
      width: 8px;
      height: 8px;
      background: #ffffff;
      border-radius: 50%;
      animation: chardow-pulse-anim 1.5s ease-in-out infinite;
    }
    @keyframes chardow-pulse-anim {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
    }
  `
    shadowRoot.appendChild(styleSheet)

    // Create container for React
    const container = document.createElement('div')
    container.id = 'chardow-overlay-container'
    shadowRoot.appendChild(container)

    document.body.appendChild(shadowHost)

    overlayRoot = createRoot(container)
}

function renderOverlay() {
    if (!overlayRoot) return
    overlayRoot.render(
        <SelectionOverlay
            isActive={isSelectionMode}
            onElementSelected={handleElementSelected}
        />
    )
}

function destroyOverlay() {
    if (overlayRoot) {
        overlayRoot.unmount()
        overlayRoot = null
    }
    if (shadowHost) {
        shadowHost.remove()
        shadowHost = null
    }
}

function handleElementSelected(elementData: {
    tagName: string
    classes: string[]
    styles: Record<string, string>
    innerHTML: string
    outerHTML: string
    rect: DOMRect
}) {
    // Send the selected element data to the background script
    chrome.runtime.sendMessage({
        type: 'ELEMENT_SELECTED',
        payload: elementData
    })

    // Exit selection mode after selection
    isSelectionMode = false
    renderOverlay()
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('Chardow: Message received:', message)
    try {
        if (message.type === 'PING') {
            sendResponse({ success: true })
            return true
        }
        if (message.type === 'TOGGLE_SELECTION_MODE') {
            toggleSelectionMode()
            sendResponse({ success: true, isActive: isSelectionMode })
        }
    } catch (error) {
        console.error('Chardow: Error handling message:', error)
        sendResponse({ success: false, error: String(error) })
    }
    return true
})

function toggleSelectionMode() {
    try {
        isSelectionMode = !isSelectionMode
        console.log('Chardow: Selection mode toggled to:', isSelectionMode)

        if (isSelectionMode && !shadowHost) {
            console.log('Chardow: Creating overlay...')
            createOverlay()
        }

        renderOverlay()

        if (!isSelectionMode) {
            // Delay destruction to allow exit animation
            console.log('Chardow: Deactivating overlay...')
            setTimeout(destroyOverlay, 300)
        }
    } catch (error) {
        console.error('Chardow: Failed to toggle selection mode:', error)
    }
}

// Fallback: Direct key listener in case global command fails
window.addEventListener('keydown', (e) => {
    // Check for Alt+S (ignoring case)
    if (e.altKey && (e.key === 's' || e.key === 'S')) {
        console.log('Chardow: Alt+S detected via keydown listener')
        toggleSelectionMode()
    }
}, { capture: true, passive: true })

console.log('🔮 Chardow content script v0.1.0 loaded. Initialized at:', new Date().toLocaleTimeString())
console.log('👉 Press Alt+S to start selecting elements.')
