# 428

사주시각은 생년월일시를 사주팔자와 오행 데이터로 계산한 뒤, 그 구조를 개인용 그래픽 심볼과 굿즈 미리보기로 변환하는 Next.js 기반 실험 프로젝트입니다.

## Concept

이 프로젝트는 사주를 점술 문장으로만 보여주지 않고, 하나의 시각 언어로 번역합니다.

입력 흐름:

```text
생년월일시 입력
→ 사주팔자 계산
→ 오행 / 일간 / 십성 / 음양 정보 추출
→ 시각 생성 규칙 적용
→ SVG 심볼 생성
→ 3D 오브젝트 미리보기
→ PNG 다운로드
```

## Features

- 양력/음력 생년월일시 입력
- `lunar-javascript` 기반 사주팔자 계산
- 년주, 월주, 일주, 시주 표시
- 오행 비율 및 일간 분석
- 심볼 공개 전 사주 분석 및 운세 화면
- 오행 비율, 강한 기운, 부족한 기운, 일간, 음양을 반영한 SVG 심볼 생성
- Three.js 기반 3D 심볼 미리보기
- 화면 전체 배경에서 회전/부유하는 3D 오브젝트 표현
- 스탬프, 포스터, 스티커, 키링 굿즈 미리보기
- 투명 배경 로고 PNG 다운로드

## Visual System

각 사주 데이터는 다음과 같은 조형 규칙으로 변환됩니다.

| Data | Visual Translation |
| --- | --- |
| 목(木) | 수직 성장선, 분기, 반복 축 |
| 화(火) | 방사형 개구부, 확산, 강한 대비 |
| 토(土) | 중심 면적, 안정적인 구조, 밀도 |
| 금(金) | 절단 각도, 외곽선, 금속성 축 |
| 수(水) | 곡률, 흐름, 투명도, 여백 |
| 일간 | 중심 문자와 핵심 골격 |
| 음양 비율 | 대비, 반복성, 회전 축 |
| 부족한 오행 | 여백과 보정 포인트 |

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Three.js
- lunar-javascript
- SVG generator

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Project Structure

```text
src/app/page.tsx                    main flow
src/components/BirthInput.tsx        birth data input
src/components/ResultView.tsx        analysis, visual system, goods preview
src/components/ThreeObjectPreview.tsx 3D SVG extrusion preview
src/lib/bazi.ts                      saju calculation and data mapping
src/lib/svg-generator.ts             algorithmic SVG symbol generator
```

