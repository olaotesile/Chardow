/**
 * Chardow Translator Utility
 * Converts computed CSS styles to Tailwind CSS classes
 */

// Color mappings (common colors to Tailwind)
const colorMap: Record<string, string> = {
    'rgb(0, 0, 0)': 'black',
    'rgb(255, 255, 255)': 'white',
    'rgb(239, 68, 68)': 'red-500',
    'rgb(249, 115, 22)': 'orange-500',
    'rgb(234, 179, 8)': 'yellow-500',
    'rgb(34, 197, 94)': 'green-500',
    'rgb(14, 165, 233)': 'sky-500',
    'rgb(59, 130, 246)': 'blue-500',
    'rgb(168, 85, 247)': 'purple-500',
    'rgb(236, 72, 153)': 'pink-500',
    'rgb(107, 114, 128)': 'gray-500',
    'rgb(156, 163, 175)': 'gray-400',
    'rgb(75, 85, 99)': 'gray-600',
    'rgb(55, 65, 81)': 'gray-700',
    'rgb(31, 41, 55)': 'gray-800',
    'rgb(17, 24, 39)': 'gray-900',
    'rgb(249, 250, 251)': 'gray-50',
    'rgb(243, 244, 246)': 'gray-100',
    'rgb(229, 231, 235)': 'gray-200',
    'rgb(209, 213, 219)': 'gray-300',
    'transparent': 'transparent',
    'rgba(0, 0, 0, 0)': 'transparent',
}

// Spacing mappings (px to Tailwind spacing units)
function pxToSpacing(px: string): string | null {
    const value = parseFloat(px)
    if (isNaN(value)) return null

    const spacingMap: Record<number, string> = {
        0: '0',
        1: 'px',
        2: '0.5',
        4: '1',
        6: '1.5',
        8: '2',
        10: '2.5',
        12: '3',
        14: '3.5',
        16: '4',
        20: '5',
        24: '6',
        28: '7',
        32: '8',
        36: '9',
        40: '10',
        44: '11',
        48: '12',
        56: '14',
        64: '16',
        80: '20',
        96: '24',
        112: '28',
        128: '32',
        144: '36',
        160: '40',
        176: '44',
        192: '48',
        208: '52',
        224: '56',
        240: '60',
        256: '64',
        288: '72',
        320: '80',
        384: '96',
    }

    // Find closest match
    const closest = Object.keys(spacingMap)
        .map(Number)
        .reduce((prev, curr) =>
            Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        )

    return spacingMap[closest] || null
}

// Font size mappings
function pxToFontSize(px: string): string | null {
    const value = parseFloat(px)
    if (isNaN(value)) return null

    const fontSizeMap: Record<number, string> = {
        12: 'xs',
        14: 'sm',
        16: 'base',
        18: 'lg',
        20: 'xl',
        24: '2xl',
        30: '3xl',
        36: '4xl',
        48: '5xl',
        60: '6xl',
        72: '7xl',
        96: '8xl',
        128: '9xl',
    }

    const closest = Object.keys(fontSizeMap)
        .map(Number)
        .reduce((prev, curr) =>
            Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        )

    return fontSizeMap[closest] || null
}

// Font weight mappings
function fontWeightToTailwind(weight: string): string | null {
    const weightMap: Record<string, string> = {
        '100': 'font-thin',
        '200': 'font-extralight',
        '300': 'font-light',
        'normal': 'font-normal',
        '400': 'font-normal',
        '500': 'font-medium',
        '600': 'font-semibold',
        'bold': 'font-bold',
        '700': 'font-bold',
        '800': 'font-extrabold',
        '900': 'font-black',
    }
    return weightMap[weight] || null
}

// Border radius mappings
function pxToBorderRadius(px: string): string | null {
    const value = parseFloat(px)
    if (isNaN(value) || value === 0) return null

    const radiusMap: Record<number, string> = {
        2: 'sm',
        4: '',
        6: 'md',
        8: 'lg',
        12: 'xl',
        16: '2xl',
        24: '3xl',
        9999: 'full',
    }

    if (value >= 100 || px === '50%') return 'full'

    const closest = Object.keys(radiusMap)
        .map(Number)
        .reduce((prev, curr) =>
            Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        )

    const suffix = radiusMap[closest]
    return suffix === '' ? 'rounded' : `rounded-${suffix}`
}

// Find closest Tailwind color
function findClosestColor(cssColor: string): string | null {
    if (!cssColor || cssColor === 'rgba(0, 0, 0, 0)' || cssColor === 'transparent') return 'transparent'

    // Direct match
    if (colorMap[cssColor]) {
        return colorMap[cssColor]
    }

    // Try to parse rgb/rgba
    const rgbMatch = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (!rgbMatch) return null

    const [, r, g, b] = rgbMatch.map(Number)

    // Check for common pure colors first
    if (r === 0 && g === 0 && b === 0) return 'black'
    if (r === 255 && g === 255 && b === 255) return 'white'

    // Simple color detection
    if (r > 200 && g < 100 && b < 100) return 'red-500'
    if (r > 200 && g > 150 && b < 100) return 'orange-500'
    if (r > 200 && g > 200 && b < 100) return 'yellow-500'
    if (r < 100 && g > 180 && b < 150) return 'green-500'
    if (r < 100 && g < 200 && b > 200) return 'sky-500'
    if (r < 100 && g < 150 && b > 200) return 'blue-500'
    if (r > 150 && g < 100 && b > 200) return 'purple-500'
    if (r > 200 && g < 100 && b > 150) return 'pink-500'

    // Grayscale detection
    if (Math.abs(r - g) < 15 && Math.abs(g - b) < 15) {
        const avg = (r + g + b) / 3
        if (avg < 20) return 'black'
        if (avg < 50) return 'neutral-900'
        if (avg < 80) return 'neutral-800'
        if (avg < 110) return 'neutral-700'
        if (avg < 140) return 'neutral-600'
        if (avg < 170) return 'neutral-500'
        if (avg < 200) return 'neutral-400'
        if (avg < 230) return 'neutral-300'
        if (avg < 245) return 'neutral-200'
        if (avg < 252) return 'neutral-100'
        return 'white'
    }

    // Fallback to hex if no clear match
    const toHex = (c: number) => c.toString(16).padStart(2, '0')
    return `[#${toHex(r)}${toHex(g)}${toHex(b)}]`
}

export interface ElementNode {
    tagName: string
    styles: Record<string, string>
    attributes: Record<string, string>
    children: (ElementNode | string)[]
}

/**
 * Convert computed CSS styles to Tailwind classes
 */
export function stylesToTailwind(styles: Record<string, string>, tagName: string = 'div'): string[] {
    const classes: string[] = []
    const tag = tagName.toLowerCase()

    // Display
    const d = styles.display
    if (d === 'flex') classes.push('flex')
    else if (d === 'grid') classes.push('grid')
    else if (d === 'inline-flex') classes.push('inline-flex')
    else if (d === 'inline-block') classes.push('inline-block')
    // Noise Reduction: Skip 'block' for tags that are naturally block elements (div, section, p, etc.)
    else if (d === 'block') {
        const structuralTags = ['div', 'section', 'article', 'nav', 'header', 'footer', 'main', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
        if (!structuralTags.includes(tag)) {
            classes.push('block')
        }
    }
    else if (d === 'none') classes.push('hidden')

    // Flex/Grid layout
    if (d?.includes('flex')) {
        if (styles.flexDirection === 'column') classes.push('flex-col')
        if (styles.flexDirection === 'row-reverse') classes.push('flex-row-reverse')
        if (styles.justifyContent === 'center') classes.push('justify-center')
        if (styles.justifyContent?.includes('between')) classes.push('justify-between')
        if (styles.alignItems === 'center') classes.push('items-center')
        if (styles.alignItems === 'flex-start') classes.push('items-start')

        const gap = pxToSpacing(styles.gap)
        if (gap) classes.push(`gap-${gap}`)
    }

    // Spacing (Padding/Margin)
    ['p', 'm'].forEach(type => {
        const prefix = type === 'p' ? 'padding' : 'margin'
        const values = {
            t: pxToSpacing(styles[`${prefix}Top`]),
            r: pxToSpacing(styles[`${prefix}Right`]),
            b: pxToSpacing(styles[`${prefix}Bottom`]),
            l: pxToSpacing(styles[`${prefix}Left`]),
        }

        if (values.t && values.t === values.r && values.t === values.b && values.t === values.l) {
            if (values.t && values.t !== '0') classes.push(`${type}-${values.t}`)
        } else {
            if (values.t && values.t !== '0') classes.push(`${type}t-${values.t}`)
            if (values.r && values.r !== '0') classes.push(`${type}r-${values.r}`)
            if (values.b && values.b !== '0') classes.push(`${type}b-${values.b}`)
            if (values.l && values.l !== '0') classes.push(`${type}l-${values.l}`)
        }
    })

    // Typography
    if (styles.fontSize) {
        const size = pxToFontSize(styles.fontSize)
        // Noise Reduction: Skip 'text-base' as it's the default
        if (size && size !== 'base') classes.push(`text-${size}`)
    }
    if (styles.fontWeight) {
        const weight = fontWeightToTailwind(styles.fontWeight)
        // Noise Reduction: Skip 'font-normal' as it's the default
        if (weight && weight !== 'font-normal') classes.push(weight)
    }
    const color = findClosestColor(styles.color)
    // Noise Reduction: Skip white and black if they are defaults for their backgrounds (heuristic)
    if (color && color !== 'white' && color !== 'transparent') classes.push(`text-${color}`)

    if (styles.textAlign === 'center') classes.push('text-center')

    // Background & Borders
    const bg = findClosestColor(styles.backgroundColor)
    if (bg && bg !== 'transparent' && bg !== 'rgba(0,0,0,0)') classes.push(`bg-${bg}`)

    const radius = pxToBorderRadius(styles.borderRadius)
    if (radius) classes.push(radius)

    const borderWidth = parseFloat(styles.borderWidth || '0')
    if (borderWidth > 0) {
        if (borderWidth === 1) classes.push('border')
        else classes.push(`border-[${borderWidth}px]`)

        const bColor = findClosestColor(styles.borderColor)
        if (bColor) classes.push(`border-${bColor}`)
    }

    // Sizing
    if (styles.width?.includes('%')) {
        if (styles.width === '100%') classes.push('w-full')
    }

    // Positioning
    if (styles.position === 'absolute') classes.push('absolute')
    if (styles.position === 'relative') classes.push('relative')
    if (styles.zIndex && styles.zIndex !== 'auto') classes.push(`z-[${styles.zIndex}]`)

    return classes.filter(Boolean)
}

/**
 * Recursively generate JSX from an ElementNode
 */
function nodeToJSX(node: ElementNode, indent: number = 0): string {
    const spaces = '  '.repeat(indent)
    const tag = node.tagName.toLowerCase()

    // Heuristic Tag Deduction
    let finalTag = 'div'
    const validStructuralTags = ['section', 'article', 'nav', 'header', 'footer', 'main', 'aside']
    const validFlowTags = ['p', 'span', 'button', 'a', 'h1', 'h2', 'h3', 'h4', 'img', 'input', 'label']

    if (validStructuralTags.includes(tag) || validFlowTags.includes(tag)) {
        finalTag = tag
    } else if (tag === 'div') {
        // If it's a div but has heading styles, maybe it should be a header or section?
        // For now, we stick to the original if possible, otherwise div
        finalTag = 'div'
    }

    const twClasses = stylesToTailwind(node.styles, finalTag)
    const classString = twClasses.length > 0 ? ` className="${twClasses.join(' ')}"` : ''

    // Handle attributes
    let attrString = ''
    if (finalTag === 'a' && node.attributes.href) attrString += ` href="${node.attributes.href}"`
    if (finalTag === 'img' && node.attributes.src) attrString += ` src="${node.attributes.src}" alt="${node.attributes.alt || ''}"`

    // Noise Reduction: Omit empty decorative elements that have no styles
    if (node.children.length === 0 && twClasses.length === 0 && !attrString) {
        return ''
    }

    if (node.children.length === 0) {
        return `${spaces}<${finalTag}${classString}${attrString} />`
    }

    const childJSX = node.children
        .map(child => {
            if (typeof child === 'string') {
                const trimmed = child.trim()
                return trimmed ? `${spaces}  ${trimmed}` : ''
            }
            return nodeToJSX(child, indent + 1)
        })
        .filter(Boolean)
        .join('\n')

    if (!childJSX) {
        return `${spaces}<${finalTag}${classString}${attrString} />`
    }

    return `${spaces}<${finalTag}${classString}${attrString}>\n${childJSX}\n${spaces}</${finalTag}>`
}

/**
 * Detect interactive elements and suggest React logic
 */
export function inferLogic(node: ElementNode): string {
    const interactions: { type: string; tag: string; label: string }[] = []

    const walk = (n: ElementNode) => {
        const tag = n.tagName.toLowerCase()
        const isButton = tag === 'button' || n.attributes.role === 'button' || (tag === 'a' && n.styles.display?.includes('flex'))
        const isInput = tag === 'input' || tag === 'textarea' || tag === 'select'
        const isLink = tag === 'a' && n.attributes.href

        if (isButton) {
            const label = n.children.find(c => typeof c === 'string') as string || 'Action'
            interactions.push({ type: 'click', tag, label: label.trim() })
        }
        if (isInput) {
            const label = n.attributes.placeholder || n.attributes.name || 'Input'
            interactions.push({ type: 'change', tag, label })
        }
        if (isLink) {
            interactions.push({ type: 'navigation', tag, label: n.attributes.href })
        }

        n.children.forEach(child => {
            if (typeof child !== 'string') walk(child)
        })
    }

    walk(node)

    if (interactions.length === 0) {
        return '// No obvious interactive elements detected.\n// You can still add standard React handlers manually.'
    }

    let code = 'import { useState } from \'react\'\n\n'

    // Generate states
    interactions.forEach((inter, i) => {
        if (inter.type === 'change') {
            const stateName = inter.label.toLowerCase().replace(/[^a-z0-9]/g, '') || `value${i}`
            code += `const [${stateName}, set${stateName[0].toUpperCase()}${stateName.slice(1)}] = useState('')\n`
        }
        if (inter.type === 'click') {
            const stateName = `is${inter.label.replace(/[^a-zA-Z0-9]/g, '')}Active`
            code += `const [${stateName}, set${stateName[0].toUpperCase()}${stateName.slice(1)}] = useState(false)\n`
        }
    })

    code += '\n'

    // Generate handlers
    interactions.forEach((inter) => {
        if (inter.type === 'click') {
            code += `const handle${inter.label.replace(/[^a-zA-Z0-9]/g, '')}Click = () => {\n  console.log('${inter.label} clicked')\n}\n\n`
        }
        if (inter.type === 'change') {
            code += `const handle${inter.label[0].toUpperCase()}${inter.label.slice(1).replace(/[^a-zA-Z0-9]/g, '')}Change = (e) => {\n  set${inter.label[0].toUpperCase()}${inter.label.slice(1).replace(/[^a-zA-Z0-9]/g, '')}(e.target.value)\n}\n\n`
        }
    })

    return code.trim()
}

/**
 * Generate a React component from extracted data
 */
export function generateReactComponent(rootNode: ElementNode): string {
    const componentName = 'Component'
    const content = nodeToJSX(rootNode, 2)

    return `export function ${componentName}() {
  return (
${content}
  )
}`
}
