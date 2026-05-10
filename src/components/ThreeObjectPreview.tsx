"use client"

import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js"
import type { BaziResult } from "@/lib/bazi"
import { extractVisualParams, generateObjectSVG, type VisualOptions } from "@/lib/svg-generator"

interface Props {
  result: BaziResult
  options: VisualOptions
  presentation?: "panel" | "background"
}

export function ThreeObjectPreview({ result, options, presentation = "panel" }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const svg = useMemo(() => generateObjectSVG(result, options), [result, options])
  const params = useMemo(() => extractVisualParams(result, options), [result, options])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const container = mount

    const scene = new THREE.Scene()
    scene.background = presentation === "panel" ? new THREE.Color(params.primaryColor) : null

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 2200)
    camera.position.set(0, 0, presentation === "panel" ? 620 : 1040)
    camera.lookAt(0, 0, 0)

    const probe = document.createElement("canvas")
    const canUseWebgl = Boolean(probe.getContext("webgl2") || probe.getContext("webgl"))
    if (!canUseWebgl) {
      const fallback = document.createElement("div")
      fallback.className = "three-fallback"
      fallback.innerHTML = svg
      container.appendChild(fallback)

      return () => {
        container.removeChild(fallback)
      }
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: presentation === "background" })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    if (presentation === "background") {
      renderer.setClearColor(0xffffff, 0)
    }
    container.appendChild(renderer.domElement)

    const key = new THREE.DirectionalLight("#ffffff", 2.2)
    key.position.set(160, -180, 260)
    scene.add(key)
    const fill = new THREE.AmbientLight("#ffffff", 1.4)
    scene.add(fill)

    const root = new THREE.Group()
    scene.add(root)

    const loader = new SVGLoader()
    const data = loader.parse(svg)
    const material = new THREE.MeshBasicMaterial({
      color: params.secondaryColor,
      side: THREE.DoubleSide,
    })

    let meshCount = 0
    for (const path of data.paths) {
      const fillStyle = String(path.userData?.style?.fill ?? params.secondaryColor).toLowerCase()
      if (fillStyle === "none" || fillStyle === params.primaryColor.toLowerCase()) continue

      const shapes = SVGLoader.createShapes(path)
      for (const shape of shapes) {
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: params.objectDepth,
          bevelEnabled: true,
          bevelThickness: 3.2,
          bevelSize: 2.8,
          bevelSegments: 5,
        })
        geometry.computeVertexNormals()
        root.add(new THREE.Mesh(geometry, material))
        meshCount += 1
      }
    }

    if (meshCount === 0) {
      const fallback = document.createElement("div")
      fallback.className = "three-fallback"
      fallback.innerHTML = svg
      renderer.dispose()
      material.dispose()
      container.removeChild(renderer.domElement)
      container.appendChild(fallback)

      return () => {
        container.removeChild(fallback)
      }
    }

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.9
    controls.minDistance = 220
    controls.maxDistance = 620
    controls.target.set(0, 0, 0)
    controls.update()

    const box = new THREE.Box3().setFromObject(root)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    root.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.translate(-center.x, -center.y, -center.z)
      }
    })
    root.position.set(0, 0, 0)
    root.scale.multiplyScalar((presentation === "panel" ? 220 : 320) / Math.max(size.x, size.y, size.z))
    root.rotation.z = -0.08
    root.rotation.x = presentation === "background" ? -0.16 : 0

    function resize() {
      const width = container.clientWidth
      const height = container.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    let frame = 0
    function animate() {
      controls.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }

    resize()
    animate()
    window.addEventListener("resize", resize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
      controls.dispose()
      renderer.dispose()
      material.dispose()
      root.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
        }
      })
      container.removeChild(renderer.domElement)
    }
  }, [svg, params, result.visualSeed.primaryElement, presentation])

  return (
    <div
      ref={mountRef}
      className={`three-preview ${presentation === "background" ? "is-background" : ""}`}
      aria-hidden={presentation === "background"}
      aria-label={presentation === "panel" ? "3D 시그니처 오브젝트 미리보기" : undefined}
    />
  )
}
