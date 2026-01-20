import { useMemo } from 'react'

interface AssetsTabProps {
    element: {
        innerHTML: string
        outerHTML: string
    }
}

interface ExtractedAsset {
    type: 'svg' | 'img'
    src: string
    alt?: string
    content?: string
}

export function AssetsTab({ element }: AssetsTabProps) {
    const assets = useMemo(() => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(element.outerHTML, 'text/html')
        const extractedAssets: ExtractedAsset[] = []

        doc.querySelectorAll('svg').forEach((svg) => {
            extractedAssets.push({
                type: 'svg',
                src: '',
                content: svg.outerHTML
            })
        })

        doc.querySelectorAll('img').forEach((img) => {
            if (img.src) {
                extractedAssets.push({
                    type: 'img',
                    src: img.src,
                    alt: img.alt
                })
            }
        })

        // Also look for background images in styles if we had them, 
        // but for now we stick to inline assets
        return extractedAssets
    }, [element.outerHTML])

    const handleDownload = async (asset: ExtractedAsset, index: number) => {
        try {
            if (asset.type === 'svg' && asset.content) {
                const blob = new Blob([asset.content], { type: 'image/svg+xml' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `chardow-asset-${index + 1}.svg`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
            } else if (asset.type === 'img' && asset.src) {
                // For images, we try to fetch as blob to avoid tab navigation issues
                const response = await fetch(asset.src)
                const blob = await response.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                const extension = asset.src.split('.').pop()?.split(/[?#]/)[0] || 'png'
                a.download = `chardow-asset-${index + 1}.${extension}`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
            }
        } catch (error) {
            console.error('Download failed:', error)
            // Fallback: Just open in new tab if blob fetch fails
            if (asset.src) window.open(asset.src, '_blank')
        }
    }

    if (assets.length === 0) {
        return (
            <div className="pt-16 text-center">
                <p className="text-neutral-500 text-sm">No assets found</p>
                <p className="text-neutral-600 text-[10px] uppercase mt-2">Try selecting a container with images or icons</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500 uppercase tracking-widest font-medium">
                    Extracted Assets ({assets.length})
                </span>
            </div>

            <div className="grid gap-2">
                {assets.map((asset, index) => (
                    <div
                        key={index}
                        className="group flex items-center gap-3 p-2 bg-[#0a0a0a] border border-neutral-800/50 rounded-lg hover:border-blue-500/30 transition-all"
                    >
                        {/* Preview */}
                        <div className="w-10 h-10 bg-neutral-900 rounded flex items-center justify-center overflow-hidden flex-shrink-0 border border-neutral-800">
                            {asset.type === 'svg' && asset.content ? (
                                <div
                                    className="w-6 h-6 text-neutral-400 fill-current"
                                    dangerouslySetInnerHTML={{ __html: asset.content }}
                                />
                            ) : (
                                <img
                                    src={asset.src}
                                    alt={asset.alt || 'Asset'}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=IMG'
                                    }}
                                />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-neutral-300 truncate font-medium">
                                {asset.type === 'svg' ? `Vector Asset ${index + 1}` : asset.alt || `Image ${index + 1}`}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[9px] px-1 rounded-sm uppercase tracking-tighter ${asset.type === 'svg' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                                    }`}>
                                    {asset.type}
                                </span>
                            </div>
                        </div>

                        {/* Download */}
                        <button
                            onClick={() => handleDownload(asset, index)}
                            className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-md transition-all active:scale-90"
                            title="Download Asset"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            <div className="p-3 bg-neutral-900/30 rounded border border-neutral-800/50 mt-4">
                <p className="text-[9px] text-neutral-600 leading-relaxed uppercase tracking-tight">
                    Tip: Hover over an asset to see the download button.
                </p>
            </div>
        </div>
    )
}
