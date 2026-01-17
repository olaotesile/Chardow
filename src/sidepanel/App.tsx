import { useState, useEffect, useCallback } from 'react'
import { CodeTab } from './components/CodeTab'
import { AssetsTab } from './components/AssetsTab'
import { TypographyTab } from './components/TypographyTab'
import { LogicTab } from './components/LogicTab'
import type { ElementNode } from '../utils/translator'

interface SelectedElement {
    tagName: string
    classes: string[]
    styles: Record<string, string>
    innerHTML: string
    outerHTML: string
    node?: ElementNode
}

type TabType = 'code' | 'logic' | 'assets' | 'typography'

export default function App() {
    const [activeTab, setActiveTab] = useState<TabType>('code')
    const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
    const [isSelecting, setIsSelecting] = useState(false)

    useEffect(() => {
        const handleMessage = (message: { type: string; payload: SelectedElement }) => {
            if (message.type === 'ELEMENT_SELECTED') {
                setSelectedElement(message.payload)
                setIsSelecting(false) // Stop selecting mode visually when element is picked
            }
        }

        chrome.runtime.onMessage.addListener(handleMessage)
        return () => chrome.runtime.onMessage.removeListener(handleMessage)
    }, [])

    const tabs: { id: TabType; label: string }[] = [
        { id: 'code', label: 'Code' },
        { id: 'logic', label: 'Logic' },
        { id: 'assets', label: 'Assets' },
        { id: 'typography', label: 'Type' },
    ]

    const handleStartSelection = useCallback(async () => {
        if (isSelecting) return

        setIsSelecting(true)
        console.log('Chardow: Multi-selection trigger')

        try {
            await chrome.runtime.sendMessage({ type: 'START_SELECTION_MODE' })
            // We keep isSelecting true until an ELEMENT_SELECTED message comes in
            // OR until a few seconds pass (fallback)
            setTimeout(() => setIsSelecting(false), 8000)
        } catch (error) {
            console.error('Failed to start selection:', error)
            setIsSelecting(false)
            alert('Could not start selection mode. Please refresh the page.')
        }
    }, [isSelecting])

    return (
        <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="px-5 pt-6 pb-4 flex justify-between items-center bg-[#050505] sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] ${isSelecting ? 'bg-green-500 animate-ping' : 'bg-blue-500 animate-pulse'}`} />
                    <span className="text-sm font-bold tracking-tight text-white uppercase">Chardow</span>
                </div>

                {selectedElement && (
                    <button
                        onClick={handleStartSelection}
                        disabled={isSelecting}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${isSelecting
                                ? 'bg-neutral-800 text-neutral-500'
                                : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'
                            }`}
                    >
                        {isSelecting ? 'Selecting...' : 'Select New'}
                    </button>
                )}

                {!selectedElement && (
                    <div className="text-[10px] text-neutral-600 font-mono tracking-tighter">v0.2.0</div>
                )}
            </header>

            {/* Navigation */}
            <nav className="px-5 flex gap-5 border-b border-neutral-900 overflow-x-auto no-scrollbar bg-[#050505] sticky top-[56px] z-50">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-3 text-[11px] font-medium transition-all relative whitespace-nowrap ${activeTab === tab.id
                            ? 'text-white'
                            : 'text-neutral-500 hover:text-neutral-300'
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                        )}
                    </button>
                ))}
            </nav>

            {/* Main Content */}
            <main className="p-5">
                {!selectedElement ? (
                    <div className="pt-24 text-center">
                        <div className="mb-8 relative inline-block">
                            <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full" />
                            <svg className={`w-12 h-12 relative transition-colors ${isSelecting ? 'text-blue-500' : 'text-neutral-800'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                            </svg>
                        </div>

                        <p className="text-neutral-400 text-sm font-medium mb-1">
                            {isSelecting ? 'Selecting on page...' : 'Ready to deconstruct?'}
                        </p>
                        <p className="text-neutral-600 text-xs mb-8">
                            {isSelecting ? 'Go to your browser tab and click an element' : 'Select an element to begin'}
                        </p>

                        <button
                            onClick={handleStartSelection}
                            disabled={isSelecting}
                            className={`w-full py-3 text-xs font-bold rounded-lg active:scale-[0.98] transition-all shadow-lg mb-6 uppercase tracking-widest ${isSelecting
                                    ? 'bg-neutral-900 text-neutral-600 border border-neutral-800'
                                    : 'bg-white hover:bg-neutral-200 text-black shadow-[0_4px_20px_rgba(255,255,255,0.1)]'
                                }`}
                        >
                            {isSelecting ? 'Selecting Mode Active' : 'Select Element'}
                        </button>

                        <div className="flex items-center justify-center gap-2">
                            <span className="text-[10px] text-neutral-700 uppercase tracking-widest">Shortcut</span>
                            <kbd className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-neutral-400 font-mono shadow-inner">Alt+S</kbd>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeTab === 'code' && <CodeTab element={selectedElement} />}
                        {activeTab === 'logic' && <LogicTab element={selectedElement} />}
                        {activeTab === 'assets' && <AssetsTab element={selectedElement} />}
                        {activeTab === 'typography' && <TypographyTab element={selectedElement} />}
                    </div>
                )}
            </main>

            {/* Footer accent */}
            {selectedElement && (
                <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent pointer-events-none" />
            )}
        </div>
    )
}
