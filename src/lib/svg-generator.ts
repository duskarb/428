import type { BaziResult, Element } from "./bazi"
import { ELEMENT_LABEL } from "./bazi"

export interface VisualParams {
  lineCount: number
  radialIntensity: number
  centerMass: number
  edgeSharpness: number
  curvature: number
  transparency: number
  contrast: number
  primaryColor: string
  secondaryColor: string
  accentColor: string
  deficientColor: string
  centralChar: string
  objectDepth: number
}

export interface VisualOptions {
  density?: number
  background?: string
  ink?: string
  showText?: boolean
  product?: "stamp" | "poster" | "sticker" | "keyring"
}

const ORDER: Element[] = ["wood", "fire", "earth", "metal", "water"]
const ELEMENT_NAME: Record<Element, string> = {
  wood: "WOOD",
  fire: "FIRE",
  earth: "EARTH",
  metal: "METAL",
  water: "WATER",
}
const PRODUCING: Record<Element, Element> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
}
const OVERCOMING: Record<Element, Element> = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood",
}
const ELEMENT_INDEX: Record<Element, number> = {
  wood: 0,
  fire: 1,
  earth: 2,
  metal: 3,
  water: 4,
}
const SYMBOL_SAFE_SCALE = 0.78

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function pt(cx: number, cy: number, radius: number, angle: number): [number, number] {
  return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]
}

function petalPath(cx: number, cy: number, radius: number, angle: number, width: number): string {
  const [tipX, tipY] = pt(cx, cy, radius, angle)
  const [c1x, c1y] = pt(cx, cy, radius * 0.62, angle - width)
  const [c2x, c2y] = pt(cx, cy, radius * 0.62, angle + width)
  return `M${cx},${cy} C${c1x.toFixed(2)},${c1y.toFixed(2)} ${tipX.toFixed(2)},${tipY.toFixed(2)} ${tipX.toFixed(2)},${tipY.toFixed(2)} C${c2x.toFixed(2)},${c2y.toFixed(2)} ${cx},${cy} ${cx},${cy} Z`
}

function lensPath(cx: number, cy: number, radius: number, angle: number, width: number, inner = 0.24): string {
  const [baseX, baseY] = pt(cx, cy, radius * inner, angle + Math.PI)
  const [tipX, tipY] = pt(cx, cy, radius, angle)
  const [c1x, c1y] = pt(cx, cy, radius * 0.82, angle - width)
  const [c2x, c2y] = pt(cx, cy, radius * 0.82, angle + width)
  const [b1x, b1y] = pt(cx, cy, radius * inner, angle - width * 0.36)
  const [b2x, b2y] = pt(cx, cy, radius * inner, angle + width * 0.36)

  return `M${baseX.toFixed(2)},${baseY.toFixed(2)} C${b1x.toFixed(2)},${b1y.toFixed(2)} ${c1x.toFixed(2)},${c1y.toFixed(2)} ${tipX.toFixed(2)},${tipY.toFixed(2)} C${c2x.toFixed(2)},${c2y.toFixed(2)} ${b2x.toFixed(2)},${b2y.toFixed(2)} ${baseX.toFixed(2)},${baseY.toFixed(2)} Z`
}

function bladePath(cx: number, cy: number, inner: number, outer: number, angle: number, width: number): string {
  const [a, b, c, d] = [
    pt(cx, cy, inner, angle - width * 0.25),
    pt(cx, cy, outer, angle - width),
    pt(cx, cy, outer * 1.05, angle),
    pt(cx, cy, outer, angle + width),
  ]

  return `M${a[0].toFixed(2)},${a[1].toFixed(2)} L${b[0].toFixed(2)},${b[1].toFixed(2)} Q${c[0].toFixed(2)},${c[1].toFixed(2)} ${d[0].toFixed(2)},${d[1].toFixed(2)} L${a[0].toFixed(2)},${a[1].toFixed(2)} Z`
}

function roundedCapsulePath(cx: number, cy: number, length: number, width: number, angle: number): string {
  const [x1, y1] = pt(cx, cy, length / 2, angle)
  const [x2, y2] = pt(cx, cy, length / 2, angle + Math.PI)
  const dx = Math.cos(angle + Math.PI / 2) * width / 2
  const dy = Math.sin(angle + Math.PI / 2) * width / 2

  return `M${(x1 + dx).toFixed(2)},${(y1 + dy).toFixed(2)} A${width / 2},${width / 2} 0 0,1 ${(x1 - dx).toFixed(2)},${(y1 - dy).toFixed(2)} L${(x2 - dx).toFixed(2)},${(y2 - dy).toFixed(2)} A${width / 2},${width / 2} 0 0,1 ${(x2 + dx).toFixed(2)},${(y2 + dy).toFixed(2)} Z`
}

function ringSector(cx: number, cy: number, inner: number, outer: number, start: number, end: number): string {
  const [x1, y1] = pt(cx, cy, outer, start)
  const [x2, y2] = pt(cx, cy, outer, end)
  const [x3, y3] = pt(cx, cy, inner, end)
  const [x4, y4] = pt(cx, cy, inner, start)
  const large = end - start > Math.PI ? 1 : 0
  return `M${x1.toFixed(2)},${y1.toFixed(2)} A${outer},${outer} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} L${x3.toFixed(2)},${y3.toFixed(2)} A${inner},${inner} 0 ${large},0 ${x4.toFixed(2)},${y4.toFixed(2)} Z`
}

function extractStemWeight(result: BaziResult): number {
  const stemCode = result.dayMaster.char.charCodeAt(0)
  return ((stemCode % 7) + 3) / 10
}

function motifPath(element: Element, cx: number, cy: number, radius: number, angle: number, intensity: number): string {
  switch (element) {
    case "wood":
      return lensPath(cx, cy, radius, angle, 0.46 + intensity * 0.16, 0.16)
    case "fire":
      return bladePath(cx, cy, radius * 0.12, radius, angle, 0.28 + intensity * 0.18)
    case "earth":
      return lensPath(cx, cy, radius * 0.92, angle, 0.58, 0.34)
    case "metal":
      return ringSector(cx, cy, radius * 0.52, radius, angle - 0.2 - intensity * 0.06, angle + 0.2 + intensity * 0.06)
    case "water":
      return lensPath(cx, cy, radius, angle + Math.sin(angle * 2) * 0.16, 0.68, 0.22)
  }
}

function elementLayer(result: BaziResult, element: Element, cx: number, cy: number, baseRadius: number, relation: "source" | "producing" | "overcoming", params: VisualParams): string {
  const value = result.elements[element] / 100
  const index = ELEMENT_INDEX[element]
  const relationBoost = relation === "source" ? 1.1 : relation === "producing" ? 0.88 : 0.66
  const count = relation === "overcoming" ? 5 : 4 + index % 2
  const radius = baseRadius * (0.82 + value * 0.6) * relationBoost
  const width = relation === "overcoming" ? 0.28 : 0.42
  let svg = ""

  for (let i = 0; i < count; i++) {
    const base = -Math.PI / 2 + (i / count) * Math.PI * 2
    const angle = base + index * 0.13 + params.contrast * 0.18
    svg += `<path d="${motifPath(element, cx, cy, radius, angle, value)}" fill="${params.secondaryColor}"/>`

    if (relation !== "overcoming") {
      const cutRadius = radius * (0.52 + value * 0.18)
      svg += `<path d="${lensPath(cx, cy, cutRadius, angle + Math.PI / count, width, 0.42)}" fill="${params.primaryColor}"/>`
    }
  }

  return svg
}

export function extractVisualParams(result: BaziResult, options: VisualOptions = {}): VisualParams {
  const density = options.density ?? result.visualSeed.density
  const wood = result.elements.wood / 100
  const fire = result.elements.fire / 100
  const earth = result.elements.earth / 100
  const metal = result.elements.metal / 100
  const water = result.elements.water / 100
  const pillars = [result.pillars.year, result.pillars.month, result.pillars.day, result.pillars.hour].filter(Boolean)
  const yangCount = pillars.filter(pillar => pillar?.stemYinYang === "yang").length

  return {
    lineCount: Math.round(6 + wood * 18 * density),
    radialIntensity: clamp(0.24 + fire * 1.15, 0.2, 1),
    centerMass: clamp(0.28 + earth * 1.1, 0.25, 0.88),
    edgeSharpness: clamp(0.2 + metal * 1.4, 0.2, 1),
    curvature: clamp(0.24 + water * 1.2, 0.2, 1),
    transparency: 0.24 + water * 0.55,
    contrast: pillars.length ? yangCount / pillars.length : 0.5,
    primaryColor: options.background ?? "#f7f7f4",
    secondaryColor: options.ink ?? "#080808",
    accentColor: "#8f8f88",
    deficientColor: "#d8d8d2",
    centralChar: result.dayMaster.char,
    objectDepth: clamp(12 + density * 32 + metal * 24, 14, 64),
  }
}

function symbolParts(result: BaziResult, options: VisualOptions = {}): string {
  const params = extractVisualParams(result, options)
  const cx = 256
  const cy = 256
  const stemWeight = extractStemWeight(result)
  const dominant = result.visualSeed.dominantElement
  const producing = PRODUCING[dominant]
  const overcoming = OVERCOMING[dominant]
  const deficient = result.visualSeed.deficientElement
  const dominantRatio = result.elements[dominant] / 100
  const balanceRadius = 184 + result.visualSeed.balanceScore * 24
  let svg = ""

  ORDER.forEach((element, i) => {
    const value = result.elements[element] / 100
    const start = -Math.PI / 2 + i * (Math.PI * 2 / 5)
    const end = start + (Math.PI * 2 / 5) * clamp(value * 2.7, 0.16, 1)
    const inner = 178 + i * 2
    const outer = inner + 8 + value * 34
    svg += `<path d="${ringSector(cx, cy, inner, outer, start, end)}" fill="${params.secondaryColor}"/>`
  })

  svg += elementLayer(result, dominant, cx, cy, 172, "source", params)
  svg += elementLayer(result, producing, cx, cy, 152, "producing", params)
  svg += elementLayer(result, overcoming, cx, cy, 134, "overcoming", params)

  const sideCount = 5 + Math.round(params.edgeSharpness * 5)
  for (let i = 0; i < sideCount; i++) {
    const angle = (i / sideCount) * Math.PI * 2
    const [x, y] = pt(cx, cy, 78 + params.centerMass * 46, angle + dominantRatio * 0.4)
    const r = 7 + stemWeight * 11
    svg += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}" fill="${params.primaryColor}"/>`
  }

  const axisCount = result.dayMaster.yinYang === "yang" ? 5 : 4
  for (let i = 0; i < axisCount; i++) {
    const angle = -Math.PI / 2 + (i / axisCount) * Math.PI * 2 + stemWeight * 0.2
    svg += `<path d="${roundedCapsulePath(cx, cy, balanceRadius * 1.08, 10 + params.centerMass * 16, angle)}" fill="${params.primaryColor}"/>`
  }

  const deficientIndex = ELEMENT_INDEX[deficient]
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + ((i + deficientIndex * 0.32) / 5) * Math.PI * 2
    const [x, y] = pt(cx, cy, 128 + i * 5, angle)
    svg += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(10 + i * 1.2).toFixed(2)}" fill="${params.primaryColor}"/>`
  }

  svg += `<circle cx="${cx}" cy="${cy}" r="${44 + params.centerMass * 22}" fill="${params.secondaryColor}"/>`
  svg += `<circle cx="${cx}" cy="${cy}" r="${14 + params.curvature * 8}" fill="${params.primaryColor}"/>`

  return svg
}

function containedSymbolParts(result: BaziResult, options: VisualOptions = {}): string {
  return `<g transform="translate(256 256) scale(${SYMBOL_SAFE_SCALE}) translate(-256 -256)">
    ${symbolParts(result, options)}
  </g>`
}

function embeddedSymbolSVG(result: BaziResult, options: VisualOptions, x: number, y: number, size: number): string {
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 512 512" overflow="hidden">
    ${containedSymbolParts(result, options)}
  </svg>`
}

function constructionLines(result: BaziResult, options: VisualOptions = {}): string {
  const params = extractVisualParams(result, options)
  const cx = 560
  const cy = 460
  let svg = ""

  svg += `<rect x="170" y="170" width="640" height="640" fill="none" stroke="${params.accentColor}" stroke-width="0.8"/>`
  svg += `<rect x="220" y="170" width="540" height="640" fill="none" stroke="${params.accentColor}" stroke-width="0.6"/>`
  svg += `<line x1="170" y1="${cy}" x2="810" y2="${cy}" stroke="${params.accentColor}" stroke-width="0.45"/>`
  svg += `<line x1="${cx}" y1="170" x2="${cx}" y2="810" stroke="${params.accentColor}" stroke-width="0.45"/>`
  svg += `<line x1="220" y1="220" x2="760" y2="760" stroke="${params.accentColor}" stroke-width="0.4"/>`
  svg += `<line x1="760" y1="220" x2="220" y2="760" stroke="${params.accentColor}" stroke-width="0.4"/>`

  for (let i = 0; i < params.lineCount; i++) {
    const offset = -270 + (540 / Math.max(1, params.lineCount - 1)) * i
    svg += `<line x1="${cx + offset}" y1="220" x2="${cx + offset}" y2="760" stroke="${params.accentColor}" stroke-width="0.25" opacity="0.55"/>`
  }

  const ringCount = 4 + Math.round(params.centerMass * 4)
  for (let i = 0; i < ringCount; i++) {
    const r = 92 + i * 54
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${params.secondaryColor}" stroke-width="${i === ringCount - 1 ? 1.1 : 0.55}" opacity="${i === ringCount - 1 ? 0.9 : 0.45}"/>`
  }

  return svg
}

function systemGlyph(result: BaziResult, element: Element, x: number, y: number): string {
  const params = extractVisualParams(result, { density: 0.78 })
  const value = result.elements[element] / 100
  const inner = 18
  const outer = 42 + value * 26
  const dominant = result.visualSeed.dominantElement === element
  const count = element === "wood" ? 4 : element === "fire" ? 6 : element === "earth" ? 4 : element === "metal" ? 8 : 5
  let svg = `<g transform="translate(${x} ${y})">`
  svg += `<circle cx="0" cy="0" r="48" fill="none" stroke="${params.secondaryColor}" stroke-width="${dominant ? 2 : 1}"/>`

  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (i / count) * Math.PI * 2
    if (element === "metal") {
      svg += `<path d="${ringSector(0, 0, inner, outer, angle - 0.13, angle + 0.13)}" fill="${params.secondaryColor}"/>`
    } else {
      svg += `<path d="${petalPath(0, 0, outer, angle, element === "water" ? 0.72 : 0.48)}" fill="${params.secondaryColor}"/>`
    }
  }

  if (element === "earth") {
    svg += `<rect x="-20" y="-20" width="40" height="40" fill="${params.primaryColor}"/>`
  } else {
    svg += `<circle cx="0" cy="0" r="${element === "fire" ? 10 : 15}" fill="${params.primaryColor}"/>`
  }
  svg += `</g>`
  return svg
}

export function generateObjectSVG(result: BaziResult, options: VisualOptions = {}): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" overflow="hidden">
    ${containedSymbolParts(result, options)}
  </svg>`
}

export function generateSignatureSVG(result: BaziResult, options: VisualOptions = {}): string {
  const params = extractVisualParams(result, options)
  const showText = options.showText ?? true
  const pillars = [result.pillars.year, result.pillars.month, result.pillars.day, result.pillars.hour]
    .filter(Boolean)
    .map(pillar => `${pillar!.stem}${pillar!.branch}`)
    .join(" ")
  const source = result.input.calendarType === "lunar" ? `LUNAR → SOLAR ${result.input.resolvedSolarDate}` : `SOLAR ${result.input.resolvedSolarDate}`

  let list = ""
  ORDER.forEach((element, i) => {
    const y = 202 + i * 132
    const label = ELEMENT_LABEL[element]
    list += `<line x1="900" y1="${164 + i * 132}" x2="1480" y2="${164 + i * 132}" stroke="${params.accentColor}" stroke-width="0.75"/>`
    list += systemGlyph(result, element, 1060, y + 28)
    list += `<text x="935" y="${y + 40}" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${params.secondaryColor}">${label.code}</text>`
    list += `<text x="1215" y="${y + 24}" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="${params.secondaryColor}">Element ${i + 1} / ${label.name}</text>`
    list += `<text x="1295" y="${y + 64}" font-family="'Courier New', monospace" font-size="18" fill="${params.secondaryColor}">Ratio : ${result.elements[element].toFixed(1)}%</text>`
    list += `<text x="1295" y="${y + 94}" font-family="'Courier New', monospace" font-size="18" fill="${params.secondaryColor}">Key Word : ${label.keyword}</text>`
  })
  list += `<line x1="900" y1="824" x2="1480" y2="824" stroke="${params.accentColor}" stroke-width="0.75"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
    <rect width="1600" height="900" fill="${params.primaryColor}"/>
    ${showText ? `<text x="56" y="62" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="${params.secondaryColor}">C. Graphic System</text>
    <text x="620" y="62" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="${params.secondaryColor}">C-1. Symbol Construction</text>
    <text x="56" y="110" font-family="'Courier New', monospace" font-size="15" fill="${params.accentColor}">4/8 translates the structure of saju palja into a visual system.</text>
    <text x="56" y="134" font-family="'Courier New', monospace" font-size="15" fill="${params.accentColor}">Four pillars and eight characters become symbols, grids, and repeated forms.</text>` : ""}
    ${constructionLines(result, options)}
    ${embeddedSymbolSVG(result, options, 304, 204, 574)}
    <rect x="900" y="170" width="580" height="654" fill="none" stroke="${params.accentColor}" stroke-width="0.85"/>
    ${list}
    ${showText ? `<text x="56" y="805" font-family="'Courier New', monospace" font-size="14" fill="${params.accentColor}">The core motif is built through symmetry, division, and repetition.</text>
    <text x="56" y="830" font-family="'Courier New', monospace" font-size="14" fill="${params.accentColor}">Pillars ${pillars} define the fixed structure; element ratios only change density and aperture.</text>
    <text x="56" y="856" font-family="'Courier New', monospace" font-size="14" fill="${params.accentColor}">${source} / DAY MASTER ${params.centralChar} / DOMINANT ${ELEMENT_NAME[result.visualSeed.dominantElement]} / DEFICIENT ${ELEMENT_NAME[result.visualSeed.deficientElement]}</text>` : ""}
    <text x="1538" y="858" font-family="'Courier New', monospace" font-size="16" fill="${params.secondaryColor}">05</text>
  </svg>`
}

export function generatePosterSVG(result: BaziResult, options: VisualOptions = {}): string {
  const params = extractVisualParams(result, options)
  const showText = options.showText ?? true
  const pillars = [result.pillars.year, result.pillars.month, result.pillars.day, result.pillars.hour]
    .filter(Boolean)
    .map(pillar => `${pillar!.stem}${pillar!.branch}`)
    .join(" ")

  let bars = ""
  ORDER.forEach((element, i) => {
    const y = 1020 + i * 44
    bars += `<text x="92" y="${y + 15}" font-family="'Courier New', monospace" font-size="16" fill="${params.secondaryColor}">${ELEMENT_LABEL[element].code}</text>`
    bars += `<rect x="190" y="${y}" width="${(result.elements[element] * 6).toFixed(1)}" height="18" fill="${params.secondaryColor}"/>`
    bars += `<text x="820" y="${y + 15}" font-family="'Courier New', monospace" font-size="14" fill="${params.accentColor}">${result.elements[element].toFixed(1)}%</text>`
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
    <rect width="1080" height="1350" fill="${params.primaryColor}"/>
    <rect x="60" y="60" width="960" height="1230" fill="none" stroke="${params.accentColor}" stroke-width="1"/>
    ${showText ? `<text x="92" y="120" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="${params.secondaryColor}">PERSONAL VISUAL SYSTEM</text>
    <text x="92" y="158" font-family="'Courier New', monospace" font-size="16" fill="${params.accentColor}">${result.input.resolvedSolarDate} / ${pillars}</text>` : ""}
    ${embeddedSymbolSVG(result, options, 190, 220, 696)}
    <line x1="92" y1="930" x2="988" y2="930" stroke="${params.accentColor}" stroke-width="1"/>
    <text x="92" y="970" font-family="'Courier New', monospace" font-size="16" fill="${params.secondaryColor}">FIVE ELEMENT RATIO</text>
    ${bars}
    <text x="92" y="1260" font-family="'Courier New', monospace" font-size="14" fill="${params.accentColor}">DAY MASTER ${params.centralChar} / DOMINANT ${ELEMENT_NAME[result.visualSeed.dominantElement]} / DEFICIENT ${ELEMENT_NAME[result.visualSeed.deficientElement]}</text>
  </svg>`
}
