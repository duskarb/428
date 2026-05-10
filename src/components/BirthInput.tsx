"use client"

import { useState } from "react"
import type { BaziResult } from "@/lib/bazi"
import { calculateBazi } from "@/lib/bazi"

interface Props {
  onResult: (result: BaziResult) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function BirthInput({ onResult }: Props) {
  const [year, setYear] = useState("")
  const [month, setMonth] = useState("")
  const [day, setDay] = useState("")
  const [hour, setHour] = useState<string>("")
  const [unknownHour, setUnknownHour] = useState(false)
  const [calendar, setCalendar] = useState<"solar" | "lunar">("solar")
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const y = parseInt(year)
    const m = parseInt(month)
    const d = parseInt(day)

    if (!y || y < 1900 || y > 2100) {
      setError("연도를 확인해주세요 (1900–2100)")
      return
    }
    if (!m || m < 1 || m > 12) {
      setError("월을 확인해주세요 (1–12)")
      return
    }
    if (!d || d < 1 || d > 31) {
      setError("일을 확인해주세요 (1–31)")
      return
    }

    const date = new Date(y, m - 1, d)
    if (calendar === "solar" && (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d)) {
      setError("존재하는 날짜를 입력해주세요.")
      return
    }

    const h = unknownHour ? null : (hour === "" ? null : parseInt(hour))

    try {
      const result = calculateBazi(y, m, d, h, calendar)
      onResult(result)
    } catch {
      setError("계산 중 오류가 발생했습니다. 날짜를 다시 확인해주세요.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      {/* 헤더 */}
      <div className="mb-12">
        <div style={{ color: "var(--muted)", fontSize: "10px", letterSpacing: "0.15em" }} className="mb-3">
          INPUT / 생년월일시
        </div>
        <div className="divider" />
      </div>

      {/* 양력/음력 */}
      <div className="mb-8">
        <span className="label">역법</span>
        <div className="flex gap-6">
          {(["solar", "lunar"] as const).map(c => (
            <label key={c} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: "12px" }}>
              <input
                type="radio"
                name="calendar"
                value={c}
                checked={calendar === c}
                onChange={() => setCalendar(c)}
              />
              {c === "solar" ? "양력" : "음력"}
            </label>
          ))}
        </div>
      </div>

      {/* 연도 */}
      <div className="mb-6">
        <span className="label">연도</span>
        <input
          type="number"
          placeholder="1990"
          value={year}
          onChange={e => setYear(e.target.value)}
          min={1900}
          max={2100}
        />
      </div>

      {/* 월 / 일 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <span className="label">월</span>
          <input
            type="number"
            placeholder="1–12"
            value={month}
            onChange={e => setMonth(e.target.value)}
            min={1}
            max={12}
          />
        </div>
        <div>
          <span className="label">일</span>
          <input
            type="number"
            placeholder="1–31"
            value={day}
            onChange={e => setDay(e.target.value)}
            min={1}
            max={31}
          />
        </div>
      </div>

      {/* 시간 */}
      <div className="mb-8">
        <span className="label">출생 시간 (선택)</span>
        <div className="flex items-center gap-4 mb-3">
          <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: "12px" }}>
            <input
              type="checkbox"
              checked={unknownHour}
              onChange={e => setUnknownHour(e.target.checked)}
              style={{ accentColor: "var(--accent)" }}
            />
            시간 모름
          </label>
        </div>
        {!unknownHour && (
          <select
            value={hour}
            onChange={e => setHour(e.target.value)}
            style={{ color: hour === "" ? "var(--muted)" : "var(--fg)" }}
          >
            <option value="">시간 선택</option>
            {HOURS.map(h => (
              <option key={h} value={h} style={{ background: "#0a0a0a" }}>
                {String(h).padStart(2, "0")}시 ({getShichen(h)})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 에러 */}
      {error && (
        <div className="mb-4" style={{ color: "#c84427", fontSize: "11px" }}>
          {error}
        </div>
      )}

      {/* 제출 */}
      <button type="submit" className="btn-primary w-full">
        시각 번역 시작
      </button>

      <div className="mt-6 divider" />
      <div className="mt-4" style={{ color: "var(--muted)", fontSize: "10px", lineHeight: 1.8 }}>
        입력값은 서버에 저장되지 않습니다.<br />
        계산은 lunar-javascript EightChar 기준으로 실행됩니다.
      </div>
    </form>
  )
}

function getShichen(hour: number): string {
  const shichen = ["자", "자", "축", "축", "인", "인", "묘", "묘", "진", "진", "사", "사",
                   "오", "오", "미", "미", "신", "신", "유", "유", "술", "술", "해", "해"]
  const chars = ["子", "子", "丑", "丑", "寅", "寅", "卯", "卯", "辰", "辰", "巳", "巳",
                 "午", "午", "未", "未", "申", "申", "酉", "酉", "戌", "戌", "亥", "亥"]
  return `${shichen[hour]}시 ${chars[hour]}`
}
