import { useMemo, useState } from 'react'
import { inferLogic } from '../../utils/translator'
import type { ElementNode } from '../../utils/translator'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface LogicTabProps {
    element: {
        tagName: string
        node?: ElementNode
    }
}

export function LogicTab({ element }: LogicTabProps) {
    const [copied, setCopied] = useState(false)

    const suggestedLogic = useMemo(() => {
        if (!element.node) return '// No node data available to infer logic.'
        return inferLogic(element.node)
    }, [element.node])

    const handleCopy = async () => {
        await navigator.clipboard.writeText(suggestedLogic)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-5">
            {/* Code block */}
            <div className="relative group rounded-xl border border-neutral-800/80 bg-[#0a0a0a] shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden">
                <div className="px-4 py-2 bg-neutral-900/50 border-b border-neutral-800/50 flex justify-between items-center">
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-neutral-800" />
                        <div className="w-2 h-2 rounded-full bg-neutral-800" />
                        <div className="w-2 h-2 rounded-full bg-neutral-800" />
                    </div>
                    <span className="text-[9px] text-neutral-600 font-mono uppercase tracking-widest font-bold">
                        Interaction.ts
                    </span>
                </div>

                <SyntaxHighlighter
                    language="javascript"
                    style={atomDark}
                    customStyle={{
                        margin: 0,
                        padding: '16px',
                        fontSize: '11px',
                        backgroundColor: 'transparent',
                        lineHeight: '1.7',
                        maxHeight: '400px',
                    }}
                >
                    {suggestedLogic}
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

            <div className="p-4 bg-neutral-900/40 rounded-xl border border-neutral-800/50">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-1 rounded-full bg-blue-400" />
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Intelligent Logic</span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-relaxed font-medium">
                    Chardow scans for interactable patterns like buttons, inputs, and links. It provides boilerplate React hooks to help you jumpstart the functional implementation.
                </p>
            </div>
        </div>
    )
}
