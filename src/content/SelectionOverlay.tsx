import { useState, useEffect, useCallback } from 'react'

interface ElementNode {
    tagName: string
    styles: Record<string, string>
    attributes: Record<string, string>
    children: (ElementNode | string)[]
}

interface SelectionOverlayProps {
    isActive: boolean
    onElementSelected: (elementData: {
        tagName: string
        classes: string[]
        styles: Record<string, string>
        innerHTML: string
        outerHTML: string
        rect: DOMRect
        node?: ElementNode
    }) => void
}

interface HighlightState {
    rect: DOMRect | null
    tagName: string
    classes: string[]
}

const extractElementNode = (element: Element): ElementNode => {
    const computedStyles = window.getComputedStyle(element)
    const relevantProperties = [
        'display', 'flexDirection', 'justifyContent', 'alignItems', 'gap',
        'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
        'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
        'width', 'height', 'maxWidth', 'minWidth', 'maxHeight', 'minHeight',
        'backgroundColor', 'color', 'fontSize', 'fontWeight', 'fontFamily',
        'lineHeight', 'letterSpacing', 'textAlign', 'textDecoration',
        'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius',
        'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
        'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
        'boxShadow', 'opacity', 'position', 'top', 'right', 'bottom', 'left',
        'zIndex', 'overflow', 'transform', 'transition',
        'flexGrow', 'flexShrink', 'flexBasis'
    ]

    const styles: Record<string, string> = {}
    relevantProperties.forEach(prop => {
        const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase()
        const value = computedStyles.getPropertyValue(cssProp)
        if (value && value !== 'none' && value !== 'normal' && value !== 'auto' && value !== '0px') {
            styles[prop] = value
        }
    })

    const attributes: Record<string, string> = {}
    if (element instanceof HTMLAnchorElement) attributes.href = element.getAttribute('href') || ''
    if (element instanceof HTMLImageElement) {
        attributes.src = element.getAttribute('src') || ''
        attributes.alt = element.getAttribute('alt') || ''
    }

    const children: (ElementNode | string)[] = []
    element.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent?.trim()
            if (text) children.push(text)
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            const childEl = child as Element
            if (childEl.id === 'chardow-overlay-host') return
            children.push(extractElementNode(childEl))
        }
    })

    return {
        tagName: element.tagName.toLowerCase(),
        styles,
        attributes,
        children
    }
}

export function SelectionOverlay({ isActive, onElementSelected }: SelectionOverlayProps) {
    const [highlight, setHighlight] = useState<HighlightState>({
        rect: null,
        tagName: '',
        classes: []
    })
    const [hoveredElement, setHoveredElement] = useState<Element | null>(null)
    const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null)
    const [selectedTag, setSelectedTag] = useState<string>('')

    const updateHighlight = useCallback((element: Element) => {
        setHoveredElement(element)
        const rect = element.getBoundingClientRect()
        setHighlight({
            rect,
            tagName: element.tagName.toLowerCase(),
            classes: Array.from(element.classList)
        })
    }, [])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isActive) return

        // Find element at current mouse position effectively "under" our overlay
        const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY)
        const target = elementsAtPoint.find(el => !el.closest('#chardow-overlay-host'))

        if (target) {
            updateHighlight(target)
        }
    }, [isActive, updateHighlight])

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isActive || !hoveredElement) return

        if (e.key === 'ArrowUp') {
            e.preventDefault()
            const parent = hoveredElement.parentElement
            if (parent && parent !== document.documentElement && parent !== document.body) {
                updateHighlight(parent)
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            const firstChild = hoveredElement.firstElementChild
            if (firstChild) {
                updateHighlight(firstChild)
            }
        }
    }, [isActive, hoveredElement, updateHighlight])

    const handleClick = useCallback((e: MouseEvent) => {
        if (!isActive) return

        // Prevent default behavior and stop propagation
        e.preventDefault()
        e.stopPropagation()

        const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY)
        const target = elementsAtPoint.find(el => !el.closest('#chardow-overlay-host'))

        if (target) {
            const rect = target.getBoundingClientRect()
            const node = extractElementNode(target)

            setSelectedRect(rect)
            setSelectedTag(target.tagName.toLowerCase())

            onElementSelected({
                tagName: target.tagName.toLowerCase(),
                classes: Array.from(target.classList),
                styles: node.styles,
                innerHTML: target.innerHTML,
                outerHTML: target.outerHTML,
                rect: rect,
                node: node
            })
        }
    }, [isActive, onElementSelected])

    // Effect to prevent page interaction during selection
    useEffect(() => {
        if (!isActive) return

        const blockEvent = (e: Event) => {
            if (!(e.target as Element).closest('#chardow-overlay-host')) {
                e.preventDefault()
                e.stopPropagation()
            }
        }

        // Block everything in the capture phase
        document.addEventListener('mousedown', blockEvent, true)
        document.addEventListener('mouseup', blockEvent, true)
        document.addEventListener('click', blockEvent, true)
        document.addEventListener('dblclick', blockEvent, true)
        document.addEventListener('contextmenu', blockEvent, true)

        return () => {
            document.removeEventListener('mousedown', blockEvent, true)
            document.removeEventListener('mouseup', blockEvent, true)
            document.removeEventListener('click', blockEvent, true)
            document.removeEventListener('dblclick', blockEvent, true)
            document.removeEventListener('contextmenu', blockEvent, true)
        }
    }, [isActive])

    useEffect(() => {
        if (isActive) {
            document.addEventListener('mousemove', handleMouseMove, true)
            document.addEventListener('click', handleClick, true)
            document.addEventListener('keydown', handleKeyDown, true)
            document.body.style.cursor = 'crosshair'
        } else {
            document.body.style.cursor = ''
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove, true)
            document.removeEventListener('click', handleClick, true)
            document.removeEventListener('keydown', handleKeyDown, true)
            document.body.style.cursor = ''
        }
    }, [isActive, handleMouseMove, handleClick, handleKeyDown])

    // Visual states for selection
    const { rect } = highlight

    return (
        <>
            {/* Snapshot Overlay Mask (Dormant Mode) */}
            {isActive && (
                <div className="chardow-snapshot-mask" style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(5, 5, 5, 0.4)',
                    backdropFilter: 'grayscale(0.5) blur(1px)',
                    zIndex: 2147483640,
                    pointerEvents: 'auto' // This intercept events
                }} />
            )}

            {/* Selection Active Indicator */}
            {isActive && (
                <div className="chardow-mode-indicator">
                    <div className="chardow-pulse" />
                    <div className="flex flex-col">
                        <span className="text-white font-medium">Snapshot Mode</span>
                        <span className="text-[9px] text-neutral-400 uppercase tracking-tighter">Page dormant. Mouse over to select.</span>
                    </div>
                </div>
            )}

            {/* Hover Highlight (Active during selection) */}
            {isActive && rect && (
                <>
                    <div
                        className="chardow-highlight"
                        style={{
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height,
                            borderStyle: 'dashed'
                        }}
                    />
                    <div
                        className="chardow-label"
                        style={{
                            top: Math.max(0, rect.top - 28),
                            left: rect.left,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span style={{ color: '#fff', fontWeight: 600 }}>&lt;{highlight.tagName}&gt;</span>
                        {highlight.classes.length > 0 && (
                            <span style={{ opacity: 0.5, fontSize: '9px', fontFamily: 'monospace' }}>
                                .{highlight.classes.slice(0, 2).join('.')}
                            </span>
                        )}
                    </div>
                </>
            )}

            {/* Persistent Selection Highlight (Visible when NOT in selection mode) */}
            {!isActive && selectedRect && (
                <>
                    <div
                        className="chardow-highlight chardow-persistent"
                        style={{
                            top: selectedRect.top,
                            left: selectedRect.left,
                            width: selectedRect.width,
                            height: selectedRect.height,
                            borderColor: '#3b82f6',
                            boxShadow: '0 0 30px rgba(59, 130, 246, 0.5), inset 0 0 10px rgba(59, 130, 246, 0.2)'
                        }}
                    />
                    <div
                        className="chardow-label chardow-persistent-label"
                        style={{
                            top: Math.max(0, selectedRect.top - 28),
                            left: selectedRect.left,
                            background: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            fontSize: '10px'
                        }}
                    >
                        Active: &lt;{selectedTag}&gt;
                    </div>
                </>
            )}
        </>
    )
}
