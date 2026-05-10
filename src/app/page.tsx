"use client"

import { useRef, useState } from "react"
import type { BaziResult } from "@/lib/bazi"
import { BirthInput } from "@/components/BirthInput"
import { ResultView } from "@/components/ResultView"

type Phase = "landing" | "input" | "loading" | "result"

export default function Home() {
  const [phase, setPhase] = useState<Phase>("landing")
  const [result, setResult] = useState<BaziResult | null>(null)
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleResult(r: BaziResult) {
    if (loadingTimer.current) {
      clearTimeout(loadingTimer.current)
    }
    setResult(r)
    setPhase("loading")
    loadingTimer.current = setTimeout(() => {
      setPhase("result")
      loadingTimer.current = null
    }, 5000)
  }

  function handleReset() {
    if (loadingTimer.current) {
      clearTimeout(loadingTimer.current)
      loadingTimer.current = null
    }
    setResult(null)
    setPhase("input")
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* 상단 바 */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => setPhase("landing")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--fg)",
            fontFamily: "inherit",
            fontSize: "12px",
            letterSpacing: "0.15em",
            padding: 0,
          }}
        >
          사주시각
        </button>
        <div style={{ color: "var(--muted)", fontSize: "10px", letterSpacing: "0.1em" }}>
          GRAPHIC SYSTEM / 4 PILLARS 8 CHARACTERS
        </div>
      </header>

      <main style={{ padding: "48px 32px", maxWidth: "1200px", margin: "0 auto" }}>
        {phase === "landing" && (
          <Landing onStart={() => setPhase("input")} />
        )}

        {phase === "input" && (
          <div style={{ display: "flex", gap: "80px", alignItems: "flex-start" }}>
            {/* 왼쪽: 설명 */}
            <div style={{ flex: 1, paddingTop: "8px" }}>
              <div style={{ color: "var(--muted)", fontSize: "10px", letterSpacing: "0.15em", marginBottom: "24px" }}>
                HOW IT WORKS
              </div>
              <div className="divider" style={{ marginBottom: "24px" }} />
              <div style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 2 }}>
                {[
                  "생년월일시를 입력합니다",
                  "사주팔자(四柱八字)를 계산합니다",
                  "천간·지지·오행 비율을 추출합니다",
                  "오행을 구성선과 반복 도형으로 번역합니다",
                  "SVG와 3D 오브젝트를 생성합니다",
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "4px" }}>
                    <span style={{ color: "var(--border)", fontSize: "10px" }}>0{i + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "40px" }}>
                <div style={{ color: "var(--muted)", fontSize: "10px", letterSpacing: "0.15em", marginBottom: "12px" }}>
                  오행 → 조형 변환 규칙
                </div>
                <div className="divider" style={{ marginBottom: "16px" }} />
                {[
                  ["목(木)", "수직 성장선, 반복 가지 구조"],
                  ["화(火)", "방사형 확산, 높은 대비"],
                  ["토(土)", "사각형 중심 면, 낮은 채도"],
                  ["금(金)", "날카로운 절단선, 원형 구조"],
                  ["수(水)", "곡선 흐름, 투명도, 그라데이션"],
                ].map(([el, rule]) => (
                  <div key={el} style={{ display: "flex", gap: "16px", fontSize: "11px", marginBottom: "6px", color: "var(--muted)" }}>
                    <span style={{ width: "36px", flexShrink: 0 }}>{el}</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 오른쪽: 입력 폼 */}
            <div style={{ width: "320px", flexShrink: 0 }}>
              <BirthInput onResult={handleResult} />
            </div>
          </div>
        )}

        {phase === "loading" && result && (
          <LoadingAnalysis result={result} />
        )}

        {phase === "result" && result && (
          <ResultView result={result} onReset={handleReset} />
        )}
      </main>
    </div>
  )
}

function LoadingAnalysis({ result }: { result: BaziResult }) {
  return (
    <div className="analysis-loading">
      <div className="loading-board">
        <div className="loading-copy">
          <span>CALCULATING / VISUAL TRANSLATION</span>
          <h2>사주 구조를 분석하는 중입니다.</h2>
          <p>
            년주·월주·일주·시주를 확인하고, 오행 비율과 일간의 성질을
            로고의 중심축, 반복 구조, 입체 두께로 변환하고 있습니다.
          </p>
        </div>

        <div className="loading-diagram" aria-hidden="true">
          <i />
          <i />
          <i />
          <b>{result.dayMaster.char}</b>
        </div>
      </div>

      <div className="loading-steps">
        {[
          "EightChar 기준 사주팔자 계산",
          "오행 균형과 부족한 기운 검출",
          "중심 심볼 구조 잠금",
          "3D 압출용 SVG 경로 정리",
          "운세 리딩 문장 생성",
        ].map((step, index) => (
          <div key={step} style={{ animationDelay: `${index * 0.65}s` }}>
            <span>0{index + 1}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ maxWidth: "640px" }}>
      {/* 타이틀 */}
      <div style={{ marginBottom: "64px" }}>
        <div style={{ color: "var(--muted)", fontSize: "10px", letterSpacing: "0.15em", marginBottom: "24px" }}>
          C. GRAPHIC SYSTEM
        </div>

        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 300,
            lineHeight: 1.2,
            letterSpacing: 0,
            marginBottom: "32px",
            color: "var(--fg)",
            fontFamily: "'Courier New', monospace",
          }}
        >
          태어난 시간은<br />
          하나의 도형이<br />
          될 수 있을까
        </h1>

        <div className="divider" style={{ marginBottom: "24px" }} />

        <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 2, maxWidth: "480px" }}>
          이 서비스는 생년월일시로부터 사주팔자를 계산하고,
          오행의 균형과 일간의 성질을 구성선, 반복 도형, 입체 오브젝트로 번역합니다.
          사주는 데이터 입력 방식이고, 결과는 그래픽 시스템입니다.
        </p>
      </div>

      {/* CTA */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <button onClick={onStart} className="btn-primary">
          시작하기
        </button>
        <span style={{ color: "var(--muted)", fontSize: "10px" }}>
          브라우저에서 실행 / 데이터 미저장
        </span>
      </div>

      {/* 하단 예시 */}
      <div style={{ marginTop: "80px" }}>
        <div style={{ color: "var(--muted)", fontSize: "10px", letterSpacing: "0.15em", marginBottom: "16px" }}>
          WHAT YOU GET
        </div>
        <div className="divider" style={{ marginBottom: "16px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[
            ["사주팔자 원본 데이터", "년주·월주·일주·시주, 오행 비율"],
            ["시그니처 문양 SVG", "오행 구조에서 생성된 중심 도형"],
            ["3D 오브젝트", "SVG 심볼을 압출한 회전 미리보기"],
            ["PNG 제작 이미지", "시스템 보드와 포스터 다운로드"],
          ].map(([title, desc]) => (
            <div key={title} style={{ padding: "16px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "11px", color: "var(--fg)", marginBottom: "4px" }}>{title}</div>
              <div style={{ fontSize: "10px", color: "var(--muted)" }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
