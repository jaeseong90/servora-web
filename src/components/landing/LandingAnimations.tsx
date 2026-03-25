'use client'

import { useEffect, useRef, useCallback } from 'react'
import Script from 'next/script'

export default function LandingAnimations() {
  const gsapLoaded = useRef(false)

  const initFeatures = useCallback(() => {
    const driver = document.getElementById('feat-driver')
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
    const canvas = document.getElementById('bh-hero-canvas') as HTMLCanvasElement | null
    const svg = document.getElementById('bh-hero-svg') as SVGSVGElement | null
    const uiEl = document.getElementById('bh-hero-ui') as HTMLDivElement | null
    if (!gsap || !canvas || !svg || !uiEl) return

    // Re-assign to non-nullable consts so TypeScript narrows inside nested closures
    const _canvas: HTMLCanvasElement = canvas
    const _svg: SVGSVGElement = svg
    const _uiEl: HTMLDivElement = uiEl
    const ctx = _canvas.getContext('2d')!

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
    const blob = new BHBlobRenderer(_canvas, ctx)
    const particles = new BHParticleSystem()
    const textSeq = new BHTextSequence(_svg)
    const tree = new BHIATree()
    const ui = new BHUITransition(_uiEl)

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
      const rect = _canvas.parentElement!.getBoundingClientRect()
      W = Math.max(Math.floor(rect.width), 340)
      H = Math.max(Math.floor(rect.height), 320)
      _canvas.width = W
      _canvas.height = H
      _svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
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
      new ResizeObserver(() => handleResize()).observe(_canvas.parentElement!)
    }

    if (_reducedMotion) {
      gsap.set(_uiEl, { opacity: 1 })
      gsap.set(_uiEl.querySelectorAll('.hero-stat-pill'), { opacity: 1, y: 0 })
      gsap.set(_uiEl.querySelectorAll('.booking-item'), { opacity: 1, y: 0 })
      const main = _uiEl.querySelector('.card-main') as HTMLElement | null
      if (main) gsap.set(main, { scale: 1, y: 0, opacity: 1 })
      _uiEl.querySelectorAll('.card-bg').forEach((el: any) => gsap.set(el, { scale: 1, opacity: 1 }))
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
      }, { threshold: 0.05 }).observe(_canvas.parentElement!)
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
    </>
  )
}
