import { useState, useMemo } from 'react'
import { stylesToTailwind, generateReactComponent } from '../../utils/translator'
import type { ElementNode } from '../../utils/translator'

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeTabProps {
    element: {
        tagName: string
        classes: string[]
        styles: Record<string, string>
        innerHTML: string
        outerHTML: string
        node?: ElementNode
    }
}

type CodeFormat = 'jsx' | 'html'

export function CodeTab({ element }: CodeTabProps) {
    const [format, setFormat] = useState<CodeFormat>('jsx')
    const [copied, setCopied] = useState(false)

    const tailwindClasses = useMemo(() => {
        return stylesToTailwind(element.styles, element.tagName)
    }, [element.styles, element.tagName])

    const generatedCode = useMemo(() => {
        if (format === 'jsx') {
            if (element.node) {
                return generateReactComponent(element.node)
            }
            return generateReactComponent({
                tagName: element.tagName,
                styles: element.styles,
                attributes: {},
                children: [element.innerHTML]
            })
        }
        return element.outerHTML
    }, [format, element])

    const handleCopy = async () => {
        await navigator.clipboard.writeText(generatedCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-5">
            {/* Format toggle */}
            <div className="flex gap-6">
                <button
                    onClick={() => setFormat('jsx')}
                    className={`text-[11px] font-semibold transition-colors uppercase tracking-tight ${format === 'jsx' ? 'text-blue-400' : 'text-neutral-600 hover:text-neutral-400'}`}
                >
                    React + Tailwind
                </button>
                <button
                    onClick={() => setFormat('html')}
                    className={`text-[11px] font-semibold transition-colors uppercase tracking-tight ${format === 'html' ? 'text-blue-400' : 'text-neutral-600 hover:text-neutral-400'}`}
                >
                    Raw HTML
                </button>
            </div>

            {/* Code block */}
            <div className="relative group rounded-xl border border-neutral-800/80 bg-[#0a0a0a] shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden">
                <div className="px-4 py-2 bg-neutral-900/50 border-b border-neutral-800/50 flex justify-between items-center">
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-neutral-800" />
                        <div className="w-2 h-2 rounded-full bg-neutral-800" />
                        <div className="w-2 h-2 rounded-full bg-neutral-800" />
                    </div>
                    <span className="text-[9px] text-neutral-600 font-mono uppercase tracking-widest">
                        {format === 'jsx' ? 'Component.tsx' : 'index.html'}
                    </span>
                </div>

                <SyntaxHighlighter
                    language={format === 'jsx' ? 'jsx' : 'html'}
                    style={atomDark}
                    customStyle={{
                        margin: 0,
                        padding: '16px',
                        fontSize: '11px',
                        backgroundColor: 'transparent',
                        lineHeight: '1.7',
                        maxHeight: '450px',
                    }}
                >
                    {generatedCode}
                </SyntaxHighlighter>

                <button
                    onClick={handleCopy}
                    className={`absolute top-11 right-3 px-3 py-1.5 text-[10px] font-bold rounded-md transition-all active:scale-95 ${copied
                        ? 'bg-blue-500 text-white'
                        : 'bg-neutral-800/80 backdrop-blur-sm text-neutral-300 hover:bg-neutral-700 border border-neutral-700/50 shadow-lg'
                        }`}
                >
                    {copied ? 'COPIED!' : 'COPY'}
                </button>
            </div>

            {/* Detected classes */}
            {format === 'jsx' && tailwindClasses.length > 0 && (
                <div className="p-3 bg-neutral-900/40 rounded-lg border border-neutral-800/50">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold mb-2">Tailwind Palette</p>
                    <div className="flex flex-wrap gap-1.5">
                        {tailwindClasses.map(cls => (
                            <span key={cls} className="px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded text-[10px] font-mono border border-neutral-700/30">
                                {cls}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
