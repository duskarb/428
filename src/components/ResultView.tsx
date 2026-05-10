"use client"

import { useMemo, useState } from "react"
import type { BaziResult, Element } from "@/lib/bazi"
import { ELEMENT_KR, ELEMENT_LABEL, STEM_KR } from "@/lib/bazi"
import { generateObjectSVG, generatePosterSVG, generateSignatureSVG, type VisualOptions } from "@/lib/svg-generator"
import { ThreeObjectPreview } from "@/components/ThreeObjectPreview"

interface Props {
  result: BaziResult
  onReset: () => void
}

const ELEMENT_ORDER: Element[] = ["wood", "fire", "earth", "metal", "water"]

const ELEMENT_RULE: Record<Element, string> = {
  wood: "수직 성장선과 분기되는 반복 축",
  fire: "방사형 개구부와 강한 대비",
  earth: "중앙 면적과 안정적인 사각 구조",
  metal: "절단 각도와 두꺼운 외곽 구조",
  water: "곡률, 여백, 유동적인 간격",
}

const PRODUCT_LABEL: Record<NonNullable<VisualOptions["product"]>, string> = {
  stamp: "시그니처 스탬프",
  poster: "퍼스널 차트 포스터",
  sticker: "스티커 시트",
  keyring: "아크릴 키링",
}

export function ResultView({ result, onReset }: Props) {
  const [revealed, setRevealed] = useState(false)
  const [activeTab, setActiveTab] = useState<"system" | "poster">("system")
  const [density, setDensity] = useState(Math.round(result.visualSeed.density * 100))
  const [background, setBackground] = useState("#f7f7f4")
  const [ink, setInk] = useState("#080808")
  const [showText, setShowText] = useState(true)
  const [product, setProduct] = useState<NonNullable<VisualOptions["product"]>>("stamp")

  const visualOptions = useMemo<VisualOptions>(() => ({
    density: density / 100,
    background,
    ink,
    showText,
    product,
  }), [background, density, ink, product, showText])

  const svgContent = useMemo(() => (
    activeTab === "system"
      ? generateSignatureSVG(result, visualOptions)
      : generatePosterSVG(result, visualOptions)
  ), [activeTab, result, visualOptions])
  const objectSvg = useMemo(() => generateObjectSVG(result, visualOptions), [result, visualOptions])
  const fortunes = useMemo(() => buildFortunes(result), [result])

  async function downloadPNG() {
    const logoSvg = generateObjectSVG(result, visualOptions)
    const image = new Image()
    const svgBlob = new Blob([logoSvg], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = reject
      image.src = url
    })

    const scale = 3
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)

    removeBackgroundPixels(ctx, canvas.width, canvas.height, background)

    const pngUrl = canvas.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = pngUrl
    a.download = `saju-logo-${result.input.resolvedSolarDate}.png`
    a.click()
  }

  const { pillars, elements, dayMaster, visualSeed } = result
  const pillarList = [
    { label: "년주", pillar: pillars.year },
    { label: "월주", pillar: pillars.month },
    { label: "일주", pillar: pillars.day },
    { label: "시주", pillar: pillars.hour },
  ].filter(item => item.pillar)

  const explanations = [
    `${ELEMENT_KR[visualSeed.dominantElement]}이 강하기 때문에 ${ELEMENT_RULE[visualSeed.dominantElement]}가 확장되었습니다.`,
    `${ELEMENT_KR[visualSeed.deficientElement]}은 낮은 비율로 남겨 보정색 대신 여백과 작은 기준점으로 표시했습니다.`,
    `일간 ${dayMaster.char}(${STEM_KR[dayMaster.char]})은 바꿀 수 없는 중심 문자와 3D 오브젝트의 골격입니다.`,
  ]

  return (
    <div className={`result-shell ${revealed ? "has-symbol-background" : ""}`}>
      {revealed && <ThreeObjectPreview result={result} options={visualOptions} presentation="background" />}

      <div className="top-nav">
        <button onClick={onReset} className="btn-secondary">
          다시 입력
        </button>
        <div className="meta-line">
          {result.input.calendarType === "lunar" ? "음력" : "양력"} {result.input.birthDate}
          {" / "}
          기준 양력 {result.input.resolvedSolarDate}
        </div>
      </div>

      <div className="result-grid">
        <aside className="data-panel">
          <SectionTitle index="01" title="사주팔자" />
          <div className="pillar-grid">
            {pillarList.map(({ label, pillar }) => (
              <div key={label} className="pillar-cell">
                <span className="label">{label}</span>
                <strong>{pillar!.stem}</strong>
                <em>{pillar!.branch}</em>
                <small>{pillar!.tenGod}</small>
              </div>
            ))}
          </div>

          <div className="day-master">
            <span className="label">DAY MASTER</span>
            <div>
              <strong>{dayMaster.char}</strong>
              <span>{STEM_KR[dayMaster.char]}</span>
            </div>
          </div>

          <SectionTitle index="02" title="오행 비율" />
          <div className="element-bars">
            {ELEMENT_ORDER.map(element => (
              <div key={element} className="element-row">
                <span>{ELEMENT_LABEL[element].code}</span>
                <div>
                  <i style={{ width: `${elements[element]}%` }} />
                </div>
                <b>{elements[element].toFixed(1)}</b>
              </div>
            ))}
          </div>

          <div className="facts">
            <span>강한 기운: {ELEMENT_KR[visualSeed.dominantElement]}</span>
            <span>부족한 기운: {ELEMENT_KR[visualSeed.deficientElement]}</span>
            <span>계산: EightChar 절기 기준</span>
          </div>

          <SectionTitle index="03" title="번역 규칙" />
          <div className="explain-list">
            {explanations.map(item => <p key={item}>{item}</p>)}
          </div>

          <p className="calculation-note">{result.input.calculationNote}</p>
        </aside>

        {!revealed ? (
          <main className="reading-panel">
            <SectionTitle index="04" title="사주 분석 및 운세" />
            <div className="reading-hero">
              <span>ANALYSIS BEFORE SYMBOL</span>
              <h2>아직 심볼은 공개하지 않았습니다.</h2>
              <p>
                먼저 네 기둥과 오행의 흐름을 읽고, 그 결과가 어떤 조형 규칙으로
                바뀌는지 확인합니다. 심볼은 이 분석을 통과한 뒤에 열립니다.
              </p>
            </div>

            <div className="fortune-grid">
              {fortunes.map(item => (
                <article key={item.title} className="fortune-card">
                  <span>{item.kicker}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>

            <div className="locked-logo">
              <div>
                <span>LOCKED SYMBOL</span>
                <strong>{dayMaster.char}</strong>
                <p>중심 문양 구조, 오행 비율, 일간 기반 형태는 고정됩니다.</p>
              </div>
              <button onClick={() => setRevealed(true)} className="btn-primary">
                나만의 심볼 보기
              </button>
            </div>
          </main>
        ) : (
          <>
            <main className="visual-panel">
              <div className="visual-toolbar">
                <div className="tab-list">
                  {(["system", "poster"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={activeTab === tab ? "is-active" : ""}
                    >
                      {tab === "system" ? "시스템 보드" : "포스터"}
                    </button>
                  ))}
                </div>
                <button onClick={downloadPNG} className="btn-primary">
                  로고 PNG 다운로드
                </button>
              </div>

              <div className="svg-stage" dangerouslySetInnerHTML={{ __html: svgContent }} />
            </main>

            <aside className="preview-panel">
              <SectionTitle index="04" title="제어" />
              <div className="control-stack">
                <label>
                  <span>밀도</span>
                  <input
                    type="range"
                    min="35"
                    max="100"
                    value={density}
                    onChange={event => setDensity(Number(event.target.value))}
                  />
                </label>

                <label>
                  <span>굿즈</span>
                  <select value={product} onChange={event => setProduct(event.target.value as NonNullable<VisualOptions["product"]>)}>
                    <option value="stamp">도장</option>
                    <option value="poster">포스터</option>
                    <option value="sticker">스티커</option>
                    <option value="keyring">키링</option>
                  </select>
                </label>

                <label>
                  <span>배경</span>
                  <select value={background} onChange={event => setBackground(event.target.value)}>
                    <option value="#f7f7f4">Warm White</option>
                    <option value="#ffffff">Pure White</option>
                    <option value="#ecebe4">Paper Gray</option>
                  </select>
                </label>

                <label>
                  <span>잉크</span>
                  <select value={ink} onChange={event => setInk(event.target.value)}>
                    <option value="#080808">Black</option>
                    <option value="#2c2c2c">Graphite</option>
                    <option value="#5a1d1d">Seal Red</option>
                  </select>
                </label>

                <label className="check-row">
                  <input type="checkbox" checked={showText} onChange={event => setShowText(event.target.checked)} />
                  <span>텍스트 표시</span>
                </label>
              </div>

              <div className={`product-card product-${product}`}>
                <span>{PRODUCT_LABEL[product]}</span>
                <div className="product-mockup">
                  <div className="product-symbol" dangerouslySetInnerHTML={{ __html: objectSvg }} />
                </div>
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  )
}

function removeBackgroundPixels(ctx: CanvasRenderingContext2D, width: number, height: number, color: string) {
  const bg = hexToRgb(color)
  if (!bg) return

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const tolerance = 42

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]
    if (alpha === 0) continue

    const distance =
      Math.abs(data[i] - bg.r) +
      Math.abs(data[i + 1] - bg.g) +
      Math.abs(data[i + 2] - bg.b)

    if (distance < tolerance) {
      data[i + 3] = 0
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace("#", "").trim()
  if (normalized.length !== 6) return null

  const value = Number.parseInt(normalized, 16)
  if (Number.isNaN(value)) return null

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

function buildFortunes(result: BaziResult) {
  const dominant = result.visualSeed.dominantElement
  const deficient = result.visualSeed.deficientElement
  const day = result.dayMaster
  const balance = result.visualSeed.balanceScore

  const temperament: Record<Element, string> = {
    wood: "성장과 확장을 향해 움직이는 힘이 강합니다. 새로운 일을 시작할 때 속도가 붙지만, 가지가 너무 많이 뻗으면 기준선이 흐려질 수 있습니다.",
    fire: "표현과 반응의 기운이 앞에 섭니다. 사람 앞에서 빛나는 힘이 있지만, 빠른 판단 뒤에는 반드시 식히는 시간이 필요합니다.",
    earth: "축적하고 안정시키는 힘이 강합니다. 오래 들고 갈 구조를 잘 만들지만, 익숙한 방식에 머무르면 전환이 느려질 수 있습니다.",
    metal: "정리하고 자르는 힘이 선명합니다. 기준을 세우는 감각이 좋지만, 지나친 선명함은 주변의 부드러운 신호를 놓치게 할 수 있습니다.",
    water: "흐름을 읽고 우회하는 힘이 좋습니다. 상황을 유연하게 받아들이지만, 방향을 정하지 않으면 가능성이 흩어질 수 있습니다.",
  }

  const supplement: Record<Element, string> = {
    wood: "목(木)이 부족하므로 계획을 실제 행동으로 세우는 반복 루틴이 보완점입니다.",
    fire: "화(火)가 부족하므로 결과를 밖으로 드러내고 말하는 시간이 운을 엽니다.",
    earth: "토(土)가 부족하므로 기록, 정리, 보관처럼 중심을 잡는 습관이 필요합니다.",
    metal: "금(金)이 부족하므로 선택지를 줄이고 기준을 명확히 세울수록 흐름이 좋아집니다.",
    water: "수(水)가 부족하므로 쉬는 시간, 거리두기, 정보 흡수가 균형을 만듭니다.",
  }

  const todayFlow = balance > 0.72
    ? "오행 균형이 비교적 안정적입니다. 오늘의 운은 크게 벌리기보다 이미 있는 구조를 다듬을 때 좋습니다."
    : "오행의 편차가 있는 편입니다. 오늘은 강한 기운을 더 밀기보다 부족한 기운을 의식적으로 보완할 때 안정됩니다."

  return [
    {
      kicker: "BASIC READING",
      title: `일간 ${day.char}의 성향`,
      body: `${STEM_KR[day.char]}의 일간입니다. 이 기둥은 로고의 중심축이 되며, 판단과 표현 방식의 기본 성질을 정합니다.`,
    },
    {
      kicker: "ENERGY",
      title: `강한 기운: ${ELEMENT_KR[dominant]}`,
      body: temperament[dominant],
    },
    {
      kicker: "BALANCE",
      title: `보완할 기운: ${ELEMENT_KR[deficient]}`,
      body: supplement[deficient],
    },
    {
      kicker: "FORTUNE",
      title: "오늘의 운세",
      body: todayFlow,
    },
  ]
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <div className="section-title">
      <span>{index} / {title}</span>
      <i />
    </div>
  )
}
