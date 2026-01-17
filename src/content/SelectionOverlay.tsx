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
            // Skip our own overlay
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
        const target = e.target as Element

        // Ignore our own overlay elements
        if (target.closest('#chardow-overlay-host')) return

        updateHighlight(target)
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
        if (!isActive || !hoveredElement) return

        // Prevent default behavior and stop propagation
        e.preventDefault()
        e.stopPropagation()

        const element = hoveredElement
        const rect = element.getBoundingClientRect()
        const node = extractElementNode(element)

        onElementSelected({
            tagName: element.tagName.toLowerCase(),
            classes: Array.from(element.classList),
            styles: node.styles,
            innerHTML: element.innerHTML,
            outerHTML: element.outerHTML,
            rect: rect,
            node: node
        })
    }, [isActive, hoveredElement, onElementSelected])

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

    if (!isActive) return null

    const { rect } = highlight

    return (
        <>
            {/* Mode indicator */}
            <div className="chardow-mode-indicator">
                <div className="chardow-pulse" />
                <div className="flex flex-col">
                    <span className="text-white font-medium">Selection Active</span>
                    <span className="text-[9px] text-neutral-400 uppercase tracking-tighter">Use ↑ ↓ to traverse DOM</span>
                </div>
            </div>

            {/* Highlight box */}
            {rect && (
                <>
                    <div
                        className="chardow-highlight"
                        style={{
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height
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
                        <span style={{ opacity: 0.3, fontSize: '9px', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 8 }}>
                            {Math.round(rect.width)} × {Math.round(rect.height)}
                        </span>
                    </div>
                </>
            )}
        </>
    )
}
