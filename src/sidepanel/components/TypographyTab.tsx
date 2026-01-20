interface TypographyTabProps {
    element: {
        tagName: string
        styles: Record<string, string>
    }
}

export function TypographyTab({ element }: TypographyTabProps) {
    const fontFamily = element.styles.fontFamily || 'Not specified'
    const primaryFont = fontFamily.split(',')[0]?.trim().replace(/['"]/g, '') || 'Unknown'

    const properties = [
        { label: 'Family', value: primaryFont, accent: 'text-blue-400' },
        { label: 'Weight', value: element.styles.fontWeight || '400', accent: '' },
        { label: 'Size', value: element.styles.fontSize || '—', accent: 'text-white' },
        { label: 'Line Height', value: element.styles.lineHeight || '—', accent: '' },
        { label: 'Spacing', value: element.styles.letterSpacing || '—', accent: '' },
        { label: 'Color', value: element.styles.color || '—', accent: '', isColor: true },
    ]

    return (
        <div className="space-y-6">
            {/* Font preview card */}
            <div className="relative group rounded-xl border border-neutral-800/80 bg-[#0a0a0a] shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden">
                <div className="px-4 py-2 bg-neutral-900/50 border-b border-neutral-800/50 flex justify-between items-center">
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-neutral-800" />
                        <div className="w-2 h-2 rounded-full bg-neutral-800" />
                    </div>
                    <span className="text-[9px] text-neutral-600 font-mono uppercase tracking-widest font-bold">
                        Type Preview
                    </span>
                </div>

                <div className="p-8 text-center bg-gradient-to-b from-transparent to-black/20">
                    <p
                        className="text-4xl text-white mb-3"
                        style={{ fontFamily }}
                    >
                        Abc
                    </p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold px-3 py-1 bg-neutral-900/80 rounded-full inline-block border border-neutral-800/50">
                        {primaryFont}
                    </p>
                </div>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-2">
                {properties.map((prop) => (
                    <div key={prop.label} className="p-3 bg-neutral-900/40 rounded-lg border border-neutral-800/50 flex flex-col gap-1">
                        <span className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold">{prop.label}</span>
                        <div className="flex items-center gap-2 overflow-hidden">
                            {prop.isColor && prop.value !== '—' && (
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: prop.value }} />
                            )}
                            <span className={`text-[11px] font-mono truncate ${prop.accent || 'text-neutral-300'}`}>
                                {prop.value}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Full font stack card */}
            <div className="p-4 bg-[#0a0a0a] rounded-xl border border-neutral-800/50">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-1 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Stack Hierarchy</span>
                </div>
                <p className="text-[10px] font-mono text-neutral-400 break-all leading-relaxed bg-black/30 p-2 rounded border border-neutral-800/30">
                    {fontFamily}
                </p>
            </div>
        </div>
    )
}
