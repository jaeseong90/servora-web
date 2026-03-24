'use client'

import { useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Script from 'next/script'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const heroUiRef = useRef<HTMLDivElement>(null)
  const brandHeroRef = useRef<HTMLDivElement>(null)
  const featDriverRef = useRef<HTMLDivElement>(null)
  const gsapLoaded = useRef(false)

  const initFeatures = useCallback(() => {
    const driver = featDriverRef.current
    if (!driver) return
    const items = Array.from(document.querySelectorAll('.feat-item'))
    const panels = Array.from(document.querySelectorAll('.feat-panel'))
    const NAV = 58
    let cur = -1

    function setActive(idx: number) {
      idx = Math.max(0, Math.min(items.length - 1, idx))
      if (idx === cur) return
      cur = idx
      items.forEach((el, i) => el.classList.toggle('active', i === idx))
      panels.forEach((el, i) => el.classList.toggle('active', i === idx))
    }

    setActive(0)

    function getRange() {
      const driverTop = driver!.getBoundingClientRect().top + window.scrollY
      const driverH = driver!.offsetHeight
      const viewH = window.innerHeight
      const start = driverTop - NAV
      const end = driverTop + driverH - viewH
      return { start, end, range: end - start }
    }

    function tick() {
      const { start, range } = getRange()
      const progress = Math.max(0, Math.min(1, (window.scrollY - start) / range))
      setActive(Math.min(items.length - 1, Math.floor(progress * items.length)))
    }

    window.addEventListener('scroll', tick, { passive: true })
    window.addEventListener('resize', tick, { passive: true })
    tick()

    items.forEach((el, i) => {
      el.addEventListener('click', () => {
        const { start, range } = getRange()
        const segH = range / items.length
        const target = start + i * segH + 1
        window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
      })
    })

    return () => {
      window.removeEventListener('scroll', tick)
      window.removeEventListener('resize', tick)
    }
  }, [])

  const initGsapAnimations = useCallback(() => {
    const gsap = (window as any).gsap
    const ScrollTrigger = (window as any).ScrollTrigger
    if (!gsap || !ScrollTrigger) return

    gsap.registerPlugin(ScrollTrigger)

    // Use case cards entrance
    document.querySelectorAll('.cc').forEach((el: any, i: number) => {
      gsap.fromTo(el,
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', delay: i * 0.06,
          scrollTrigger: { trigger: '#cases', start: 'top 76%' }
        }
      )
    })

    // Trust stats entrance - slot-machine counter
    ScrollTrigger.create({
      trigger: '#trust',
      start: 'top 72%',
      once: true,
      onEnter() {
        document.querySelectorAll('.ts-v').forEach(function (el: any, idx: number) {
          const raw = el.textContent.trim()
          const m = raw.match(/^([\d,]+)(\+|%)?$/)
          if (!m) {
            gsap.fromTo(el, { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.5, delay: idx * 0.15, ease: 'power2.out' })
            return
          }

          const target = parseInt(m[1].replace(/,/g, ''), 10)
          const suffix = m[2] || ''
          const hasComma = m[1].indexOf(',') !== -1

          function fmt(n: number) {
            let s = String(Math.round(n))
            if (hasComma) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            return s + suffix
          }

          el.textContent = fmt(0)
          gsap.set(el, { opacity: 0, y: 40 })

          const delay = idx * 0.15

          gsap.to(el, {
            opacity: 1, y: 0,
            duration: 0.6,
            delay: delay,
            ease: 'power3.out',
          })

          const obj = { val: 0 }
          gsap.to(obj, {
            val: target,
            duration: 1.3,
            delay: delay,
            ease: 'power2.out',
            onUpdate: function () { el.textContent = fmt(obj.val) },
            onComplete: function () { el.textContent = raw }
          })
        })
      }
    })
  }, [])

  const initBrandHero = useCallback(() => {
    const gsap = (window as any).gsap
    if (!gsap || !canvasRef.current || !svgRef.current || !heroUiRef.current) return

    // BHBlobRenderer class
    class BHBlobRenderer {
      canvas: HTMLCanvasElement
      ctx: CanvasRenderingContext2D
      opacity: number
      dissolve: number
      _time: number
      cx: number
      cy: number
      radius: number
      _layers: any[]
      _pulsePeriod: number
      _chromaOffset: number

      constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas
        this.ctx = ctx
        this.opacity = 0
        this.dissolve = 0
        this._time = 0
        this.cx = 0
        this.cy = 0
        this.radius = 100
        this._layers = [
          { dx: 0.16, dy: 0.16, rMult: 0.97, c: [251, 100, 40], alpha: 0.46, spd: 0.58, pOff: 1.1, h: [0.17, 0.12, 0.08, 0.11], bFreq: 0.72, bAmp: 0.038 },
          { dx: 0.14, dy: -0.16, rMult: 1.02, c: [6, 182, 212], alpha: 0.50, spd: 0.80, pOff: 2.8, h: [0.18, 0.13, 0.07, 0.12], bFreq: 0.88, bAmp: 0.042 },
          { dx: -0.17, dy: 0.11, rMult: 1.04, c: [217, 70, 239], alpha: 0.54, spd: 1.02, pOff: 4.5, h: [0.19, 0.12, 0.08, 0.13], bFreq: 1.05, bAmp: 0.035 },
          { dx: -0.04, dy: -0.04, rMult: 0.99, c: [124, 58, 237], alpha: 0.60, spd: 1.22, pOff: 0.0, h: [0.20, 0.14, 0.08, 0.13], bFreq: 0.65, bAmp: 0.028 },
          { dx: 0.00, dy: 0.02, rMult: 0.60, c: [67, 20, 140], alpha: 0.72, spd: 0.45, pOff: 0.5, h: [0.10, 0.07, 0.05, 0.08], bFreq: 0.50, bAmp: 0.020, isCore: true },
        ]
        this._pulsePeriod = 3.8
        this._chromaOffset = 3
      }

      resize(w: number, h: number) {
        this.cx = w * 0.5
        this.cy = h * 0.42
        this.radius = Math.min(w, h) * 0.20
      }

      _getPoints(layer: any, offsetX?: number, offsetY?: number) {
        const ox = offsetX || 0
        const oy = offsetY || 0
        const t = this._time * layer.spd + layer.pOff
        const d = this.dissolve
        const cx = this.cx + layer.dx * this.radius + ox
        const cy = this.cy + layer.dy * this.radius + oy
        const R = this.radius * layer.rMult
        const [h2, h3, h5, h15] = layer.h
        const breathe = 1 + Math.sin(this._time * layer.bFreq) * layer.bAmp
        const N = 12
        const pts: any[] = []
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2 - Math.PI / 2
          const noise = Math.sin(a * 2 + t * 1.35) * h2 + Math.sin(a * 3 - t * 0.95) * h3 + Math.sin(a * 5 + t * 0.62) * h5 + Math.sin(a * 1.5 - t * 0.48) * h15
          const chaos = d * (Math.sin(a * 7 + t * 5.2) * 0.22 + Math.sin(a * 11 - t * 7.0) * 0.15 + Math.sin(a * 13 + t * 4.1) * 0.09)
          const r = R * breathe * (1 + noise + chaos) * (1 - d * 0.42)
          pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r })
        }
        return { pts, cx, cy, R }
      }

      _smoothPath(pts: any[]) {
        const n = pts.length
        this.ctx.moveTo((pts[n - 1].x + pts[0].x) / 2, (pts[n - 1].y + pts[0].y) / 2)
        for (let i = 0; i < n; i++) {
          const p = pts[i], q = pts[(i + 1) % n]
          this.ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2)
        }
        this.ctx.closePath()
      }

      _drawAmbientHalo() {
        const ctx = this.ctx
        const R = this.radius * 1.65
        const pulse = 1 + Math.sin(this._time * 0.55) * 0.06
        const gr = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, R * pulse)
        gr.addColorStop(0, 'rgba(124,58,237,0.16)')
        gr.addColorStop(0.28, 'rgba(96,165,250,0.09)')
        gr.addColorStop(0.58, 'rgba(6,182,212,0.04)')
        gr.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.save()
        ctx.beginPath()
        ctx.arc(this.cx, this.cy, R * pulse, 0, Math.PI * 2)
        ctx.fillStyle = gr
        ctx.fill()
        ctx.restore()
      }

      _drawPulseWave() {
        if (this.opacity <= 0.1 || this.dissolve > 0.05) return
        const ctx = this.ctx, maxR = this.radius * 3.0
        for (let wave = 0; wave < 2; wave++) {
          const offset = wave * (this._pulsePeriod / 2)
          const phase = ((this._time + offset) % this._pulsePeriod) / this._pulsePeriod
          const r = phase * maxR, a = (1 - phase) * 0.16 * this.opacity
          if (a < 0.01) continue
          ctx.save()
          ctx.beginPath()
          ctx.arc(this.cx, this.cy, r, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(124,58,237,${a.toFixed(3)})`
          ctx.lineWidth = (1 - phase) * 1.8 + 0.3
          ctx.stroke()
          ctx.restore()
        }
      }

      _drawLayer(layer: any, offsetX?: number, offsetY?: number, colOverride?: number[], alphaScale?: number) {
        const ctx = this.ctx
        const d = this.dissolve
        const { pts, R } = this._getPoints(layer, offsetX, offsetY)
        const [cr, cg, cb] = colOverride || layer.c
        const alpha = layer.alpha * (alphaScale || 1) * (1 - d * 0.7)
        if (alpha <= 0.01) return
        const blurPx = Math.max(layer.isCore ? 8 : 10, R * (layer.isCore ? 0.15 : 0.22)).toFixed(1)
        ctx.save()
        ctx.globalCompositeOperation = 'screen'
        ctx.filter = `blur(${blurPx}px)`
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`
        ctx.beginPath()
        this._smoothPath(pts)
        ctx.fill()
        ctx.restore()
      }

      render(delta: number) {
        this._time += delta
        if (this.opacity <= 0) return
        const ctx = this.ctx
        ctx.save()
        ctx.globalAlpha = this.opacity
        this._drawAmbientHalo()
        this._drawPulseWave()
        const co = this._chromaOffset
        this._drawLayer(this._layers[2], -co, 0, [255, 0, 80], 0.12)
        this._drawLayer(this._layers[3], -co, 0, [255, 60, 60], 0.10)
        this._drawLayer(this._layers[2], co, 0, [0, 160, 255], 0.12)
        this._drawLayer(this._layers[3], co, 0, [60, 100, 255], 0.10)
        this._layers.forEach(l => this._drawLayer(l))
        if (this.dissolve > 0.04) {
          const d = this.dissolve
          ctx.globalAlpha = this.opacity * d * 0.72
          this._layers.forEach(l => {
            const { pts, cx: lcx, cy: lcy } = this._getPoints(l)
            const [cr, cg, cb] = l.c
            pts.forEach((p: any, pi: number) => {
              const outX = p.x - lcx, outY = p.y - lcy
              const outLen = Math.sqrt(outX * outX + outY * outY) || 1
              const thrust = d * 28 + Math.sin(this._time * 8.2 + pi * 1.7) * d * 8
              ctx.beginPath()
              ctx.arc(p.x + (outX / outLen) * thrust, p.y + (outY / outLen) * thrust, 2.8 * d, 0, Math.PI * 2)
              ctx.fillStyle = `rgba(${cr},${cg},${cb},0.88)`
              ctx.fill()
            })
          })
        }
        ctx.restore()
      }
    }

    // BHParticleSystem class
    class BHParticleSystem {
      particles: any[]
      _sparkles: any[]
      convergence: number
      opacity: number
      _time: number
      _vortexCx: number
      _vortexCy: number

      constructor() {
        this.particles = []
        this._sparkles = []
        this.convergence = 0
        this.opacity = 0
        this._time = 0
        this._vortexCx = 0
        this._vortexCy = 0
      }

      getTextTargets(text: string, cx: number, cy: number, canvasW: number, canvasH: number) {
        const ofc = document.createElement('canvas')
        ofc.width = canvasW
        ofc.height = canvasH
        const ctx = ofc.getContext('2d')!
        const fontSize = Math.min(Math.max(canvasW * 0.14, 62), 115)
        ctx.font = `900 ${fontSize}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#fff'
        ctx.fillText(text, cx, cy)
        const { data } = ctx.getImageData(0, 0, canvasW, canvasH)
        const pts: any[] = []
        const step = 2
        for (let y = 0; y < canvasH; y += step) {
          for (let x = 0; x < canvasW; x += step) {
            if (data[(y * canvasW + x) * 4 + 3] > 70) pts.push({ x, y })
          }
        }
        return pts
      }

      init(cx: number, cy: number, radius: number, targets: any[]) {
        this.particles = []
        this._sparkles = []
        this._vortexCx = cx
        this._vortexCy = cy
        if (!targets || targets.length === 0) return
        const shuffled = [...targets].sort(() => Math.random() - 0.5)
        const N = Math.min(shuffled.length, 800)
        const layerOffsets = [
          { dx: 0.08, dy: 0.15 },
          { dx: 0.22, dy: -0.16 },
          { dx: -0.20, dy: 0.13 },
          { dx: 0, dy: 0 },
        ]
        const palette = [
          [210, 195, 255],
          [120, 242, 255],
          [248, 190, 255],
          [255, 200, 130],
        ]
        for (let i = 0; i < N; i++) {
          const lo = layerOffsets[i % layerOffsets.length]
          const angle = Math.random() * Math.PI * 2
          const rm = [1.45, 1.1, 0.95, 0.82][i % 4]
          const r = Math.pow(Math.random(), 0.38) * radius * rm
          const ocx = cx + lo.dx * radius
          const ocy = cy + lo.dy * radius
          const vAngle = Math.atan2(ocy + Math.sin(angle) * r - cy, ocx + Math.cos(angle) * r - cx)
          const vDist = Math.sqrt(Math.pow(ocx - cx, 2) + Math.pow(ocy - cy, 2)) * 0.5 + r * 0.3
          this.particles.push({
            sx: ocx + Math.cos(angle) * r,
            sy: ocy + Math.sin(angle) * r,
            tx: shuffled[i].x,
            ty: shuffled[i].y,
            size: Math.random() * 2.0 + 0.6,
            phase: Math.random() * Math.PI * 2,
            col: palette[i % palette.length],
            delay: Math.random() * 0.18,
            vAngle, vDist,
            vSpeed: (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random() * 2.0),
          })
        }
        const sparkN = Math.min(shuffled.length, 280)
        for (let i = 0; i < sparkN; i++) {
          const pt = shuffled[i % shuffled.length]
          this._sparkles.push({
            x: pt.x + (Math.random() - 0.5) * 4,
            y: pt.y + (Math.random() - 0.5) * 4,
            size: Math.random() * 1.6 + 0.2,
            phase: Math.random() * Math.PI * 2,
            freq: 2.5 + Math.random() * 5.5,
            col: palette[i % palette.length],
          })
        }
      }

      render(ctx: CanvasRenderingContext2D, time: number) {
        this._time = time
        if (this.opacity <= 0 || this.particles.length === 0) return
        const raw = Math.max(0, Math.min(1, this.convergence))
        const vcx = this._vortexCx
        const vcy = this._vortexCy
        const breathe = raw > 0.95 ? 1 + Math.sin(time * 1.6) * 0.10 : 1
        ctx.save()
        for (const p of this.particles) {
          let fx, fy
          if (raw < 0.45) {
            const vt = raw / 0.45
            const spiralR = p.vDist * (1 - vt * 0.6)
            const spiralA = p.vAngle + vt * p.vSpeed * 2.5
            const vx = vcx + Math.cos(spiralA) * spiralR
            const vy = vcy + Math.sin(spiralA) * spiralR
            const blend = Math.min(1, vt * 2.0)
            const eBlend = 1 - Math.pow(1 - blend, 2)
            fx = p.sx + (vx - p.sx) * eBlend
            fy = p.sy + (vy - p.sy) * eBlend
          } else {
            const localC = Math.max(0, (raw - 0.45 - p.delay * 0.3) / (0.55 - p.delay * 0.3))
            const eased = 1 - Math.pow(1 - Math.min(1, localC), 3)
            const spiralA = p.vAngle + p.vSpeed * 2.5
            const midX = vcx + Math.cos(spiralA) * p.vDist * 0.46
            const midY = vcy + Math.sin(spiralA) * p.vDist * 0.46
            fx = midX + (p.tx - midX) * eased
            fy = midY + (p.ty - midY) * eased
            const float = (1 - eased) * 3.0 + eased * 1.2
            fx += Math.sin(time * 1.5 + p.phase) * float
            fy += Math.cos(time * 1.2 + p.phase * 1.3) * float * 0.65
          }
          const eT = Math.min(1, raw < 0.45 ? raw / 0.45 : 0.45 + (raw - 0.45) / 0.55)
          const [r, g, b] = p.col
          const a = (0.22 + eT * 0.60 + Math.sin(time * 2.8 + p.phase) * 0.06) * this.opacity
          ctx.beginPath()
          ctx.arc(fx, fy, p.size * (0.38 + eT * 0.62) * breathe, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, a)})`
          ctx.fill()
        }
        if (raw > 0.72 && this._sparkles.length > 0) {
          const sparkEnter = Math.min(1, (raw - 0.72) / 0.20)
          for (const s of this._sparkles) {
            const twinkle = Math.max(0, Math.sin(time * s.freq + s.phase))
            const a = sparkEnter * twinkle * 0.92 * this.opacity
            if (a < 0.015) continue
            const [r, g, b] = s.col
            ctx.beginPath()
            ctx.arc(s.x, s.y, s.size * breathe, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`
            ctx.fill()
          }
        }
        ctx.restore()
      }
    }

    // BHTextSequence class
    class BHTextSequence {
      svg: SVGSVGElement
      ideaGroup: Element | null
      sentenceGroup: Element | null
      ideaText: Element | null
      sentenceText: Element | null
      ideaBlurNode: Element | null
      sentenceBlurNode: Element | null

      constructor(svg: SVGSVGElement) {
        this.svg = svg
        this.ideaGroup = svg.querySelector('#bh-idea-group')
        this.sentenceGroup = svg.querySelector('#bh-sentence-group')
        this.ideaText = svg.querySelector('#bh-idea-text')
        this.sentenceText = svg.querySelector('#bh-sentence-text')
        this.ideaBlurNode = svg.querySelector('#bh-idea-blur-node')
        this.sentenceBlurNode = svg.querySelector('#bh-sentence-blur-node')
      }

      setPositions(cx: number, cy: number) {
        if (this.ideaText) {
          this.ideaText.setAttribute('x', String(cx))
          this.ideaText.setAttribute('y', String(cy))
          const fs = Math.min(Math.max(cx * 0.26, 54), 108)
          this.ideaText.setAttribute('font-size', String(fs))
        }
        if (this.sentenceText) {
          this.sentenceText.setAttribute('x', String(cx))
          this.sentenceText.setAttribute('y', String(cy))
          const sfs = Math.min(Math.max(cx * 0.052, 14), 24)
          this.sentenceText.setAttribute('font-size', String(sfs))
        }
      }

      reset() {
        gsap.set(this.ideaGroup, { opacity: 0 })
        gsap.set(this.sentenceGroup, { opacity: 0 })
        if (this.ideaBlurNode) this.ideaBlurNode.setAttribute('stdDeviation', '12')
        if (this.sentenceBlurNode) this.sentenceBlurNode.setAttribute('stdDeviation', '16')
        if (this.ideaText) this.ideaText.setAttribute('letter-spacing', '1')
        if (this.sentenceText) this.sentenceText.setAttribute('letter-spacing', '20')
      }

      addToTimeline(tl: any, ideaStart: number, sentenceStart: number, sentenceFadeOut: number) {
        tl.to(this.ideaGroup, { opacity: 1, duration: 0.65, ease: 'power2.out' }, ideaStart)
        tl.to(this.ideaBlurNode, { attr: { stdDeviation: 0 }, duration: 0.65, ease: 'power2.out' }, ideaStart)
        tl.to(this.ideaText, { attr: { 'letter-spacing': '28' }, duration: 0.7, ease: 'power1.in' }, sentenceStart - 0.1)
        tl.to(this.ideaBlurNode, { attr: { stdDeviation: 12 }, duration: 0.6, ease: 'power2.in' }, sentenceStart + 0.05)
        tl.to(this.ideaGroup, { opacity: 0, duration: 0.55, ease: 'power2.in' }, sentenceStart + 0.15)
        tl.to(this.sentenceGroup, { opacity: 1, duration: 0.7, ease: 'power2.out' }, sentenceStart + 0.45)
        tl.to(this.sentenceBlurNode, { attr: { stdDeviation: 0 }, duration: 0.8, ease: 'power2.out' }, sentenceStart + 0.45)
        tl.to(this.sentenceText, { attr: { 'letter-spacing': '0.5' }, duration: 0.85, ease: 'power2.out' }, sentenceStart + 0.4)
        tl.to(this.sentenceGroup, { opacity: 0, duration: 0.55, ease: 'power2.in' }, sentenceFadeOut)
      }
    }

    // BHIATree class
    class BHIATree {
      opacity: number
      progress: number
      focusProgress: number
      nodeToCenter: number
      burstProgress: number
      signalPhase: number
      selectedNodeIdx: number
      W: number
      H: number
      _nodes: any[] | null
      _edges: any[] | null
      _nodeFirstEdge: any[] | null
      _burstPts: any[] | null
      _burstInitialized: boolean
      _trailPts: any[]
      _levelCols: any
      _levelScale: any
      _levelAlpha: any
      _selectedPath: number[]
      _burstCx: number
      _burstCy: number

      constructor() {
        this.opacity = 0
        this.progress = 0
        this.focusProgress = 0
        this.nodeToCenter = 0
        this.burstProgress = 0
        this.signalPhase = 0
        this.selectedNodeIdx = 19
        this.W = 0
        this.H = 0
        this._nodes = null
        this._edges = null
        this._nodeFirstEdge = null
        this._burstPts = null
        this._burstInitialized = false
        this._trailPts = []
        this._burstCx = 0
        this._burstCy = 0
        this._levelCols = { 0: [255, 255, 255], 1: [110, 231, 216], 2: [96, 165, 250], 3: [196, 181, 253] }
        this._levelScale = { 0: 1.05, 1: 0.82, 2: 0.92, 3: 1.0 }
        this._levelAlpha = { 0: 1.0, 1: 0.72, 2: 0.88, 3: 1.0 }
        this._selectedPath = [0, 3, 10, 19]
      }

      setup(W: number, H: number) {
        this.W = W
        this.H = H
        this._burstInitialized = false
        this._burstPts = null
        this._trailPts = []
        this._build(W, H)
      }

      _build(W: number, H: number) {
        const n = (xf: number, yf: number) => ({ x: W * xf, y: H * yf })
        const nodes = [
          { ...n(0.20, 0.50), level: 0, label: '' },
          { ...n(0.38, 0.15), level: 1, label: '' },
          { ...n(0.38, 0.29), level: 1, label: '' },
          { ...n(0.38, 0.45), level: 1, label: '' },
          { ...n(0.38, 0.62), level: 1, label: '' },
          { ...n(0.38, 0.78), level: 1, label: '' },
          { ...n(0.57, 0.08), level: 2, label: '' },
          { ...n(0.57, 0.17), level: 2, label: '' },
          { ...n(0.57, 0.26), level: 2, label: '' },
          { ...n(0.57, 0.36), level: 2, label: '' },
          { ...n(0.57, 0.46), level: 2, label: '' },
          { ...n(0.57, 0.55), level: 2, label: '' },
          { ...n(0.57, 0.64), level: 2, label: '' },
          { ...n(0.57, 0.73), level: 2, label: '' },
          { ...n(0.57, 0.82), level: 2, label: '' },
          { ...n(0.57, 0.90), level: 2, label: '' },
          { ...n(0.80, 0.13), level: 3, label: '\uAE30\uD68D\uC548' },
          { ...n(0.80, 0.23), level: 3, label: 'IA \uAD6C\uC870' },
          { ...n(0.80, 0.33), level: 3, label: '\uD654\uBA74 \uC2DC\uC548' },
          { ...n(0.80, 0.43), level: 3, label: '\uC608\uC57D \uD604\uD669' },
          { ...n(0.80, 0.54), level: 3, label: '\uACE0\uAC1D \uAD00\uB9AC' },
          { ...n(0.80, 0.64), level: 3, label: '\uC54C\uB9BC' },
          { ...n(0.80, 0.74), level: 3, label: '\uACB0\uC81C' },
          { ...n(0.80, 0.84), level: 3, label: '\uB300\uC2DC\uBCF4\uB4DC' },
        ]
        const edgeDefs = [
          [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
          [1, 6], [1, 7], [2, 7], [2, 8], [2, 9],
          [3, 9], [3, 10], [3, 11], [4, 11], [4, 12], [4, 13], [5, 13], [5, 14], [5, 15],
          [6, 16], [7, 16], [7, 17], [8, 17], [9, 17], [9, 18], [10, 18], [10, 19],
          [11, 19], [11, 20], [12, 20], [12, 21], [13, 21], [13, 22], [14, 22], [14, 23], [15, 23],
        ]
        const levelRanges = [{ s: 0.04, e: 0.33 }, { s: 0.25, e: 0.59 }, { s: 0.50, e: 0.86 }]
        const byLevel: any[][] = [[], [], []]
        edgeDefs.forEach(([f, t]) => byLevel[nodes[f].level].push({ from: f, to: t }))
        const edges: any[] = []
        byLevel.forEach((group, li) => {
          const { s, e } = levelRanges[li]
          const range = e - s
          const dur = range * 0.52
          const step = group.length > 1 ? (range - dur) / (group.length - 1) : 0
          group.forEach((ed, i) => {
            edges.push({ ...ed, pS: s + i * step, pE: s + i * step + dur })
          })
        })
        const nfe: any[] = new Array(nodes.length).fill(null)
        nfe[0] = { pS: 0, pE: 0.05 }
        edges.forEach(ed => {
          if (!nfe[ed.to] || ed.pS < nfe[ed.to].pS) nfe[ed.to] = ed
        })
        const pathSet = new Set<string>()
        for (let i = 0; i < this._selectedPath.length - 1; i++) {
          pathSet.add(`${this._selectedPath[i]}-${this._selectedPath[i + 1]}`)
        }
        edges.forEach(ed => { ed.onPath = pathSet.has(`${ed.from}-${ed.to}`) })
        this._nodes = nodes
        this._edges = edges
        this._nodeFirstEdge = nfe
      }

      render(ctx: CanvasRenderingContext2D, time: number) {
        if (this.opacity <= 0 || !this._nodes) return
        const p = this.progress
        const fp = this.focusProgress
        const ntc = this.nodeToCenter
        const bp = this.burstProgress
        const sel = this.selectedNodeIdx
        const treeA = Math.max(0, 1 - ntc * 1.8)

        ctx.save()
        ctx.globalAlpha = this.opacity

        if (treeA > 0.01) {
          this._edges!.forEach(ed => {
            const t = Math.min(1, Math.max(0, (p - ed.pS) / (ed.pE - ed.pS)))
            if (t <= 0) return
            const dimF = fp > 0 && !ed.onPath ? 1 - fp * 0.93 : 1
            const totalA = dimF * treeA
            if (totalA <= 0.01) return
            const pathBoost = ed.onPath && fp > 0 ? fp * 0.35 : 0
            const pulseAdd = p >= 1 && ed.onPath && fp > 0 ? Math.sin(time * 4.5 + ed.pS * 10) * 0.12 * fp : 0
            const lineA = (ed.onPath && fp > 0 ? 0.65 + fp * 0.28 : 0.38) + pathBoost
            const fromCol = this._levelCols[this._nodes![ed.from].level]
            const toCol = this._levelCols[this._nodes![ed.to].level]
            this._bezier(ctx, this._nodes![ed.from], this._nodes![ed.to], t, (lineA + pulseAdd) * totalA, fromCol, toCol, ed.onPath && fp > 0)
          })
        }

        if (treeA > 0.01) {
          this._nodes!.forEach((nd, i) => {
            if (i === sel) return
            const fe = this._nodeFirstEdge![i]
            if (!fe) return
            const ep = Math.min(1, Math.max(0, i === 0 ? p / 0.06 : (p - fe.pS) / (fe.pE - fe.pS)))
            const nodeT = i === 0 ? ep : Math.min(1, Math.max(0, (ep - 0.58) / 0.42))
            if (nodeT <= 0) return
            const dimA = fp > 0 ? 1 - fp * 0.91 : 1
            const onPath = this._selectedPath.includes(i)
            const pathA = onPath && fp > 0 ? Math.min(1, 1 + fp * 0.4) : 1
            const levelA = this._levelAlpha[nd.level] || 1
            const levelS = this._levelScale[nd.level] || 1
            this._circNode(ctx, nd.x, nd.y, nodeT, false, onPath ? fp * 0.5 : 0, dimA * treeA * levelA * pathA, nd.label, nd.level, time, levelS)
          })
        }

        {
          const selNd = this._nodes![sel]
          const fe = this._nodeFirstEdge![sel]
          if (fe) {
            const ep = Math.min(1, Math.max(0, (p - fe.pS) / (fe.pE - fe.pS)))
            const nodeT = Math.min(1, Math.max(0, (ep - 0.58) / 0.42))
            if (nodeT > 0) {
              let nx = selNd.x, ny = selNd.y
              if (ntc > 0) {
                const destX = this.W * 0.50
                const destY = this.H * 0.44
                const ease = 1 - Math.pow(1 - ntc, 3)
                nx = selNd.x + (destX - selNd.x) * ease
                ny = selNd.y + (destY - selNd.y) * ease
                if (ntc > 0.03 && ntc < 0.95) {
                  if (this._trailPts.length === 0 ||
                    Math.abs(nx - this._trailPts[this._trailPts.length - 1].x) > 2 ||
                    Math.abs(ny - this._trailPts[this._trailPts.length - 1].y) > 2) {
                    this._trailPts.push({ x: nx, y: ny })
                    if (this._trailPts.length > 20) this._trailPts.shift()
                  }
                }
                this._trailPts.forEach((pt, i) => {
                  const tf = i / this._trailPts.length
                  const ta = tf * 0.35 * ntc * (1 - ntc * 0.3)
                  if (ta < 0.01) return
                  const col = this._levelCols[selNd.level]
                  ctx.save()
                  ctx.globalAlpha *= ta
                  ctx.beginPath()
                  ctx.arc(pt.x, pt.y, 2.5 * tf, 0, Math.PI * 2)
                  ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},0.9)`
                  ctx.fill()
                  ctx.restore()
                })
              }
              const selA = bp > 0 ? Math.max(0, 1 - bp / 0.35) : 1
              if (selA > 0.01) {
                this._circNode(ctx, nx, ny, Math.min(1, nodeT * 1.5), true, fp, selA, selNd.label, selNd.level, time, 1.0)
              }
            }
          }
        }

        if (this.signalPhase > 0 && this.signalPhase < 1 && treeA > 0.5 && p >= 0.8) {
          this._renderSignal(ctx, this.signalPhase)
        }

        if (bp > 0) {
          if (!this._burstInitialized) {
            this._initBurst(this.W * 0.50, this.H * 0.44)
            this._burstInitialized = true
          }
          this._renderBurst(ctx, bp)
        }

        ctx.restore()
      }

      _renderSignal(ctx: CanvasRenderingContext2D, phase: number) {
        const pathEdges = [{ from: 0, to: 3 }, { from: 3, to: 10 }, { from: 10, to: 19 }]
        const segT = phase * pathEdges.length
        const segIdx = Math.min(pathEdges.length - 1, Math.floor(segT))
        const segFrac = segT - segIdx
        const ed = pathEdges[segIdx]
        const pt = this._getBezierPoint(this._nodes![ed.from], this._nodes![ed.to], segFrac)
        const col = this._levelCols[this._nodes![ed.to].level]
        const [cr, cg, cb] = col
        ctx.save()
        const gr = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 10)
        gr.addColorStop(0, `rgba(${cr},${cg},${cb},0.85)`)
        gr.addColorStop(0.4, `rgba(${cr},${cg},${cb},0.40)`)
        gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2)
        ctx.fillStyle = gr
        ctx.fill()
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 2.8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,0.95)`
        ctx.fill()
        ctx.restore()
      }

      _getBezierPoint(from: any, to: any, t: number) {
        const cp = (to.x - from.x) * 0.42
        const P0 = { x: from.x, y: from.y }
        const P1 = { x: from.x + cp, y: from.y }
        const P2 = { x: to.x - cp, y: to.y }
        const P3 = { x: to.x, y: to.y }
        const mt = 1 - t
        return {
          x: mt * mt * mt * P0.x + 3 * mt * mt * t * P1.x + 3 * mt * t * t * P2.x + t * t * t * P3.x,
          y: mt * mt * mt * P0.y + 3 * mt * mt * t * P1.y + 3 * mt * t * t * P2.y + t * t * t * P3.y,
        }
      }

      _bezier(ctx: CanvasRenderingContext2D, from: any, to: any, t: number, lineA: number, fromCol: number[], toCol: number[], highlight: boolean) {
        if (lineA <= 0.01) return
        const cp = (to.x - from.x) * 0.42
        const P0 = { x: from.x, y: from.y }
        const P1 = { x: from.x + cp, y: from.y }
        const P2 = { x: to.x - cp, y: to.y }
        const P3 = { x: to.x, y: to.y }
        let q
        if (t >= 1) {
          q = [P0, P1, P2, P3]
        } else {
          const L = (a: any, b: any) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
          const Q0 = L(P0, P1), Q1 = L(P1, P2), Q2 = L(P2, P3)
          const R0 = L(Q0, Q1), R1 = L(Q1, Q2)
          q = [P0, Q0, R0, L(R0, R1)]
        }
        const grad = ctx.createLinearGradient(q[0].x, q[0].y, q[3].x, q[3].y)
        grad.addColorStop(0, `rgba(${fromCol[0]},${fromCol[1]},${fromCol[2]},${(lineA * 0.55).toFixed(3)})`)
        grad.addColorStop(1, `rgba(${toCol[0]},${toCol[1]},${toCol[2]},${lineA.toFixed(3)})`)
        ctx.beginPath()
        ctx.moveTo(q[0].x, q[0].y)
        ctx.bezierCurveTo(q[1].x, q[1].y, q[2].x, q[2].y, q[3].x, q[3].y)
        ctx.strokeStyle = grad
        ctx.lineWidth = highlight ? 1.3 : 0.9
        ctx.stroke()
        if (t < 0.98) {
          const tip = q[3]
          ctx.save()
          ctx.beginPath()
          ctx.arc(tip.x, tip.y, highlight ? 3.0 : 2.0, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${toCol[0]},${toCol[1]},${toCol[2]},${Math.min(0.95, lineA * 1.9).toFixed(3)})`
          ctx.fill()
          const gr = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, highlight ? 9 : 5)
          gr.addColorStop(0, `rgba(${toCol[0]},${toCol[1]},${toCol[2]},${(lineA * 0.52).toFixed(3)})`)
          gr.addColorStop(1, `rgba(${toCol[0]},${toCol[1]},${toCol[2]},0)`)
          ctx.beginPath()
          ctx.arc(tip.x, tip.y, highlight ? 9 : 5, 0, Math.PI * 2)
          ctx.fillStyle = gr
          ctx.fill()
          ctx.restore()
        }
      }

      _circNode(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, isSelected: boolean, focusAmt: number, alpha: number, label: string, level: number, time: number, levelScale: number) {
        if (alpha <= 0.01 || t <= 0) return
        const col = this._levelCols[level] || [255, 255, 255]
        const [cr, cg, cb] = col
        const ls = levelScale || 1
        const scaleT = Math.min(1, t * 2.5)
        const scale = (0.3 + scaleT * 0.7 + focusAmt * 0.4) * ls
        const r = 4 * scale + (isSelected ? focusAmt * 5 : 0)
        ctx.save()
        ctx.globalAlpha *= alpha
        if (isSelected && focusAmt > 0.05) {
          const gr = r * 4 + focusAmt * 14
          const g = ctx.createRadialGradient(x, y, 0, x, y, gr)
          g.addColorStop(0, `rgba(${cr},${cg},${cb},${(focusAmt * 0.55).toFixed(3)})`)
          g.addColorStop(0.45, `rgba(${cr},${cg},${cb},${(focusAmt * 0.20).toFixed(3)})`)
          g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
          ctx.beginPath()
          ctx.arc(x, y, gr, 0, Math.PI * 2)
          ctx.fillStyle = g
          ctx.fill()
        }
        if (focusAmt > 0.05 && time !== undefined) {
          const rings = isSelected ? 2 : 1
          for (let ri = 0; ri < rings; ri++) {
            const pulse = (Math.sin(time * 3.2 + ri * Math.PI) * 0.5 + 0.5)
            const pr = r + (isSelected ? 8 : 5) + ri * 6 + pulse * (isSelected ? 5 : 3)
            const pa = (isSelected ? 0.20 : 0.10) * focusAmt * (1 - pulse * 0.6)
            if (pa < 0.01) continue
            ctx.beginPath()
            ctx.arc(x, y, pr, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(${cr},${cg},${cb},${pa.toFixed(3)})`
            ctx.lineWidth = 0.7
            ctx.stroke()
          }
        }
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${(isSelected ? 0.08 + focusAmt * 0.75 : 0.07).toFixed(3)})`
        ctx.fill()
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${(isSelected ? 0.85 : 0.72).toFixed(3)})`
        ctx.lineWidth = isSelected ? 1.3 + focusAmt * 0.4 : 0.9
        ctx.stroke()
        if (label && t > 0.55) {
          const lA = Math.min(1, (t - 0.55) / 0.45) * alpha
          const fs = isSelected && focusAmt > 0.3 ? 8.5 : 7.5
          const fw = isSelected && focusAmt > 0.3 ? '600' : '400'
          ctx.font = `${fw} ${fs}px Inter, -apple-system, sans-serif`
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = isSelected && focusAmt > 0.3
            ? `rgba(${cr},${cg},${cb},${lA.toFixed(3)})`
            : `rgba(${cr},${cg},${cb},${(lA * 0.65).toFixed(3)})`
          ctx.fillText(label, x + r + 5, y)
        }
        ctx.restore()
      }

      _initBurst(cx: number, cy: number) {
        this._burstCx = cx
        this._burstCy = cy
        this._burstPts = []
        const cols = [
          [210, 195, 255], [120, 242, 255], [248, 190, 255], [130, 150, 255], [255, 255, 255], [170, 145, 255], [100, 175, 255],
        ]
        for (let i = 0; i < 260; i++) {
          const angle = Math.random() * Math.PI * 2
          const dist = 10 + Math.random() * 145
          this._burstPts.push({
            dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist,
            size: Math.random() * 3.2 + 0.4, baseA: Math.random() * 0.40 + 0.50,
            col: cols[Math.floor(Math.random() * cols.length)],
            spd: 0.55 + Math.random() * 0.90, tier: i < 130 ? 0 : 1,
          })
        }
      }

      _renderBurst(ctx: CanvasRenderingContext2D, bp: number) {
        if (!this._burstPts) return
        const cx = this._burstCx, cy = this._burstCy
        const rings = [
          { delay: 0, maxR: 52, colA: [255, 255, 255], alpha: 0.92, maxBp: 0.28, lw: 2.2 },
          { delay: 0.06, maxR: 72, colA: [196, 181, 253], alpha: 0.58, maxBp: 0.30, lw: 1.1 },
          { delay: 0.18, maxR: 95, colA: [110, 231, 216], alpha: 0.30, maxBp: 0.55, lw: 0.8 },
        ]
        rings.forEach(rg => {
          const bpL = Math.max(0, bp - rg.delay)
          const rA = Math.max(0, 1 - bpL / rg.maxBp)
          if (rA < 0.01) return
          ctx.save()
          ctx.beginPath()
          ctx.arc(cx, cy, 4 + bpL * rg.maxR, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(${rg.colA[0]},${rg.colA[1]},${rg.colA[2]},${(rA * rg.alpha).toFixed(3)})`
          ctx.lineWidth = rg.lw * rA
          ctx.stroke()
          ctx.restore()
        })
        this._burstPts.forEach(p => {
          const delay = p.tier === 1 ? 0.07 : 0
          const bpL = Math.max(0, bp - delay)
          const sp = 1 - Math.pow(1 - Math.min(1, bpL / 0.72), 2)
          const x = cx + p.dx * p.spd * sp, y = cy + p.dy * p.spd * sp
          let a = bpL < 0.10 ? bpL / 0.10 : bpL < 0.62 ? 1 : 1 - (bpL - 0.62) / 0.38
          a *= p.baseA
          if (a <= 0.01) return
          const [r, g, b] = p.col
          ctx.beginPath()
          ctx.arc(x, y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`
          ctx.fill()
        })
      }
    }

    // BHUITransition class
    class BHUITransition {
      el: HTMLElement
      mainCard: HTMLElement | null
      bgCards: HTMLElement[]
      stats: HTMLElement[]
      rows: HTMLElement[]
      _idleTween: any
      _statTargets: number[]
      _statSuffixes: string[]
      _statEls: HTMLElement[]
      _progressFill: HTMLElement | null

      constructor(el: HTMLElement) {
        this.el = el
        this.mainCard = el.querySelector('.card-main')
        this.bgCards = Array.from(el.querySelectorAll('.card-bg'))
        this.stats = Array.from(el.querySelectorAll('.hero-stat-pill'))
        this.rows = Array.from(el.querySelectorAll('.booking-item'))
        this._idleTween = null
        this._statTargets = [247, 94, 18]
        this._statSuffixes = ['', '%', '']
        this._statEls = Array.from(el.querySelectorAll('.hsp-val'))
        this._progressFill = el.querySelector('.hero-progress-fill')
      }

      reset() {
        gsap.set(this.el, { opacity: 0 })
        if (this.mainCard) {
          gsap.set(this.mainCard, { scale: 0.90, y: 22, opacity: 0, filter: 'blur(8px)' })
        }
        this.bgCards.forEach((c: any) => gsap.set(c, { scale: 0.72, opacity: 0, x: 0 }))
        gsap.set(this.stats, { opacity: 0, y: 10 })
        gsap.set(this.rows, { opacity: 0, y: 8 })
        if (this.mainCard) this.mainCard.classList.remove('idle')
        this._statEls.forEach((el, i) => {
          el.textContent = '0' + (this._statSuffixes[i] || '')
        })
        if (this._progressFill) gsap.set(this._progressFill, { scaleX: 0 })
      }

      _countUp(el: HTMLElement, target: number, suffix: string, duration: number, startDelay: number) {
        const obj = { val: 0 }
        gsap.to(obj, {
          val: target, duration, delay: startDelay, ease: 'power2.out',
          onUpdate: () => { el.textContent = Math.round(obj.val) + (suffix || '') },
        })
      }

      addToTimeline(tl: any, startTime: number) {
        tl.to(this.el, { opacity: 1, duration: 0.4 }, startTime)
        if (this.bgCards[0]) {
          tl.to(this.bgCards[0], { scale: 1, opacity: 1, duration: 0.70, ease: 'power3.out' }, startTime + 0.04)
        }
        if (this.bgCards[1]) {
          tl.to(this.bgCards[1], { scale: 1, opacity: 1, duration: 0.70, ease: 'power3.out' }, startTime + 0.16)
        }
        if (this.mainCard) {
          tl.to(this.mainCard, {
            scale: 1, y: 0, opacity: 1,
            filter: 'blur(0px)',
            duration: 0.90, ease: 'back.out(1.5)',
          }, startTime + 0.26)
        }
        if (this._progressFill) {
          tl.to(this._progressFill, {
            scaleX: 1, duration: 1.5, ease: 'power2.out', transformOrigin: 'left center',
          }, startTime + 0.38)
        }
        tl.to(this.stats, {
          opacity: 1, y: 0, duration: 0.40, stagger: 0.10, ease: 'back.out(1.8)',
        }, startTime + 0.55)
        tl.call(() => {
          this._statEls.forEach((el, i) => {
            this._countUp(el, this._statTargets[i], this._statSuffixes[i], 1.2, i * 0.12)
          })
        }, [], startTime + 0.62)
        tl.to(this.rows, {
          opacity: 1, y: 0, duration: 0.38, stagger: 0.12, ease: 'power2.out',
        }, startTime + 0.82)
        tl.call(() => this.startIdle(), [], startTime + 1.80)
      }

      startIdle() {
        if (!this.mainCard) return
        this.mainCard.classList.add('idle')
        if (this._idleTween) this._idleTween.kill()
        this._idleTween = gsap.to(this.mainCard, {
          y: -8, duration: 4.8, ease: 'sine.inOut', repeat: -1, yoyo: true,
        })
      }

      stopIdle() {
        if (this._idleTween) { this._idleTween.kill(); this._idleTween = null }
        if (this.mainCard) this.mainCard.classList.remove('idle')
      }
    }

    // BHHeroController
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const svg = svgRef.current!
    const uiEl = heroUiRef.current!

    const blob = new BHBlobRenderer(canvas, ctx)
    const particles = new BHParticleSystem()
    const textSeq = new BHTextSequence(svg)
    const tree = new BHIATree()
    const ui = new BHUITransition(uiEl)

    let tl: any = null
    let _raf: number | null = null
    let _lastTime = 0
    let _running = false
    const _reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let W = 0, H = 0
    const _nebulaR = [124, 58, 237]
    const _nebulaG = [96, 165, 250]
    let _nebulaIntensity = 1.0

    function measureAndResize() {
      const rect = canvas.parentElement!.getBoundingClientRect()
      W = Math.max(Math.floor(rect.width), 340)
      H = Math.max(Math.floor(rect.height), 320)
      canvas.width = W
      canvas.height = H
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      blob.resize(W, H)
      tree.setup(W, H)
      textSeq.setPositions(blob.cx, blob.cy)
    }

    function handleResize() {
      measureAndResize()
      if (particles.particles.length > 0) {
        const targets = particles.getTextTargets('idea', blob.cx, blob.cy, W, H)
        particles.init(blob.cx, blob.cy, blob.radius, targets)
      }
    }

    function renderAurora(t: number) {
      const beams = [
        { xf: 0.22, col: [124, 58, 237], spd: 0.12, width: 0.15 },
        { xf: 0.50, col: [96, 165, 250], spd: 0.08, width: 0.18 },
        { xf: 0.78, col: [6, 182, 212], spd: 0.15, width: 0.14 },
      ]
      beams.forEach(b => {
        const cx = (b.xf + Math.sin(t * b.spd) * 0.06) * W
        const bw = b.width * W
        const osc = Math.sin(t * 0.3 + b.xf * 5) * 0.5 + 0.5
        const a = osc * 0.028
        if (a < 0.002) return
        const gr = ctx.createLinearGradient(cx, 0, cx, H)
        gr.addColorStop(0, `rgba(${b.col[0]},${b.col[1]},${b.col[2]},0)`)
        gr.addColorStop(0.2, `rgba(${b.col[0]},${b.col[1]},${b.col[2]},${a.toFixed(3)})`)
        gr.addColorStop(0.8, `rgba(${b.col[0]},${b.col[1]},${b.col[2]},${a.toFixed(3)})`)
        gr.addColorStop(1, `rgba(${b.col[0]},${b.col[1]},${b.col[2]},0)`)
        ctx.save()
        ctx.globalCompositeOperation = 'screen'
        ctx.filter = `blur(${(bw * 0.5).toFixed(0)}px)`
        ctx.fillStyle = gr
        ctx.fillRect(cx - bw, 0, bw * 2, H)
        ctx.restore()
      })
    }

    function renderNebula(t: number) {
      const cx = blob.cx, cy = blob.cy, R = blob.radius
      const ni = _nebulaIntensity
      const drift = Math.sin(t * 0.18)
      const ox = R * 0.18 * Math.sin(t * 0.11)
      const oy = R * 0.14 * Math.cos(t * 0.09)
      const [r1, g1, b1] = _nebulaR
      const [r2, g2, b2] = _nebulaG
      const g = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx, cy, R * 3.2)
      g.addColorStop(0, `rgba(${r1},${g1},${b1},${((0.055 + drift * 0.018) * ni).toFixed(3)})`)
      g.addColorStop(0.28, `rgba(${r2},${g2},${b2},${((0.032 + drift * 0.012) * ni).toFixed(3)})`)
      g.addColorStop(0.55, `rgba(6,182,212,${(0.014 * ni).toFixed(3)})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, R * 3.2, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()
      ctx.restore()
    }

    function startRaf() {
      _running = true
      _lastTime = performance.now()
      const loop = (now: number) => {
        if (!_running) return
        const delta = Math.min((now - _lastTime) / 1000, 0.05)
        _lastTime = now
        const t = now / 1000
        ctx.clearRect(0, 0, W, H)
        renderAurora(t)
        renderNebula(t)
        blob.render(delta)
        particles.render(ctx, t)
        tree.render(ctx, t)
        _raf = requestAnimationFrame(loop)
      }
      _raf = requestAnimationFrame(loop)
    }

    function stopRaf() {
      _running = false
      if (_raf) cancelAnimationFrame(_raf)
    }

    function playIntro() {
      if (tl) tl.kill()
      const cx = blob.cx, cy = blob.cy, radius = blob.radius
      const targets = particles.getTextTargets('idea', cx, cy, W, H)
      particles.init(cx, cy, radius, targets)
      textSeq.reset()
      ui.reset()
      ui.stopIdle()
      gsap.set(blob, { opacity: 0, dissolve: 0 })
      gsap.set(particles, { opacity: 0, convergence: 0 })
      gsap.set(tree, { opacity: 0, progress: 0, focusProgress: 0, nodeToCenter: 0, burstProgress: 0, signalPhase: 0 })
      gsap.set('#bh-idea-group', { opacity: 0 })
      gsap.set('#bh-sentence-group', { opacity: 0 })
      _nebulaR[0] = 124; _nebulaR[1] = 58; _nebulaR[2] = 237
      _nebulaG[0] = 96; _nebulaG[1] = 165; _nebulaG[2] = 250
      _nebulaIntensity = 1.0

      tl = gsap.timeline({ defaults: { overwrite: 'auto' } })

      tl.to(blob, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0)
      tl.to(blob, { dissolve: 1, duration: 0.7, ease: 'power2.in' }, 0.85)
      tl.to(blob, { opacity: 0, duration: 0.5, ease: 'power2.in' }, 1.1)
      tl.to(particles, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.9)
      tl.to(particles, { convergence: 1, duration: 1.8, ease: 'power2.inOut' }, 1.0)
      tl.to(_nebulaR, { 0: 6, 1: 182, 2: 212, duration: 0.8, ease: 'power2.inOut' }, 4.0)
      textSeq.addToTimeline(tl, 4.1, 5.5, 7.9)
      tl.to(particles, { opacity: 0, duration: 0.6, ease: 'power2.in' }, 4.3)
      tl.to(_nebulaR, { 0: 96, 1: 165, 2: 250, duration: 0.6, ease: 'power2.inOut' }, 7.8)
      tl.to(_nebulaG, { 0: 110, 1: 231, 2: 216, duration: 0.6, ease: 'power2.inOut' }, 7.8)
      tl.to(tree, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 8.1)
      tl.to(tree, { progress: 1, duration: 2.9, ease: 'power1.inOut' }, 8.2)
      tl.to(tree, { signalPhase: 1, duration: 0.75, ease: 'none', repeat: 3, repeatDelay: 0.30 }, 10.8)
      tl.to(tree, { focusProgress: 1, duration: 1.2, ease: 'power2.inOut' }, 11.8)
      tl.to(tree, { nodeToCenter: 1, duration: 0.85, ease: 'power2.inOut' }, 13.0)
      tl.to(tree, { burstProgress: 1, duration: 1.0, ease: 'power1.in' }, 13.65)
      tl.to(tree, { opacity: 0, duration: 0.5, ease: 'power2.in' }, 14.25)
      tl.to(_nebulaR, { 0: 124, 1: 58, 2: 237, duration: 0.5 }, 14.25)
      ui.addToTimeline(tl, 14.55)
    }

    // Init
    measureAndResize()
    if (window.ResizeObserver) {
      new ResizeObserver(() => handleResize()).observe(canvas.parentElement!)
    }

    if (_reducedMotion) {
      gsap.set(uiEl, { opacity: 1 })
      gsap.set(uiEl.querySelectorAll('.hero-stat-pill'), { opacity: 1, y: 0 })
      gsap.set(uiEl.querySelectorAll('.booking-item'), { opacity: 1, y: 0 })
      const main = uiEl.querySelector('.card-main') as HTMLElement | null
      if (main) gsap.set(main, { scale: 1, y: 0, opacity: 1 })
      uiEl.querySelectorAll('.card-bg').forEach((el: any) => gsap.set(el, { scale: 1, opacity: 1 }))
      ui.startIdle()
      return
    }

    startRaf()

    // Intersection observer
    if (window.IntersectionObserver) {
      let _hasStarted = false
      new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            if (!_hasStarted) {
              _hasStarted = true
              if (!_running) startRaf()
              playIntro()
            } else {
              if (!_running) startRaf()
              if (tl && tl.paused()) tl.resume()
            }
          } else {
            stopRaf()
            if (tl) tl.pause()
          }
        })
      }, { threshold: 0.05 }).observe(canvas.parentElement!)
    } else {
      playIntro()
    }

    return () => {
      stopRaf()
      if (tl) tl.kill()
    }
  }, [])

  useEffect(() => {
    // Init features scroll behavior (does not require GSAP)
    const cleanupFeatures = initFeatures()

    // Wait for GSAP to load, then init animations
    const checkGsap = setInterval(() => {
      if ((window as any).gsap && (window as any).ScrollTrigger && !gsapLoaded.current) {
        gsapLoaded.current = true
        clearInterval(checkGsap)
        initGsapAnimations()
        initBrandHero()
      }
    }, 100)

    return () => {
      clearInterval(checkGsap)
      if (cleanupFeatures) cleanupFeatures()
    }
  }, [initFeatures, initGsapAnimations, initBrandHero])

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.4/gsap.min.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.4/ScrollTrigger.min.js"
        strategy="afterInteractive"
      />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        /* Reset & Base */
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        :root {
          --p:   #7C3AED;
          --s:   #60A5FA;
          --a:   #6EE7D8;
          --bg:  #000;
          --sf:  #000;
          --sf2: #000;
          --t:   #F0F0FF;
          --tm:  rgba(240, 240, 255, .5);
          --td:  rgba(240, 240, 255, .22);
          --br:  rgba(255, 255, 255, .07);
          --brl: rgba(255, 255, 255, .11);
        }

        body {
          font-family: 'Inter', -apple-system, sans-serif;
          background: var(--bg);
          color: var(--t);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* Navigation */
        #nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 999;
          height: 58px;
          display: flex;
          align-items: center;
          padding: 0 32px;
          background: rgba(10, 10, 18, .72);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -.05em;
          color: #fff;
          text-decoration: none;
        }
        .nav-icon { width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0; }
        .nav-links {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 28px;
        }
        .nav-links a, .nav-sign {
          font-size: 13px;
          font-weight: 500;
          color: var(--tm);
          text-decoration: none;
          transition: color .18s;
        }
        .nav-links a:hover, .nav-sign:hover { color: var(--t); }
        .nav-sign { margin-left: auto; }

        /* Common Typography */
        .sec-title {
          font-size: clamp(32px, 4.5vw, 52px);
          font-weight: 700;
          letter-spacing: -.03em;
          line-height: 1.1;
          max-width: 640px;
          margin: 0 auto 20px;
        }
        .sec-sub {
          font-size: clamp(15px, 1.6vw, 18px);
          color: var(--tm);
          max-width: 520px;
          margin: 0 auto;
          line-height: 1.7;
        }
        .grad {
          background: linear-gradient(135deg, #c4b5fd 0%, #818cf8 38%, #67e8f9 75%, #38bdf8 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Buttons */
        .btn-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
        .btn-p {
          padding: 13px 26px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          border: none;
          cursor: pointer;
          box-shadow: 0 0 0 1px rgba(255,255,255,.08) inset, 0 6px 28px rgba(124,58,237,.45);
          transition: transform .18s, box-shadow .18s;
        }
        .btn-p:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 0 1px rgba(255,255,255,.12) inset, 0 10px 36px rgba(124,58,237,.6);
        }
        .btn-s {
          padding: 13px 26px;
          border-radius: 10px;
          background: rgba(255, 255, 255, .05);
          border: 1px solid var(--brl);
          font-size: 14px;
          font-weight: 500;
          color: var(--tm);
          cursor: pointer;
          transition: background .18s, color .18s;
        }
        .btn-s:hover { background: rgba(255,255,255,.08); color: var(--t); }
        .btn--lg { font-size: 15px; padding: 15px 32px; }

        /* Hero */
        #hero {
          min-height: clamp(600px, 100vh, 900px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 100px 24px 120px;
          position: relative;
          overflow: hidden;
          background: #000;
        }
        .hero-noise { display: none; }
        h1.hero-title {
          font-size: clamp(52px, 8.5vw, 108px);
          font-weight: 900;
          letter-spacing: -.055em;
          line-height: .97;
          max-width: 860px;
          margin-bottom: 26px;
        }
        p.hero-sub {
          font-size: clamp(15px, 1.7vw, 19px);
          color: var(--tm);
          max-width: 500px;
          line-height: 1.68;
          margin-bottom: 40px;
          font-weight: 400;
        }
        .hero-visual { margin-top: 64px; width: 100%; max-width: 820px; }

        /* Hero Browser mockup */
        .hv-browser {
          background: var(--sf);
          border: 1px solid var(--brl);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 0 0 1px rgba(255,255,255,.04), 0 40px 90px rgba(0,0,0,.6), 0 0 100px rgba(124,58,237,.1);
        }
        .hv-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, .02);
          border-bottom: 1px solid var(--br);
        }
        .hd { width: 10px; height: 10px; border-radius: 50%; }
        .hd-r { background: #ff5f56; }
        .hd-y { background: #febc2e; }
        .hd-g { background: #28c840; }
        .hv-url {
          flex: 1;
          margin: 0 10px;
          background: rgba(255, 255, 255, .04);
          border-radius: 5px;
          padding: 4px 10px;
          font-size: 11px;
          color: var(--td);
          text-align: center;
        }
        .hv-app { padding: 28px 32px; }
        .hv-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: rgba(255, 255, 255, .04);
          border: 1px solid var(--br);
          border-radius: 10px;
          padding: 16px 18px;
          margin-bottom: 16px;
        }
        .hv-icon { font-size: 16px; margin-top: 1px; }
        .hv-lbl { font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--td); margin-bottom: 5px; }
        .hv-val { font-size: 14px; color: rgba(255,255,255,.82); line-height: 1.5; }
        .cursor {
          display: inline-block;
          width: 2px; height: 14px;
          background: var(--a);
          border-radius: 1px;
          animation: cur 1.2s step-end infinite;
          vertical-align: middle;
        }
        @keyframes cur { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .hv-stages { display: flex; gap: 8px; }
        .sp {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          background: rgba(255, 255, 255, .03);
          border: 1px solid var(--br);
          text-align: center;
        }
        .sp.on { background: rgba(124,58,237,.1); border-color: rgba(124,58,237,.3); }
        .sp-l { font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--td); }
        .sp.on .sp-l { color: #c4b5fd; }
        .sp-v { font-size: 11px; font-weight: 600; color: var(--tm); margin-top: 3px; }
        .sp.on .sp-v { color: var(--t); }

        /* Hero Scroll cue */
        .scroll-cue {
          position: absolute;
          bottom: 36px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          color: var(--td);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: .14em;
          text-transform: uppercase;
        }
        .scroll-line {
          width: 1px;
          height: 32px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,.22));
          animation: sline 2s ease-in-out infinite;
        }
        @keyframes sline { 0%, 100% { opacity: .4; } 50% { opacity: 1; } }

        /* Features */
        #features { padding: clamp(48px, 6vw, 96px) 0 0; }
        .feat-hdr { text-align: center; padding: 0 24px; margin-bottom: 28px; }
        #feat-driver { height: clamp(1600px, 700vh, 3200px); position: relative; }
        #feat-pin {
          position: sticky;
          top: 58px;
          height: clamp(500px, calc(100vh - 58px), 750px);
          display: flex;
          align-items: center;
          overflow: hidden;
        }
        .feat-tabs {
          display: grid;
          grid-template-columns: 5fr 7fr;
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 48px;
          align-items: center;
        }
        .feat-menu { display: flex; flex-direction: column; gap: 2px; }
        .feat-item {
          padding: 18px 22px;
          border-radius: 12px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: background .3s, border-color .3s;
        }
        .feat-item-num {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -.02em;
          color: #fff;
          margin-bottom: 7px;
          opacity: .28;
          transition: opacity .3s;
        }
        .feat-item.active .feat-item-num { opacity: 1; }
        .feat-item-title {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -.02em;
          line-height: 1.3;
          color: rgba(255, 255, 255, .35);
          transition: color .3s;
        }
        .feat-item.active .feat-item-title { color: var(--t); }
        .feat-item-desc {
          font-size: 13px;
          color: var(--tm);
          line-height: 1.6;
          margin-top: 8px;
          max-height: 0;
          overflow: hidden;
          transition: max-height .4s ease;
        }
        .feat-item.active .feat-item-desc { max-height: 120px; }
        .feat-item-note { font-size: 12px; font-weight: 600; color: var(--a); margin-top: 6px; display: none; }
        .feat-item.active .feat-item-note { display: block; }
        .coming-soon { font-size: 11px; font-weight: 500; color: var(--tm); letter-spacing: .04em; }
        .feat-panels { padding-left: 32px; }
        .feat-panel { display: none; }
        .feat-panel.active { display: block; }

        /* Features Panel visuals */
        .fi-vis {
          border-radius: 18px;
          overflow: hidden;
          aspect-ratio: 4 / 3;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(14,10,30,.98) 0%, rgba(6,5,16,.99) 100%);
        }
        .fv { width: 100%; height: 100%; padding: 24px; display: flex; flex-direction: column; gap: 10px; }
        .fv-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 13px;
          background: rgba(255, 255, 255, .04);
          border: 1px solid var(--br);
          border-radius: 9px;
          font-size: 13px;
          color: rgba(255, 255, 255, .72);
        }

        /* Features Glassmorphism Panels */
        .glp-input {
          display: flex; align-items: center; gap: 9px;
          padding: 10px 14px;
          background: rgba(124,58,237,.12);
          border: 1px solid rgba(196,181,253,.2);
          border-radius: 10px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          font-size: 12px; color: rgba(255,255,255,.85);
          flex-shrink: 0;
        }
        .glp-input-ic { font-size: 14px; }
        .glp-input-txt { flex: 1; }
        .glp-arrow {
          text-align: center; font-size: 10px; font-weight: 600; letter-spacing: .08em;
          color: #a78bfa; opacity: .8; flex-shrink: 0;
        }
        .glp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; flex: 1; }
        .glp-sec {
          padding: 7px 9px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 8px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .glp-sec--active { background: rgba(124,58,237,.1); border-color: rgba(196,181,253,.22); }
        .glp-sec-h {
          font-size: 8px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase;
          color: #a78bfa; margin-bottom: 3px;
        }
        .glp-sec--active .glp-sec-h { color: #e9d5ff; }
        .glp-sec-t { font-size: 10px; color: rgba(255,255,255,.52); line-height: 1.4; }

        /* MVP panel */
        .mvp-device {
          width: 100%;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 12px;
          overflow: hidden;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          flex-shrink: 0;
        }
        .mvp-bar {
          display: flex; gap: 5px; align-items: center;
          padding: 7px 10px;
          background: rgba(255,255,255,.04);
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .mvp-dot { width: 7px; height: 7px; border-radius: 50%; }
        .mvp-nav {
          display: flex; gap: 4px;
          padding: 6px 10px;
          background: rgba(255,255,255,.02);
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .mvp-ntab {
          flex: 1; text-align: center; font-size: 8px; font-weight: 600;
          padding: 4px 0; border-radius: 5px;
          color: rgba(255,255,255,.32);
        }
        .mvp-ntab.on {
          background: rgba(124,58,237,.2); color: #c4b5fd;
          border: 1px solid rgba(124,58,237,.3);
        }
        .mvp-body { padding: 8px 10px; display: flex; flex-direction: column; gap: 5px; }
        .mvp-cal {
          display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
          padding: 6px; background: rgba(255,255,255,.03); border-radius: 6px;
          border: 1px solid rgba(255,255,255,.06);
        }
        .mvp-cd {
          aspect-ratio: 1; border-radius: 3px; display: flex; align-items: center; justify-content: center;
          font-size: 7px; color: rgba(255,255,255,.28);
        }
        .mvp-cd.has { background: rgba(124,58,237,.25); color: #c4b5fd; }
        .mvp-cd.today { background: rgba(124,58,237,.55); color: #fff; font-weight: 700; }
        .mvp-resv {
          display: flex; align-items: center; gap: 6px; padding: 5px 8px;
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07);
          border-radius: 6px;
        }
        .mvp-resv-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .mvp-resv-info { flex: 1; }
        .mvp-resv-nm { font-size: 9px; font-weight: 600; color: rgba(255,255,255,.8); }
        .mvp-resv-tm { font-size: 8px; color: rgba(255,255,255,.32); }
        .mvp-resv-st { font-size: 8px; font-weight: 700; }
        .mvp-live-bar {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 10px;
          background: rgba(74,222,128,.06); border: 1px solid rgba(74,222,128,.18);
          border-radius: 7px;
        }
        .mvp-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 6px #4ade80; flex-shrink: 0; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{box-shadow:0 0 6px #4ade80;} 50%{box-shadow:0 0 12px #4ade80;} }
        .mvp-live-txt { font-size: 9px; color: rgba(110,231,216,.85); font-weight: 600; }
        .mvp-live-num { margin-left: auto; font-size: 10px; font-weight: 700; color: #4ade80; }

        /* Service Build panel */
        .svc-pipe { display: flex; flex-direction: column; gap: 6px; width: 100%; }
        .svc-stage {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 9px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .svc-stage.done { border-color: rgba(74,222,128,.22); background: rgba(74,222,128,.04); }
        .svc-stage.active { border-color: rgba(124,58,237,.32); background: rgba(124,58,237,.08); }
        .svc-ic { font-size: 13px; width: 20px; text-align: center; flex-shrink: 0; }
        .svc-info { flex: 1; }
        .svc-name { font-size: 10px; font-weight: 600; color: rgba(255,255,255,.8); }
        .svc-detail { font-size: 8px; color: rgba(255,255,255,.35); margin-top: 1px; }
        .svc-badge {
          font-size: 8px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase;
          padding: 2px 7px; border-radius: 100px; white-space: nowrap;
        }
        .svc-badge.done { background: rgba(74,222,128,.14); color: #4ade80; border: 1px solid rgba(74,222,128,.25); }
        .svc-badge.run  { background: rgba(124,58,237,.2);  color: #c4b5fd; border: 1px solid rgba(124,58,237,.35); }
        .svc-badge.wait { background: rgba(255,255,255,.05); color: rgba(255,255,255,.28); border: 1px solid rgba(255,255,255,.08); }
        .svc-commit {
          display: flex; align-items: center; gap: 7px;
          padding: 5px 10px;
          background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.06);
          border-radius: 7px; font-size: 9px;
        }
        .svc-commit-hash { font-family: monospace; color: #818cf8; font-size: 9px; }
        .svc-commit-msg { color: rgba(255,255,255,.48); flex: 1; }
        .svc-commit-time { color: rgba(255,255,255,.22); flex-shrink: 0; }

        /* Ops panel */
        .ops-kpi { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; flex-shrink: 0; }
        .ops-card {
          padding: 8px 10px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 9px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .ops-card--purple { border-color: rgba(124,58,237,.25); background: rgba(124,58,237,.07); }
        .ops-card--teal   { border-color: rgba(110,231,216,.2);  background: rgba(110,231,216,.05); }
        .ops-card--green  { border-color: rgba(74,222,128,.18);  background: rgba(74,222,128,.04); }
        .ops-v { font-size: 18px; font-weight: 800; letter-spacing: -.03em; }
        .ops-v--purple { color: #c4b5fd; }
        .ops-v--teal   { color: var(--a); }
        .ops-v--green  { color: #4ade80; }
        .ops-l { font-size: 8px; color: rgba(255,255,255,.35); margin-top: 2px; }
        .ops-trend { font-size: 8px; font-weight: 600; margin-top: 2px; color: #4ade80; }
        .ops-spark {
          height: 30px; padding: 2px 0;
          background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06);
          border-radius: 7px; overflow: hidden; flex-shrink: 0;
        }
        .ops-spark svg { width: 100%; height: 100%; }
        .ops-feed { display: flex; flex-direction: column; gap: 4px; flex: 1; overflow: hidden; }
        .ops-fitem {
          display: flex; align-items: center; gap: 7px;
          padding: 5px 8px;
          background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06);
          border-radius: 7px;
        }
        .ops-fstar { color: #fbbf24; font-size: 8px; letter-spacing: 1px; flex-shrink: 0; }
        .ops-ftxt  { font-size: 9px; color: rgba(255,255,255,.52); line-height: 1.4; flex: 1; }
        .ops-fuser { font-size: 8px; color: rgba(255,255,255,.22); flex-shrink: 0; }

        /* Trust */
        #trust {
          padding: clamp(44px, 5.5vw, 88px) 24px;
          text-align: center;
          background: var(--sf);
        }
        .trust-stats {
          display: flex;
          justify-content: center;
          max-width: 760px;
          margin: 52px auto 60px;
          flex-wrap: wrap;
        }
        .ts { flex: 1; min-width: 160px; padding: 28px 16px; }
        .ts-v {
          font-size: clamp(32px, 4.5vw, 52px);
          font-weight: 900;
          letter-spacing: -.045em;
          line-height: 1;
          margin-bottom: 7px;
          background: linear-gradient(135deg, #c4b5fd, #818cf8);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .ts-v--cyan { background: linear-gradient(135deg, #67e8f9, #38bdf8); -webkit-background-clip: text; background-clip: text; }
        .ts-v--teal { background: linear-gradient(135deg, #6EE7D8, #34d399); -webkit-background-clip: text; background-clip: text; }
        .ts-v--pink { background: linear-gradient(135deg, #f0abfc, #c084fc); -webkit-background-clip: text; background-clip: text; }
        .ts-l { font-size: 12px; color: var(--tm); font-weight: 500; }
        .ptitle { font-size: 11px; font-weight: 600; letter-spacing: .13em; text-transform: uppercase; color: var(--td); margin-bottom: 26px; }
        .partners { display: flex; gap: 36px; justify-content: center; flex-wrap: wrap; }
        .pname { font-size: 13px; font-weight: 700; letter-spacing: -.02em; color: rgba(255,255,255,.18); transition: color .2s; }
        .pname:hover { color: rgba(255,255,255,.4); }

        /* Use Cases */
        #cases { padding: clamp(44px, 5.5vw, 88px) 40px; max-width: 1100px; margin: 0 auto; }
        .cases-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
          margin-top: 52px;
        }
        .cc {
          background: var(--sf);
          border: 1px solid var(--br);
          border-radius: 16px;
          overflow: hidden;
          transition: border-color .22s, transform .22s;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .cc:hover { border-color: rgba(124,58,237,.38); transform: translateY(-4px); }
        .cc-vis {
          height: 160px;
          background: #161622;
          border-bottom: 1px solid var(--br);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .cc-vis-real { position: relative; }
        .cc-real-overlay {
          position: absolute;
          inset: 0;
          background: rgba(10, 10, 18, .75);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity .2s;
          backdrop-filter: blur(4px);
        }
        .cc-real:hover .cc-real-overlay { opacity: 1; }
        .cc-real-link { font-size: 13px; font-weight: 600; color: #fff; border: 1px solid rgba(255,255,255,.25); padding: 8px 18px; border-radius: 8px; }
        .cc-lines { display: flex; flex-direction: column; gap: 7px; padding: 18px; width: 100%; }
        .ccl { height: 7px; border-radius: 3px; background: rgba(255,255,255,.15); }
        .cc-badge {
          position: absolute;
          top: 12px; right: 12px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          padding: 3px 9px;
          border-radius: 100px;
        }
        .cb-mvp  { background: rgba(124,58,237,.18); border: 1px solid rgba(124,58,237,.3);   color: #c4b5fd; }
        .cb-beta { background: rgba(96,165,250,.13);  border: 1px solid rgba(96,165,250,.27);  color: #93c5fd; }
        .cb-wip  { background: rgba(110,231,216,.1);  border: 1px solid rgba(110,231,216,.2);  color: var(--a); }
        .cc-body  { padding: 16px 18px; }
        .cc-title { font-size: 14px; font-weight: 700; margin-bottom: 5px; }
        .cc-sub   { font-size: 11px; color: var(--tm); line-height: 1.6; }
        .cc-meta  { display: flex; align-items: center; gap: 7px; margin-top: 12px; }
        .cc-av    { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; }
        .cc-au    { font-size: 10px; color: rgba(255,255,255,.45); }

        /* CTA */
        #cta {
          padding: clamp(56px, 7vw, 112px) 24px;
          text-align: center;
          background: #000;
        }
        .cta-title {
          font-size: clamp(36px, 6vw, 72px);
          font-weight: 900;
          letter-spacing: -.055em;
          line-height: 1.02;
          max-width: 700px;
          margin: 0 auto 40px;
        }
        .cta-gif {
          display: block;
          width: 100%;
          max-width: 380px;
          margin: 0 auto 48px;
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(0,0,0,.6);
        }

        /* Footer */
        #foot {
          padding: 40px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 14px;
        }
        .foot-logo  { font-size: 14px; font-weight: 800; letter-spacing: -.04em; color: rgba(255,255,255,.25); }
        .foot-copy  { font-size: 11px; color: var(--td); text-align: center; }
        .foot-links { display: flex; gap: 20px; justify-self: end; }
        .foot-links a { font-size: 11px; color: var(--td); text-decoration: none; transition: color .18s; }
        .foot-links a:hover { color: var(--tm); }

        /* Responsive */
        @media (max-width: 768px) {
          #nav { padding: 0 18px; }
          .nav-links { display: none; }
          #feat-driver { height: auto; }
          #feat-pin { position: static; height: auto; display: block; padding: 32px 0; }
          .feat-tabs { grid-template-columns: 1fr; padding: 0 18px; }
          .feat-panels { padding-left: 0; margin-top: 24px; }
          #cases { padding: 64px 18px; }
          #foot { grid-template-columns: 1fr; text-align: center; }
          .foot-links { justify-self: center; }
        }

        /* BH Brand Hero styles */
        #bh-brand-hero *, #bh-brand-hero *::before, #bh-brand-hero *::after { margin:0; padding:0; box-sizing:border-box; }
        #bh-brand-hero {
          --bg:    #000;
          --sf:    rgba(10, 12, 24, 0.55);
          --t:     #F0F0FF;
          --tm:    rgba(240,240,255,.55);
          --td:    rgba(240,240,255,.28);
          --br:    rgba(255,255,255,.07);
          --brl:   rgba(255,255,255,.11);
          --glass-bg:      rgba(8, 10, 20, 0.45);
          --glass-border:  rgba(255,255,255,0.10);
          --glass-blur:    blur(28px) saturate(180%);
          --glass-blur-sm: blur(16px) saturate(160%);
          position: relative; width: 100%; height: 600px;
          background: var(--bg); overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        #bh-brand-hero::before {
          content: ''; position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.022) 1px, transparent 1px);
          background-size: 38px 38px; pointer-events: none; z-index: 0;
        }
        @media (max-width: 768px) { #bh-brand-hero { height: 520px; } }
        #bh-hero-canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; }
        #bh-hero-svg    { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; z-index: 2; }
        #bh-idea-group, #bh-sentence-group, #bh-tree-group { will-change: opacity; }
        #bh-hero-ui     { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 3; opacity: 0; }
        #bh-brand-hero .cards-scene {
          position: relative; width: 520px; height: 440px;
          display: flex; align-items: center; justify-content: center; perspective: 1000px;
        }
        @media (max-width: 600px) { #bh-brand-hero .cards-scene { width: 92vw; height: auto; } }
        #bh-brand-hero .ui-card {
          position: absolute; border-radius: 26px; overflow: hidden;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);
          border: 1px solid var(--glass-border);
        }
        #bh-brand-hero .card-bg {
          width: 185px;
          box-shadow: 0 20px 60px rgba(0,0,0,.60), inset 0 1px 0 rgba(255,255,255,0.10);
        }
        #bh-brand-hero .card-left  { left: 0; top: 50%; transform: translateY(-50%) translateX(-10px) rotateY(12deg) scale(0.78); transform-origin: right center; z-index: 1; }
        #bh-brand-hero .card-right { right: 0; top: 50%; transform: translateY(-50%) translateX(10px) rotateY(-12deg) scale(0.78); transform-origin: left center; z-index: 1; }
        #bh-brand-hero .card-mini-hero { height: 120px; position: relative; overflow: hidden; background: #04060f; }
        #bh-brand-hero .card-mini-blob {
          position: absolute; inset: -40%;
          animation: bh-mini-blob-drift 9s ease-in-out infinite alternate;
          filter: blur(20px); opacity: 0.95;
        }
        #bh-brand-hero .card-left .card-mini-blob {
          background:
            radial-gradient(ellipse 80% 85% at 35% 55%, rgba(96,165,250,0.70) 0%, transparent 52%),
            radial-gradient(ellipse 65% 75% at 75% 30%, rgba(110,231,216,0.55) 0%, transparent 48%),
            radial-gradient(ellipse 50% 60% at 15% 80%, rgba(59,130,246,0.45) 0%, transparent 46%);
        }
        #bh-brand-hero .card-right .card-mini-blob {
          background:
            radial-gradient(ellipse 80% 85% at 65% 50%, rgba(251,100,40,0.68) 0%, transparent 52%),
            radial-gradient(ellipse 65% 75% at 25% 65%, rgba(236,72,153,0.55) 0%, transparent 48%),
            radial-gradient(ellipse 50% 60% at 80% 20%, rgba(251,191,36,0.45) 0%, transparent 46%);
        }
        @keyframes bh-mini-blob-drift { 0% { transform:translate(0,0) scale(1); } 100% { transform:translate(6px,-8px) scale(1.06); } }
        #bh-brand-hero .card-mini-hero::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 40px;
          background: linear-gradient(to bottom, transparent, rgba(8,10,20,0.70)); pointer-events: none;
        }
        #bh-brand-hero .card-mini-header {
          position: absolute; bottom: 10px; left: 14px; right: 14px;
          display: flex; align-items: flex-end; justify-content: space-between;
        }
        #bh-brand-hero .mini-header-title { font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: rgba(240,240,255,0.55); }
        #bh-brand-hero .mini-header-val {
          font-size: 22px; font-weight: 900; letter-spacing: -.04em;
          background: linear-gradient(135deg, #c4b5fd, #818cf8);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        }
        #bh-brand-hero .card-left .mini-header-val  { background: linear-gradient(135deg, #67e8f9, #60a5fa); -webkit-background-clip: text; background-clip: text; }
        #bh-brand-hero .card-right .mini-header-val { background: linear-gradient(135deg, #fbbf24, #f97316); -webkit-background-clip: text; background-clip: text; }
        #bh-brand-hero .card-mini-body { padding: 12px 14px 14px; }
        #bh-brand-hero .mini-week-row { display: flex; gap: 4px; margin-bottom: 10px; }
        #bh-brand-hero .mini-day { flex: 1; text-align: center; font-size: 7.5px; font-weight: 600; color: var(--td); padding: 4px 0; border-radius: 8px; background: rgba(255,255,255,0.04); }
        #bh-brand-hero .mini-day.active { background: rgba(96,165,250,0.18); border: 1px solid rgba(96,165,250,0.25); color: #93c5fd; }
        #bh-brand-hero .card-right .mini-day.active { background: rgba(251,100,40,0.18); border: 1px solid rgba(251,100,40,0.22); color: #fbb97c; }
        #bh-brand-hero .mini-stat-list { display: flex; flex-direction: column; gap: 6px; }
        #bh-brand-hero .mini-stat-row { display: flex; align-items: center; justify-content: space-between; }
        #bh-brand-hero .mini-stat-name { font-size: 8.5px; color: var(--td); }
        #bh-brand-hero .mini-stat-bar-wrap { flex: 1; height: 3px; background: rgba(255,255,255,0.06); border-radius: 2px; margin: 0 8px; overflow: hidden; }
        #bh-brand-hero .mini-stat-bar-fill { height: 100%; border-radius: 2px; animation: bh-mini-fill-in 1.8s ease-out 0.4s both; }
        #bh-brand-hero .mini-stat-bar-fill.f1 { width: 78%; background: linear-gradient(90deg,#67e8f9,#60a5fa); }
        #bh-brand-hero .mini-stat-bar-fill.f2 { width: 55%; background: linear-gradient(90deg,#c4b5fd,#818cf8); }
        #bh-brand-hero .mini-stat-bar-fill.f3 { width: 90%; background: linear-gradient(90deg,#fbbf24,#f97316); }
        @keyframes bh-mini-fill-in { from { transform:scaleX(0); transform-origin:left; } to { transform:scaleX(1); transform-origin:left; } }
        #bh-brand-hero .mini-stat-pct { font-size: 8px; font-weight: 700; color: var(--tm); min-width: 22px; text-align: right; }
        #bh-brand-hero .card-main {
          width: 360px; z-index: 3;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);
          border: 1px solid var(--glass-border); border-radius: 30px;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.06), 0 40px 100px rgba(0,0,0,.72), 0 0 140px rgba(124,58,237,.30), 0 0 60px rgba(217,100,255,.12), inset 0 1px 0 rgba(255,255,255,0.12);
          will-change: transform, opacity, filter;
        }
        @media (max-width: 600px) { #bh-brand-hero .card-main { width: min(345px, 88vw); } }
        #bh-brand-hero .card-hero-area { height: 168px; position: relative; overflow: hidden; background: #03050e; border-radius: 30px 30px 0 0; }
        #bh-brand-hero .card-hero-bg {
          position: absolute; inset: -30%;
          animation: bh-hero-gradient-shift 8s ease-in-out infinite alternate;
          background:
            radial-gradient(ellipse 85% 80% at 68% 58%, rgba(217,70,239,0.82) 0%, transparent 48%),
            radial-gradient(ellipse 75% 90% at 22% 38%, rgba(124,58,237,0.78) 0%, transparent 52%),
            radial-gradient(ellipse 60% 70% at 84% 16%, rgba(6,182,212,0.62) 0%, transparent 48%),
            radial-gradient(ellipse 55% 65% at 8%  82%, rgba(251,100,40,0.58) 0%, transparent 45%),
            radial-gradient(ellipse 40% 50% at 50% 50%, rgba(96,165,250,0.30) 0%, transparent 55%);
          filter: blur(2px);
        }
        @keyframes bh-hero-gradient-shift {
          0%   { transform: translate(0,0)      scale(1)    rotate(0deg);   }
          35%  { transform: translate(8px,-10px) scale(1.05) rotate(1.8deg);  }
          70%  { transform: translate(-6px,5px)  scale(0.97) rotate(-1.2deg); }
          100% { transform: translate(10px,3px)  scale(1.04) rotate(2.5deg);  }
        }
        #bh-brand-hero .card-hero-area::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(8,10,20,0) 30%, rgba(8,10,20,0.20) 60%, rgba(8,10,20,0.65) 100%);
          pointer-events: none;
        }
        #bh-brand-hero .card-hero-area::before {
          content: ''; position: absolute; top: 0; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.30), transparent);
          z-index: 2; pointer-events: none;
        }
        #bh-brand-hero .card-hero-content {
          position: absolute; inset: 0; z-index: 3;
          padding: 14px 18px 12px; display: flex; flex-direction: column; justify-content: space-between;
        }
        #bh-brand-hero .hero-top-bar { display: flex; align-items: center; justify-content: space-between; }
        #bh-brand-hero .hero-title { font-size: 13px; font-weight: 700; letter-spacing: -.015em; color: rgba(255,255,255,0.92); text-shadow: 0 1px 8px rgba(0,0,0,0.5); }
        #bh-brand-hero .hero-live { display: flex; align-items: center; gap: 5px; font-size: 9px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: #4ade80; }
        #bh-brand-hero .live-dot { width: 5px; height: 5px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 8px #4ade80; animation: bh-dot-pulse 2.2s ease-in-out infinite; }
        @keyframes bh-dot-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.45; transform:scale(.7); } }
        #bh-brand-hero .hero-date { font-size: 9.5px; color: rgba(255,255,255,0.45); letter-spacing: .02em; margin-top: 2px; }
        #bh-brand-hero .hero-stats-row { display: flex; gap: 8px; }
        #bh-brand-hero .hero-stat-pill {
          display: flex; flex-direction: column; align-items: center;
          padding: 7px 12px; border-radius: 14px; min-width: 58px;
          background: rgba(255,255,255,0.10);
          backdrop-filter: blur(12px) saturate(140%); -webkit-backdrop-filter: blur(12px) saturate(140%);
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
          will-change: opacity, transform;
        }
        #bh-brand-hero .hsp-val {
          font-size: 18px; font-weight: 900; letter-spacing: -.04em; line-height: 1;
          background: linear-gradient(135deg, #e0d8ff, #c4b5fd);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        }
        #bh-brand-hero .hero-stat-pill.teal .hsp-val { background: linear-gradient(135deg, #6ee7d8, #34d399); -webkit-background-clip: text; background-clip: text; }
        #bh-brand-hero .hero-stat-pill.blue  .hsp-val { background: linear-gradient(135deg, #93c5fd, #60a5fa); -webkit-background-clip: text; background-clip: text; }
        #bh-brand-hero .hsp-lbl { font-size: 7.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: rgba(255,255,255,0.42); margin-top: 2px; }
        #bh-brand-hero .hero-progress-bar { height: 2px; background: rgba(255,255,255,0.06); position: relative; overflow: hidden; }
        #bh-brand-hero .hero-progress-fill { position: absolute; inset: 0; transform: scaleX(0); transform-origin: left center; background: linear-gradient(90deg, #7C3AED, #60A5FA, #6EE7D8, #D964EF); }
        #bh-brand-hero .card-app-body { padding: 14px 16px 10px; background: rgba(6,8,18,0.35); }
        #bh-brand-hero .app-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        #bh-brand-hero .app-section-title { font-size: 11px; font-weight: 700; color: var(--tm); letter-spacing: .02em; }
        #bh-brand-hero .app-section-badge { font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 20px; background: rgba(124,58,237,0.28); border: 1px solid rgba(124,58,237,0.40); color: #c4b5fd; }
        #bh-brand-hero .app-booking-list { display: flex; flex-direction: column; gap: 7px; }
        #bh-brand-hero .booking-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 16px;
          background: rgba(255,255,255,0.045); border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          will-change: opacity, transform;
        }
        #bh-brand-hero .bi-avatar { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.92); }
        #bh-brand-hero .av1 { background: linear-gradient(135deg, #7C3AED, #60A5FA); }
        #bh-brand-hero .av2 { background: linear-gradient(135deg, #6EE7D8, #34d399); }
        #bh-brand-hero .av3 { background: linear-gradient(135deg, #f97316, #fbbf24); }
        #bh-brand-hero .bi-info { flex: 1; display: flex; flex-direction: column; gap: 1.5px; }
        #bh-brand-hero .bi-name { font-size: 11.5px; font-weight: 600; color: var(--t); }
        #bh-brand-hero .bi-svc  { font-size: 9px; color: var(--td); }
        #bh-brand-hero .bi-time { font-size: 10px; font-weight: 700; color: var(--td); min-width: 32px; text-align: right; letter-spacing: .02em; }
        #bh-brand-hero .bi-tag { font-size: 8px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 3px 8px; border-radius: 20px; white-space: nowrap; }
        #bh-brand-hero .bi-tag.confirmed { background: rgba(110,231,216,.12); border: 1px solid rgba(110,231,216,.22); color: #6ee7d8; animation: bh-tag-glow 3.5s ease-in-out infinite; }
        #bh-brand-hero .bi-tag.waiting   { background: rgba(196,181,253,.12); border: 1px solid rgba(196,181,253,.25); color: #c4b5fd; animation: bh-tag-glow-p 3.5s ease-in-out 1.2s infinite; }
        @keyframes bh-tag-glow   { 0%,100% { box-shadow:none; } 50% { box-shadow:0 0 8px rgba(110,231,216,.32); } }
        @keyframes bh-tag-glow-p { 0%,100% { box-shadow:none; } 50% { box-shadow:0 0 8px rgba(196,181,253,.28); } }
        #bh-brand-hero .card-bottom-nav {
          display: flex; align-items: center; justify-content: space-around;
          padding: 10px 16px 13px; background: rgba(6,8,18,0.50);
          backdrop-filter: blur(20px) saturate(150%); -webkit-backdrop-filter: blur(20px) saturate(150%);
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        #bh-brand-hero .nav-item { display: flex; flex-direction: column; align-items: center; gap: 3px; opacity: 0.40; padding: 4px 10px; border-radius: 12px; }
        #bh-brand-hero .nav-item.active { opacity: 1; }
        #bh-brand-hero .nav-icon { font-size: 16px; line-height: 1; color: rgba(240,240,255,0.60); width: auto; height: auto; border-radius: 0; flex-shrink: unset; }
        #bh-brand-hero .nav-item.active .nav-icon { color: #c4b5fd; }
        #bh-brand-hero .nav-item span { font-size: 8px; font-weight: 600; letter-spacing: .04em; color: rgba(240,240,255,0.55); }
        #bh-brand-hero .nav-item.active span { color: rgba(196,181,253,0.90); }
        @keyframes bh-card-glow-breathe {
          0%,100% { box-shadow: 0 0 0 1px rgba(255,255,255,.05), 0 40px 100px rgba(0,0,0,.72), 0 0 100px rgba(124,58,237,.20), 0 0 45px rgba(217,100,255,.08), inset 0 1px 0 rgba(255,255,255,0.10); }
          50%     { box-shadow: 0 0 0 1px rgba(255,255,255,.09), 0 40px 100px rgba(0,0,0,.72), 0 0 160px rgba(124,58,237,.42), 0 0 80px rgba(217,100,255,.18), inset 0 1px 0 rgba(255,255,255,0.15); }
        }
        #bh-brand-hero .card-main.idle { animation: bh-card-glow-breathe 5.5s ease-in-out infinite; }
      `}</style>

      {/* NAV */}
      <header id="nav">
        <Link href="/" className="nav-logo">
          <img src="/img/favicon-32x32.png" className="nav-icon" alt="" />Servora
        </Link>
        <nav className="nav-links">
          <a href="#">Support</a>
          <a href="#">Pricing</a>
        </nav>
        <Link href="/login" className="nav-sign">Sign in</Link>
      </header>

      {/* HERO */}
      <section id="hero">
        <div className="hero-noise"></div>
        <h1 className="hero-title">{"생각이 "}<span className="grad">서비스가</span><br />되는 순간</h1>
        <p className="hero-sub">하나의 문장만 있어도 시작할 수 있습니다. Servora는 당신의 생각을 AI와 함께 천천히 꺼내고 하나의 서비스로 구체화합니다.</p>
        <div className="btn-row">
          <Link href="/signup"><button className="btn-p">아이디어 꺼내기</button></Link>
          <a href="#cases"><button className="btn-s">{"아이디어 살펴보기 \u2192"}</button></a>
        </div>
        <div className="hero-visual">
          <div className="hv-browser">
            <div className="hv-bar">
              <div className="hd hd-r"></div>
              <div className="hd hd-y"></div>
              <div className="hd hd-g"></div>
              <div className="hv-url">servora.io/new</div>
            </div>
            <div className="hv-app">
              <div className="hv-row">
                <div className="hv-icon">{"💡"}</div>
                <div>
                  <div className="hv-lbl">아이디어 입력</div>
                  <div className="hv-val">동네 소규모 자영업자들이 쉽게 예약을 관리하고 고객과 소통할 수 있는 서비스<span className="cursor"></span></div>
                </div>
              </div>
              <div className="hv-stages">
                <div className="sp on"><div className="sp-l">기획안</div><div className="sp-v">완료</div></div>
                <div className="sp on"><div className="sp-l">시안</div><div className="sp-v">완료</div></div>
                <div className="sp on"><div className="sp-l">MVP</div><div className="sp-v">완료</div></div>
                <div className="sp"><div className="sp-l">서비스</div><div className="sp-v">{"생성 중\u2026"}</div></div>
              </div>
            </div>
          </div>
        </div>
        <div className="scroll-cue">
          <span>Scroll</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* BH Brand Hero */}
      <div id="bh-brand-hero" ref={brandHeroRef}>
        <canvas id="bh-hero-canvas" ref={canvasRef} aria-hidden="true"></canvas>
        <svg id="bh-hero-svg" ref={svgRef} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <filter id="bh-idea-glow-f" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="bh-idea-fade-f" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur id="bh-idea-blur-node" in="SourceGraphic" stdDeviation="12" />
            </filter>
            <filter id="bh-sentence-fade-f" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur id="bh-sentence-blur-node" in="SourceGraphic" stdDeviation="16" />
            </filter>
          </defs>
          <g id="bh-idea-group" opacity="0" filter="url(#bh-idea-fade-f)">
            <text id="bh-idea-text" x="50%" y="42%" textAnchor="middle" dominantBaseline="middle"
              fontFamily="Inter, sans-serif" fontWeight="900" fontSize="92" letterSpacing="1"
              fill="rgba(240,240,255,0.96)">idea</text>
          </g>
          <g id="bh-sentence-group" opacity="0" filter="url(#bh-sentence-fade-f)">
            <text id="bh-sentence-text" x="50%" y="42%" textAnchor="middle" dominantBaseline="middle"
              fontFamily="Inter, sans-serif" fontWeight="500" fontSize="22" letterSpacing="20"
              fill="rgba(240,240,255,0.88)">{"예약 관리 서비스를 만들고 싶어요"}</text>
          </g>
          <g id="bh-tree-group" opacity="0"></g>
        </svg>
        <div id="bh-hero-ui" ref={heroUiRef} aria-label="예약 관리 서비스 완성 화면">
          <div className="cards-scene">
            {/* Left card */}
            <div className="ui-card card-bg card-left">
              <div className="card-mini-hero">
                <div className="card-mini-blob"></div>
                <div className="card-mini-header">
                  <div className="mini-header-title">일정 관리</div>
                  <div className="mini-header-val">{"18건"}</div>
                </div>
              </div>
              <div className="card-mini-body">
                <div className="mini-week-row">
                  <div className="mini-day">월</div><div className="mini-day">화</div>
                  <div className="mini-day active">수</div><div className="mini-day">목</div>
                  <div className="mini-day">금</div><div className="mini-day">토</div><div className="mini-day">일</div>
                </div>
                <div className="mini-stat-list">
                  <div className="mini-stat-row"><span className="mini-stat-name">오전</span><div className="mini-stat-bar-wrap"><div className="mini-stat-bar-fill f1"></div></div><span className="mini-stat-pct">78%</span></div>
                  <div className="mini-stat-row"><span className="mini-stat-name">오후</span><div className="mini-stat-bar-wrap"><div className="mini-stat-bar-fill f2"></div></div><span className="mini-stat-pct">55%</span></div>
                  <div className="mini-stat-row"><span className="mini-stat-name">저녁</span><div className="mini-stat-bar-wrap"><div className="mini-stat-bar-fill f3"></div></div><span className="mini-stat-pct">90%</span></div>
                </div>
              </div>
            </div>
            {/* Right card */}
            <div className="ui-card card-bg card-right">
              <div className="card-mini-hero">
                <div className="card-mini-blob"></div>
                <div className="card-mini-header">
                  <div className="mini-header-title">고객 관리</div>
                  <div className="mini-header-val">{"142명"}</div>
                </div>
              </div>
              <div className="card-mini-body">
                <div className="mini-week-row">
                  <div className="mini-day">1주</div><div className="mini-day">2주</div>
                  <div className="mini-day active">3주</div><div className="mini-day">4주</div>
                </div>
                <div className="mini-stat-list" style={{ marginTop: '4px' }}>
                  <div className="mini-stat-row"><span className="mini-stat-name">신규</span><div className="mini-stat-bar-wrap"><div className="mini-stat-bar-fill f3"></div></div><span className="mini-stat-pct">{"12명"}</span></div>
                  <div className="mini-stat-row"><span className="mini-stat-name">재방문</span><div className="mini-stat-bar-wrap"><div className="mini-stat-bar-fill f1" style={{ width: '88%' }}></div></div><span className="mini-stat-pct">88%</span></div>
                  <div className="mini-stat-row"><span className="mini-stat-name">완료</span><div className="mini-stat-bar-wrap"><div className="mini-stat-bar-fill f2" style={{ width: '94%' }}></div></div><span className="mini-stat-pct">94%</span></div>
                </div>
              </div>
            </div>
            {/* Main card */}
            <div className="ui-card card-main">
              <div className="card-hero-area">
                <div className="card-hero-bg"></div>
                <div className="card-hero-content">
                  <div className="hero-top-bar">
                    <span className="hero-title">예약 현황</span>
                    <span className="hero-live"><span className="live-dot"></span>Live</span>
                  </div>
                  <div className="hero-date">{"2026년 3월 20일 \u00B7 목요일"}</div>
                  <div className="hero-stats-row">
                    <div className="hero-stat-pill"><span className="hsp-val">0</span><span className="hsp-lbl">전체</span></div>
                    <div className="hero-stat-pill teal"><span className="hsp-val">0</span><span className="hsp-lbl">완료율</span></div>
                    <div className="hero-stat-pill blue"><span className="hsp-val">0</span><span className="hsp-lbl">오늘</span></div>
                  </div>
                </div>
              </div>
              <div className="hero-progress-bar"><div className="hero-progress-fill"></div></div>
              <div className="card-app-body">
                <div className="app-section-header">
                  <span className="app-section-title">오늘의 예약</span>
                  <span className="app-section-badge">3</span>
                </div>
                <div className="app-booking-list">
                  <div className="booking-item"><div className="bi-avatar av1">지</div><div className="bi-info"><span className="bi-name">김지은</span><span className="bi-svc">{"컷 + 펌"}</span></div><span className="bi-time">10:00</span><span className="bi-tag confirmed">확정</span></div>
                  <div className="booking-item"><div className="bi-avatar av2">수</div><div className="bi-info"><span className="bi-name">이수현</span><span className="bi-svc">네일 케어</span></div><span className="bi-time">11:30</span><span className="bi-tag waiting">대기</span></div>
                  <div className="booking-item"><div className="bi-avatar av3">민</div><div className="bi-info"><span className="bi-name">박민서</span><span className="bi-svc">두피 트리트먼트</span></div><span className="bi-time">14:00</span><span className="bi-tag confirmed">확정</span></div>
                </div>
              </div>
              <div className="card-bottom-nav">
                <div className="nav-item active"><div className="nav-icon">{"⊙"}</div><span>홈</span></div>
                <div className="nav-item"><div className="nav-icon">{"⊞"}</div><span>예약</span></div>
                <div className="nav-item"><div className="nav-icon">{"⊚"}</div><span>고객</span></div>
                <div className="nav-item"><div className="nav-icon">{"⊛"}</div><span>설정</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section id="features">
        <div className="feat-hdr">
          <h2 className="sec-title">{"기획하고, 시안을 보고,"}<br />출시하세요</h2>
          <p className="sec-sub">Servora는 기획안 작성부터 화면 시안, MVP 제작, 이후 운영 단계까지 서비스가 만들어지는 흐름 전체를 연결합니다.</p>
        </div>
        <div id="feat-driver" ref={featDriverRef}>
          <div id="feat-pin">
            <div className="feat-tabs">
              <div className="feat-menu">
                <div className="feat-item active" data-tab="0">
                  <div className="feat-item-num">기획안</div>
                  <div className="feat-item-title">아이디어를 서비스 기획안으로 정리합니다</div>
                  <div className="feat-item-desc">하나의 문장, 짧은 설명, 메모 수준의 입력만 있어도 괜찮습니다. Servora는 아이디어의 목적, 사용자, 문제, 핵심 가치를 정리해 기획안 초안으로 구체화합니다.</div>
                  <div className="feat-item-note">무엇을 만들지 막막한 순간에도, 시작 가능한 형태로 정리됩니다</div>
                </div>
                <div className="feat-item" data-tab="1">
                  <div className="feat-item-num">시안</div>
                  <div className="feat-item-title">구조를 화면으로 빠르게 확인합니다</div>
                  <div className="feat-item-desc">기획안과 정보구조를 바탕으로 주요 화면 시안을 생성합니다. 텍스트로만 상상하던 서비스를 실제 화면 흐름으로 확인할 수 있습니다.</div>
                  <div className="feat-item-note">{"머릿속 서비스가 처음으로 '보이는 형태'가 됩니다"}</div>
                </div>
                <div className="feat-item" data-tab="2">
                  <div className="feat-item-num">MVP</div>
                  <div className="feat-item-title">검토 가능한 MVP로 이어집니다</div>
                  <div className="feat-item-desc">시안에서 끝나지 않고 실제 검토 가능한 MVP 형태까지 연결합니다. 핵심 기능 중심으로 빠르게 구성해 아이디어를 현실적인 단계로 끌어올립니다.</div>
                  <div className="feat-item-note">출시를 위한 첫 번째 형태를 더 빠르게 확인할 수 있습니다</div>
                </div>
                <div className="feat-item" data-tab="3">
                  <div className="feat-item-num">{"서비스 "}<span className="coming-soon">COMING SOON</span></div>
                  <div className="feat-item-title">서비스로 이어지는 다음 단계를 준비합니다</div>
                  <div className="feat-item-desc">기획안, 시안, MVP를 넘어 실제 서비스 구축 흐름으로 연결될 수 있도록 준비합니다.</div>
                  <div className="feat-item-note">생성된 결과물이 다음 제작 단계의 기반이 됩니다</div>
                </div>
                <div className="feat-item" data-tab="4">
                  <div className="feat-item-num">{"운영 "}<span className="coming-soon">COMING SOON</span></div>
                  <div className="feat-item-title">만든 뒤에도 계속 다듬고 운영합니다</div>
                  <div className="feat-item-desc">서비스는 만드는 순간보다 운영하는 과정이 더 길 수 있습니다. 수정, 정리, 관리, 개선까지 이어지는 운영 관점의 흐름도 함께 준비합니다.</div>
                  <div className="feat-item-note">출시 이후의 서비스도 계속 자라날 수 있도록</div>
                </div>
              </div>
              <div className="feat-panels">
                {/* Panel 0 - Plan */}
                <div className="feat-panel active" data-tab="0">
                  <div className="fi-vis">
                    <div className="fv">
                      <div className="glp-input">
                        <div className="glp-input-ic">{"💡"}</div>
                        <div className="glp-input-txt">동네 자영업자 예약 관리 서비스<span className="cursor"></span></div>
                      </div>
                      <div className="glp-arrow">{"↓ AI 기획 생성 중"}</div>
                      <div className="glp-grid">
                        <div className="glp-sec glp-sec--active"><div className="glp-sec-h">서비스 개요</div><div className="glp-sec-t">{"소규모 자영업자 예약\u00B7고객 관리 플랫폼"}</div></div>
                        <div className="glp-sec"><div className="glp-sec-h">{"기획 배경 \u00B7 문제 정의"}</div><div className="glp-sec-t">{"수기 관리 비효율, 예약 누락\u00B7이탈 빈발"}</div></div>
                        <div className="glp-sec"><div className="glp-sec-h">목표 및 기대효과</div><div className="glp-sec-t">{"예약 누락 0%, 재방문율 +30%"}</div></div>
                        <div className="glp-sec"><div className="glp-sec-h">주요 사용자 정의</div><div className="glp-sec-t">{"미용실\u00B7네일샵\u00B7카페 소상공인"}</div></div>
                        <div className="glp-sec"><div className="glp-sec-h">{"사용 맥락 \u00B7 핵심 이용 장면"}</div><div className="glp-sec-t">영업 중 빠른 예약 확인 및 즉시 응대</div></div>
                        <div className="glp-sec"><div className="glp-sec-h">서비스 핵심 가치</div><div className="glp-sec-t">단순하고 빠른 예약 자동화</div></div>
                        <div className="glp-sec"><div className="glp-sec-h">핵심 기능 구성</div><div className="glp-sec-t">{"캘린더 \u00B7 알림 \u00B7 고객DB \u00B7 매출 현황"}</div></div>
                        <div className="glp-sec"><div className="glp-sec-h">{"주요 화면 \u00B7 정보 구조"}</div><div className="glp-sec-t">{"홈 \u00B7 예약 \u00B7 고객 \u00B7 통계 4개 탭 구조"}</div></div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Panel 1 - Design */}
                <div className="feat-panel" data-tab="1">
                  <div className="fi-vis">
                    <div className="fv" style={{ padding: '16px' }}>
                      <svg viewBox="0 0 300 195" style={{ width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <filter id="gf2"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                          <linearGradient id="lg-p" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7c3aed" stopOpacity=".9" /><stop offset="100%" stopColor="#818cf8" stopOpacity=".9" /></linearGradient>
                        </defs>
                        <path d="M 150,35 C 150,58 75,62 75,80" stroke="rgba(196,181,253,.35)" strokeWidth="1.5" fill="none" />
                        <path d="M 150,35 C 150,55 200,62 200,80" stroke="rgba(110,231,216,.32)" strokeWidth="1.5" fill="none" />
                        <path d="M 150,35 C 150,58 260,62 260,80" stroke="rgba(96,165,250,.3)" strokeWidth="1.5" fill="none" />
                        <path d="M 75,100 C 75,132 25,148 25,161" stroke="rgba(196,181,253,.2)" strokeWidth="1" fill="none" />
                        <path d="M 75,100 C 75,132 75,148 75,161" stroke="rgba(196,181,253,.2)" strokeWidth="1" fill="none" />
                        <path d="M 75,100 C 75,132 125,148 125,161" stroke="rgba(196,181,253,.2)" strokeWidth="1" fill="none" />
                        <path d="M 200,100 C 200,132 175,148 175,161" stroke="rgba(110,231,216,.2)" strokeWidth="1" fill="none" />
                        <path d="M 200,100 C 200,132 225,148 225,161" stroke="rgba(110,231,216,.2)" strokeWidth="1" fill="none" />
                        <path d="M 260,100 C 260,132 275,148 275,161" stroke="rgba(96,165,250,.2)" strokeWidth="1" fill="none" />
                        <rect x="118" y="11" width="64" height="24" rx="12" fill="rgba(124,58,237,.18)" stroke="url(#lg-p)" strokeWidth="1.4" filter="url(#gf2)" />
                        <text x="150" y="27" textAnchor="middle" fill="rgba(255,255,255,.95)" fontSize="9.5" fontFamily="Inter,sans-serif" fontWeight="700">서비스</text>
                        <rect x="41" y="80" width="68" height="20" rx="10" fill="rgba(124,58,237,.14)" stroke="rgba(196,181,253,.45)" strokeWidth="1" />
                        <text x="75" y="93" textAnchor="middle" fill="rgba(255,255,255,.88)" fontSize="8.5" fontFamily="Inter,sans-serif" fontWeight="600">예약관리</text>
                        <rect x="176" y="80" width="48" height="20" rx="10" fill="rgba(110,231,216,.1)" stroke="rgba(110,231,216,.42)" strokeWidth="1" />
                        <text x="200" y="93" textAnchor="middle" fill="rgba(255,255,255,.88)" fontSize="8.5" fontFamily="Inter,sans-serif" fontWeight="600">고객</text>
                        <rect x="234" y="80" width="52" height="20" rx="10" fill="rgba(96,165,250,.1)" stroke="rgba(147,197,253,.4)" strokeWidth="1" />
                        <text x="260" y="93" textAnchor="middle" fill="rgba(255,255,255,.88)" fontSize="8.5" fontFamily="Inter,sans-serif" fontWeight="600">설정</text>
                        <rect x="5" y="161" width="40" height="17" rx="8.5" fill="rgba(124,58,237,.1)" stroke="rgba(196,181,253,.28)" strokeWidth=".9" />
                        <text x="25" y="173" textAnchor="middle" fill="rgba(255,255,255,.68)" fontSize="7.5" fontFamily="Inter,sans-serif">캘린더</text>
                        <rect x="55" y="161" width="40" height="17" rx="8.5" fill="rgba(124,58,237,.1)" stroke="rgba(196,181,253,.28)" strokeWidth=".9" />
                        <text x="75" y="173" textAnchor="middle" fill="rgba(255,255,255,.68)" fontSize="7.5" fontFamily="Inter,sans-serif">신규예약</text>
                        <rect x="105" y="161" width="40" height="17" rx="8.5" fill="rgba(124,58,237,.1)" stroke="rgba(196,181,253,.28)" strokeWidth=".9" />
                        <text x="125" y="173" textAnchor="middle" fill="rgba(255,255,255,.68)" fontSize="7.5" fontFamily="Inter,sans-serif">알림</text>
                        <rect x="155" y="161" width="40" height="17" rx="8.5" fill="rgba(110,231,216,.08)" stroke="rgba(110,231,216,.25)" strokeWidth=".9" />
                        <text x="175" y="173" textAnchor="middle" fill="rgba(255,255,255,.68)" fontSize="7.5" fontFamily="Inter,sans-serif">고객 DB</text>
                        <rect x="205" y="161" width="40" height="17" rx="8.5" fill="rgba(110,231,216,.08)" stroke="rgba(110,231,216,.25)" strokeWidth=".9" />
                        <text x="225" y="173" textAnchor="middle" fill="rgba(255,255,255,.68)" fontSize="7.5" fontFamily="Inter,sans-serif">방문이력</text>
                        <rect x="255" y="161" width="40" height="17" rx="8.5" fill="rgba(96,165,250,.08)" stroke="rgba(147,197,253,.22)" strokeWidth=".9" />
                        <text x="275" y="173" textAnchor="middle" fill="rgba(255,255,255,.68)" fontSize="7.5" fontFamily="Inter,sans-serif">프로필</text>
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Panel 2 - MVP */}
                <div className="feat-panel" data-tab="2">
                  <div className="fi-vis">
                    <div className="fv">
                      <div className="mvp-device">
                        <div className="mvp-bar">
                          <div className="mvp-dot" style={{ background: '#ff5f56' }}></div>
                          <div className="mvp-dot" style={{ background: '#febc2e' }}></div>
                          <div className="mvp-dot" style={{ background: '#28c840' }}></div>
                          <div style={{ flex: 1, margin: '0 8px', background: 'rgba(255,255,255,.05)', borderRadius: '3px', padding: '3px 8px', fontSize: '8px', color: 'rgba(255,255,255,.22)', textAlign: 'center' }}>servora.io/app/reservations</div>
                        </div>
                        <div className="mvp-nav">
                          <div className="mvp-ntab">홈</div>
                          <div className="mvp-ntab on">예약</div>
                          <div className="mvp-ntab">고객</div>
                          <div className="mvp-ntab">통계</div>
                        </div>
                        <div className="mvp-body">
                          <div className="mvp-cal">
                            <div className="mvp-cd" style={{ fontSize: '6px', color: 'rgba(255,255,255,.2)' }}>월</div><div className="mvp-cd" style={{ fontSize: '6px', color: 'rgba(255,255,255,.2)' }}>화</div><div className="mvp-cd" style={{ fontSize: '6px', color: 'rgba(255,255,255,.2)' }}>수</div><div className="mvp-cd" style={{ fontSize: '6px', color: 'rgba(255,255,255,.2)' }}>목</div><div className="mvp-cd" style={{ fontSize: '6px', color: 'rgba(255,255,255,.2)' }}>금</div><div className="mvp-cd" style={{ fontSize: '6px', color: 'rgba(255,255,255,.2)' }}>토</div><div className="mvp-cd" style={{ fontSize: '6px', color: 'rgba(255,255,255,.2)' }}>일</div>
                            <div className="mvp-cd">17</div><div className="mvp-cd has">18</div><div className="mvp-cd today">19</div><div className="mvp-cd has">20</div><div className="mvp-cd">21</div><div className="mvp-cd has">22</div><div className="mvp-cd">23</div>
                          </div>
                          <div className="mvp-resv">
                            <div className="mvp-resv-dot" style={{ background: '#c4b5fd', boxShadow: '0 0 5px #c4b5fd' }}></div>
                            <div className="mvp-resv-info"><div className="mvp-resv-nm">{"김민지 \u00B7 커트+염색"}</div><div className="mvp-resv-tm">{"10:00 \u2013 11:30"}</div></div>
                            <div className="mvp-resv-st" style={{ color: '#4ade80' }}>확정</div>
                          </div>
                          <div className="mvp-resv">
                            <div className="mvp-resv-dot" style={{ background: '#818cf8', boxShadow: '0 0 5px #818cf8' }}></div>
                            <div className="mvp-resv-info"><div className="mvp-resv-nm">{"박서연 \u00B7 네일아트"}</div><div className="mvp-resv-tm">{"14:00 \u2013 15:00"}</div></div>
                            <div className="mvp-resv-st" style={{ color: '#fbbf24' }}>대기</div>
                          </div>
                        </div>
                      </div>
                      <div className="mvp-live-bar">
                        <div className="mvp-live-dot"></div>
                        <div className="mvp-live-txt">{"MVP 서비스 \u2014 실시간 운영 중"}</div>
                        <div className="mvp-live-num">{"오늘 예약 8건"}</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Panel 3 - Service Build */}
                <div className="feat-panel" data-tab="3">
                  <div className="fi-vis">
                    <div className="fv">
                      <div className="svc-pipe">
                        <div className="svc-stage done">
                          <div className="svc-ic">{"✅"}</div>
                          <div className="svc-info"><div className="svc-name">{"기획 \u00B7 설계 완료"}</div><div className="svc-detail">{"기획안 \u00B7 IA 구조 \u00B7 화면 시안 확정"}</div></div>
                          <div className="svc-badge done">Done</div>
                        </div>
                        <div className="svc-stage done">
                          <div className="svc-ic">{"🎨"}</div>
                          <div className="svc-info"><div className="svc-name">UI 코드 생성</div><div className="svc-detail">{"React 컴포넌트 32개 \u00B7 Tailwind CSS"}</div></div>
                          <div className="svc-badge done">Done</div>
                        </div>
                        <div className="svc-stage active">
                          <div className="svc-ic">{"⚙️"}</div>
                          <div className="svc-info"><div className="svc-name">{"API 연결 \u00B7 배포"}</div><div className="svc-detail">{"Vercel 배포 \u00B7 DB 연결 진행 중"}</div></div>
                          <div className="svc-badge run">Running</div>
                        </div>
                        <div className="svc-stage">
                          <div className="svc-ic">{"🚀"}</div>
                          <div className="svc-info"><div className="svc-name">서비스 출시</div><div className="svc-detail">{"도메인 연결 \u00B7 모니터링 설정 예정"}</div></div>
                          <div className="svc-badge wait">대기 중</div>
                        </div>
                      </div>
                      <div className="svc-commit">
                        <div className="svc-commit-hash">a3f9c12</div>
                        <div className="svc-commit-msg">feat: 예약 캘린더 컴포넌트 완성</div>
                        <div className="svc-commit-time">2분 전</div>
                      </div>
                      <div className="svc-commit">
                        <div className="svc-commit-hash">b8d4e71</div>
                        <div className="svc-commit-msg">fix: 알림 발송 타이밍 조정</div>
                        <div className="svc-commit-time">17분 전</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Panel 4 - Ops */}
                <div className="feat-panel" data-tab="4">
                  <div className="fi-vis">
                    <div className="fv">
                      <div className="ops-kpi">
                        <div className="ops-card ops-card--purple">
                          <div className="ops-v ops-v--purple">1,247</div>
                          <div className="ops-l">총 예약 건</div>
                          <div className="ops-trend">{"↑ 23% 이번 주"}</div>
                        </div>
                        <div className="ops-card ops-card--teal">
                          <div className="ops-v ops-v--teal">98%</div>
                          <div className="ops-l">서비스 가동률</div>
                          <div className="ops-trend">안정 운영 중</div>
                        </div>
                        <div className="ops-card ops-card--green">
                          <div className="ops-v ops-v--green">4.9</div>
                          <div className="ops-l">평균 만족도</div>
                          <div className="ops-trend">{"★ 94건 리뷰"}</div>
                        </div>
                      </div>
                      <div className="ops-spark">
                        <svg viewBox="0 0 260 26" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#7c3aed" stopOpacity=".35" />
                              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M0,22 L22,20 L44,17 L66,19 L88,13 L110,10 L132,8 L154,11 L176,6 L198,4 L220,2 L242,1 L260,0" stroke="#c4b5fd" strokeWidth="1.5" fill="none" />
                          <path d="M0,22 L22,20 L44,17 L66,19 L88,13 L110,10 L132,8 L154,11 L176,6 L198,4 L220,2 L242,1 L260,0 L260,26 L0,26 Z" fill="url(#spark-fill)" />
                        </svg>
                      </div>
                      <div className="ops-feed">
                        <div className="ops-fitem">
                          <div className="ops-fstar">{"★★★★★"}</div>
                          <div className="ops-ftxt">예약 알림 덕분에 노쇼가 확 줄었어요</div>
                          <div className="ops-fuser">김민지</div>
                        </div>
                        <div className="ops-fitem">
                          <div className="ops-fstar">{"★★★★★"}</div>
                          <div className="ops-ftxt">매출 현황 보는 게 너무 편해졌습니다</div>
                          <div className="ops-fuser">박서연</div>
                        </div>
                        <div className="ops-fitem">
                          <div className="ops-fstar">{"★★★★☆"}</div>
                          <div className="ops-ftxt">고객 메모 기능이 특히 유용해요</div>
                          <div className="ops-fuser">이수진</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section id="trust">
        <h2 className="sec-title" style={{ margin: '0 auto 16px', maxWidth: '580px' }}>수많은 아이디어가 실제 결과물로 이어지고 있습니다</h2>
        <p className="sec-sub" style={{ margin: '0 auto' }}>아이디어는 기획안이 되고, 시안이 되고, 실제 서비스 형태로 계속 이어집니다.</p>
        <div className="trust-stats">
          <div className="ts"><div className="ts-v">1,210+</div><div className="ts-l">생성된 아이디어</div></div>
          <div className="ts"><div className="ts-v ts-v--cyan">830+</div><div className="ts-l">완성된 시안</div></div>
          <div className="ts"><div className="ts-v ts-v--teal">710+</div><div className="ts-l">출시된 서비스</div></div>
          <div className="ts"><div className="ts-v ts-v--pink">97%</div><div className="ts-l">{"아이디어 → 출시 전환율"}</div></div>
        </div>
        <div className="ptitle">함께 만들고 있는 팀들</div>
        <div className="partners">
          <div className="pname">Starship</div>
          <div className="pname">Linkflow</div>
          <div className="pname">Nextdoor</div>
          <div className="pname">Mosaik</div>
          <div className="pname">Orbit Labs</div>
          <div className="pname">Pageloom</div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="cases">
        <h2 className="sec-title" style={{ textAlign: 'center', margin: '0 auto 16px' }}>{"다양한 서비스가"}<br />Servora로 시작됩니다</h2>
        <p className="sec-sub" style={{ textAlign: 'center', margin: '0 auto' }}>하나의 아이디어가 어떤 형태의 서비스로 이어질 수 있는지 직접 확인해보세요</p>
        <div className="cases-grid">
          <a href="https://stripe.com/" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://stripe.com/" alt="stripe.com 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"stripe.com \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">Stripe</div>
              <div className="cc-sub">전 세계 수백만 기업이 사용하는 온라인 결제 인프라. 개발자 친화적인 API로 결제를 빠르게 연동합니다.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#635bff,#8b83ff)' }}></div><div className="cc-au">stripe.com</div></div>
            </div>
          </a>
          <a href="https://www.promptclip.kr/" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://www.promptclip.kr/" alt="promptclip.kr 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"promptclip.kr \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">PromptClip</div>
              <div className="cc-sub">AI 프롬프트를 클립처럼 저장하고 공유하는 서비스. Servora로 기획부터 출시까지.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}></div><div className="cc-au">Servora 출시 사례</div></div>
            </div>
          </a>
          <a href="https://land-book.com" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://land-book.com" alt="land-book.com 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"land-book.com \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">Land-book</div>
              <div className="cc-sub">최고의 랜딩 페이지 디자인을 엄선해 모아놓은 갤러리. 서비스 기획 시 레퍼런스로 활용하세요.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}></div><div className="cc-au">land-book.com</div></div>
            </div>
          </a>
          <a href="https://www.siteinspire.com" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://www.siteinspire.com" alt="siteinspire.com 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"siteinspire.com \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">Siteinspire</div>
              <div className="cc-sub">수준 높은 웹 디자인 사례만 엄선한 인스피레이션 큐레이션 사이트.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#94a3b8,#475569)' }}></div><div className="cc-au">siteinspire.com</div></div>
            </div>
          </a>
          <a href="https://godly.website" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://godly.website" alt="godly.website 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"godly.website \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">Godly</div>
              <div className="cc-sub">모션과 인터랙션이 돋보이는 웹사이트 인스피레이션 컬렉션.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}></div><div className="cc-au">godly.website</div></div>
            </div>
          </a>
          <a href="https://www.lapa.ninja" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://www.lapa.ninja" alt="lapa.ninja 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"lapa.ninja \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">Lapa Ninja</div>
              <div className="cc-sub">{"랜딩 페이지\u00B7앱 디자인 레퍼런스를 카테고리별로 정리한 컬렉션."}</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#f97316,#ef4444)' }}></div><div className="cc-au">lapa.ninja</div></div>
            </div>
          </a>
          <a href="https://www.nngroup.com/" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://www.nngroup.com/" alt="nngroup.com 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"nngroup.com \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">NN/g Nielsen Norman</div>
              <div className="cc-sub">사용자 경험 연구 기반의 UX 가이드라인과 심층 아티클.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}></div><div className="cc-au">nngroup.com</div></div>
            </div>
          </a>
          <a href="https://www.smashingmagazine.com/" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://www.smashingmagazine.com/" alt="smashingmagazine.com 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"smashingmagazine.com \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">Smashing Magazine</div>
              <div className="cc-sub">{"웹 개발\u00B7디자인 실무 아티클과 튜토리얼. 기획부터 개발까지 깊이 있는 인사이트."}</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#e11d48,#f97316)' }}></div><div className="cc-au">smashingmagazine.com</div></div>
            </div>
          </a>
          <a href="https://www.figma.com/resource-library/" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://www.figma.com/resource-library/" alt="figma.com 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"figma.com/resource-library \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">Figma Resource Library</div>
              <div className="cc-sub">Figma 공식 디자인 리소스 및 가이드. UI 시안 제작 시 바로 활용 가능.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#a259ff,#1abcfe)' }}></div><div className="cc-au">figma.com</div></div>
            </div>
          </a>
          <a href="https://webflow.com/blog" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://webflow.com/blog" alt="webflow.com 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"webflow.com/blog \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">Webflow Blog</div>
              <div className="cc-sub">{"웹 디자인\u00B7노코드 개발 인사이트와 튜토리얼. 서비스 구현 아이디어를 얻어보세요."}</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#4353ff,#146ef5)' }}></div><div className="cc-au">webflow.com</div></div>
            </div>
          </a>
          {/* Placeholder cards */}
          <div className="cc">
            <div className="cc-vis">
              <div className="cc-lines">
                <div className="ccl" style={{ width: '70%', background: 'rgba(124,58,237,.22)' }}></div>
                <div className="ccl" style={{ width: '50%' }}></div>
                <div className="ccl" style={{ width: '82%' }}></div>
                <div className="ccl" style={{ width: '42%' }}></div>
              </div>
              <span className="cc-badge cb-mvp">MVP</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">동네 자영업자 예약 서비스</div>
              <div className="cc-sub">미용실, 네일샵을 위한 예약 관리. 아이디어 입력부터 MVP까지 4시간.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}></div><div className="cc-au">{"박지수 \u00B7 1인 창업자"}</div></div>
            </div>
          </div>
          <div className="cc">
            <div className="cc-vis">
              <div className="cc-lines">
                <div className="ccl" style={{ width: '80%', background: 'rgba(96,165,250,.18)' }}></div>
                <div className="ccl" style={{ width: '55%' }}></div>
                <div className="ccl" style={{ width: '68%' }}></div>
                <div className="ccl" style={{ width: '45%' }}></div>
              </div>
              <span className="cc-badge cb-beta">Beta</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">팀 프로젝트 관리 도구</div>
              <div className="cc-sub">스타트업 내부 팀을 위한 경량 프로젝트 보드. IA부터 시안까지 자동 생성.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#4f46e5,#60a5fa)' }}></div><div className="cc-au">{"김민준 \u00B7 프로덕트 매니저"}</div></div>
            </div>
          </div>
          <div className="cc">
            <div className="cc-vis">
              <div className="cc-lines">
                <div className="ccl" style={{ width: '62%', background: 'rgba(110,231,216,.15)' }}></div>
                <div className="ccl" style={{ width: '78%' }}></div>
                <div className="ccl" style={{ width: '48%' }}></div>
                <div className="ccl" style={{ width: '66%' }}></div>
              </div>
              <span className="cc-badge cb-wip">In progress</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">로컬 커뮤니티 플랫폼</div>
              <div className="cc-sub">동네 기반 모임과 정보 공유 서비스. 사이드 프로젝트로 시작해 MVP 단계.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#06b6d4,#6EE7D8)' }}></div><div className="cc-au">{"이서연 \u00B7 사이드 프로젝터"}</div></div>
            </div>
          </div>
          <div className="cc">
            <div className="cc-vis">
              <div className="cc-lines">
                <div className="ccl" style={{ width: '58%', background: 'rgba(240,171,252,.13)' }}></div>
                <div className="ccl" style={{ width: '75%' }}></div>
                <div className="ccl" style={{ width: '52%' }}></div>
                <div className="ccl" style={{ width: '72%' }}></div>
              </div>
              <span className="cc-badge cb-mvp">MVP</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">신사업 기획안 자동화</div>
              <div className="cc-sub">제안서 작성에 드는 시간을 80% 절감. 팀 전체가 기획안 생성에 Servora 활용.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#c084fc,#818cf8)' }}></div><div className="cc-au">{"최현우 \u00B7 신사업팀 리드"}</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta">
        <h2 className="cta-title">아이디어를 바로<br />구체화해보세요</h2>
        <img src="/img/CTA.gif" className="cta-gif" alt="" />
        <div className="btn-row">
          <Link href="/signup"><button className="btn-p btn--lg">아이디어 꺼내기</button></Link>
          <a href="#cases"><button className="btn-s btn--lg">{"아이디어 살펴보기 \u2192"}</button></a>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="foot">
        <div className="foot-logo">Servora</div>
        <div className="foot-copy">{"© 2026 Servora. All rights reserved."}</div>
        <div className="foot-links">
          <a href="#">Support</a>
          <a href="#">Pricing</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </footer>
    </>
  )
}
