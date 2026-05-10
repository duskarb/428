import { Lunar, Solar } from "lunar-javascript"

export type Element = "wood" | "fire" | "earth" | "metal" | "water"
export type YinYang = "yin" | "yang"

export interface Pillar {
  stem: string
  branch: string
  stemElement: Element
  branchElement: Element
  stemYinYang: YinYang
  tenGod: string
}

export interface BaziResult {
  input: {
    birthDate: string
    birthHour: number | null
    calendarType: "solar" | "lunar"
    resolvedSolarDate: string
    calculationNote: string
  }
  pillars: {
    year: Pillar
    month: Pillar
    day: Pillar
    hour: Pillar | null
  }
  elements: Record<Element, number>
  dayMaster: {
    stem: string
    element: Element
    yinYang: YinYang
    char: string
  }
  visualSeed: {
    primaryElement: Element
    deficientElement: Element
    dominantElement: Element
    balanceScore: number
    density: number
    symmetry: number
  }
}

const STEM_ELEMENTS: Record<string, Element> = {
  甲: "wood",
  乙: "wood",
  丙: "fire",
  丁: "fire",
  戊: "earth",
  己: "earth",
  庚: "metal",
  辛: "metal",
  壬: "water",
  癸: "water",
}

const STEM_YIN_YANG: Record<string, YinYang> = {
  甲: "yang",
  乙: "yin",
  丙: "yang",
  丁: "yin",
  戊: "yang",
  己: "yin",
  庚: "yang",
  辛: "yin",
  壬: "yang",
  癸: "yin",
}

const BRANCH_ELEMENTS: Record<string, Element> = {
  子: "water",
  丑: "earth",
  寅: "wood",
  卯: "wood",
  辰: "earth",
  巳: "fire",
  午: "fire",
  未: "earth",
  申: "metal",
  酉: "metal",
  戌: "earth",
  亥: "water",
}

const CHINESE_ELEMENT: Record<string, Element> = {
  木: "wood",
  火: "fire",
  土: "earth",
  金: "metal",
  水: "water",
}

function makePillar(ganzhi: string, tenGod: string): Pillar {
  const stem = ganzhi[0]
  const branch = ganzhi[1]

  return {
    stem,
    branch,
    stemElement: STEM_ELEMENTS[stem],
    branchElement: BRANCH_ELEMENTS[branch],
    stemYinYang: STEM_YIN_YANG[stem],
    tenGod,
  }
}

function normalizeElementRatio(counts: Record<Element, number>): Record<Element, number> {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0)
  return (Object.keys(counts) as Element[]).reduce((acc, element) => {
    acc[element] = total === 0 ? 0 : Math.round((counts[element] / total) * 1000) / 10
    return acc
  }, {} as Record<Element, number>)
}

function calcElements(pillars: Pillar[]): Record<Element, number> {
  const counts: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }

  for (const pillar of pillars) {
    counts[pillar.stemElement] += 2
    counts[pillar.branchElement] += 1
  }

  return normalizeElementRatio(counts)
}

export function calculateBazi(
  year: number,
  month: number,
  day: number,
  hour: number | null,
  calendarType: "solar" | "lunar" = "solar"
): BaziResult {
  const calculationHour = hour ?? 12
  const lunar = calendarType === "solar"
    ? Solar.fromYmdHms(year, month, day, calculationHour, 0, 0).getLunar()
    : Lunar.fromYmdHms(year, month, day, calculationHour, 0, 0)
  const solar = lunar.getSolar()
  const eightChar = lunar.getEightChar()

  const yearPillar = makePillar(eightChar.getYear(), eightChar.getYearShiShenGan())
  const monthPillar = makePillar(eightChar.getMonth(), eightChar.getMonthShiShenGan())
  const dayPillar = makePillar(eightChar.getDay(), eightChar.getDayShiShenGan())
  const hourPillar = hour === null ? null : makePillar(eightChar.getTime(), eightChar.getTimeShiShenGan())
  const activePillars = [yearPillar, monthPillar, dayPillar, hourPillar].filter(Boolean) as Pillar[]
  const elements = calcElements(activePillars)
  const elementEntries = Object.entries(elements) as [Element, number][]
  const sorted = [...elementEntries].sort((a, b) => b[1] - a[1])
  const dominantElement = sorted[0][0]
  const deficientElement = sorted[sorted.length - 1][0]
  const ideal = 20
  const variance = elementEntries.reduce((sum, [, value]) => sum + Math.pow(value - ideal, 2), 0) / 5
  const balanceScore = Math.max(0, 1 - Math.sqrt(variance) / 20)
  const dayStem = eightChar.getDayGan()
  const yinCount = activePillars.filter(pillar => pillar.stemYinYang === "yin").length
  const density = Math.max(0.25, Math.min(1, elements[dominantElement] / 38))

  return {
    input: {
      birthDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      birthHour: hour,
      calendarType,
      resolvedSolarDate: solar.toYmd(),
      calculationNote: hour === null
        ? "출생 시간을 모를 경우 일주와 월주 검토를 위해 정오 기준으로 계산하고 시주는 제외합니다."
        : "lunar-javascript EightChar 기준으로 양력/음력 변환과 절기 기반 월주를 계산합니다.",
    },
    pillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
    },
    elements,
    dayMaster: {
      stem: dayStem,
      element: CHINESE_ELEMENT[eightChar.getDayWuXing()[0]] ?? STEM_ELEMENTS[dayStem],
      yinYang: STEM_YIN_YANG[dayStem],
      char: dayStem,
    },
    visualSeed: {
      primaryElement: STEM_ELEMENTS[dayStem],
      deficientElement,
      dominantElement,
      balanceScore,
      density,
      symmetry: yinCount / activePillars.length,
    },
  }
}

export const ELEMENT_KR: Record<Element, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
}

export const ELEMENT_LABEL: Record<Element, { code: string; name: string; keyword: string }> = {
  wood: { code: "A / 木", name: "WOOD", keyword: "Bloom" },
  fire: { code: "B / 火", name: "FIRE", keyword: "Burn" },
  earth: { code: "C / 土", name: "EARTH", keyword: "Solid" },
  metal: { code: "D / 金", name: "METAL", keyword: "Sharp" },
  water: { code: "E / 水", name: "WATER", keyword: "Flow" },
}

export const ELEMENT_COLORS: Record<Element, { primary: string; secondary: string; accent: string }> = {
  wood: { primary: "#f8f8f6", secondary: "#111111", accent: "#9b9b95" },
  fire: { primary: "#f8f8f6", secondary: "#111111", accent: "#9b9b95" },
  earth: { primary: "#f8f8f6", secondary: "#111111", accent: "#9b9b95" },
  metal: { primary: "#f8f8f6", secondary: "#111111", accent: "#9b9b95" },
  water: { primary: "#f8f8f6", secondary: "#111111", accent: "#9b9b95" },
}

export const STEM_KR: Record<string, string> = {
  甲: "갑(甲) / 양목",
  乙: "을(乙) / 음목",
  丙: "병(丙) / 양화",
  丁: "정(丁) / 음화",
  戊: "무(戊) / 양토",
  己: "기(己) / 음토",
  庚: "경(庚) / 양금",
  辛: "신(辛) / 음금",
  壬: "임(壬) / 양수",
  癸: "계(癸) / 음수",
}
