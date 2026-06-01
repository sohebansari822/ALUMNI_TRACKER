import { useEffect, useState, useRef } from 'react'
import axios from 'axios'

const API = '/api/alumni/'

const LAT_MAX = 83.6
function latLngToPercent(lat, lng) {
  const x = (lng + 180) / 360 * 100
  const y = (LAT_MAX - lat) / (LAT_MAX * 2) * 100
  return {
    x: Math.max(2, Math.min(98, x)),
    y: Math.max(2, Math.min(98, y))
  }
}

// One pin per unique city+country
function computeGroups(alumni) {
  const map = {}
  alumni.forEach(a => {
    if (!a.latitude || !a.longitude) return
    const key = `${a.city.trim().toLowerCase()}|${a.country.trim().toLowerCase()}`
    if (!map[key]) {
      const { x, y } = latLngToPercent(a.latitude, a.longitude)
      map[key] = { x, y, members: [] }
    }
    map[key].members.push(a)
  })
  return Object.values(map)
}

export default function ARView() {
  const [alumni, setAlumni]         = useState([])
  const [selected, setSelected]     = useState(null)
  const [arReady, setArReady]       = useState(false)
  const [mapVisible, setMapVisible] = useState(false)
  const [pinPositions, setPinPositions] = useState([])
  const animRef = useRef(null)

  useEffect(() => {
    axios.get(API).then(res => setAlumni(res.data))
  }, [])

  useEffect(() => {
    const aframe = document.createElement('script')
    aframe.src = 'https://aframe.io/releases/1.4.2/aframe.min.js'
    aframe.onload = () => {
      const mindar = document.createElement('script')
      mindar.src = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-aframe.prod.js'
      mindar.onload = () => setArReady(true)
      document.head.appendChild(mindar)
    }
    document.head.appendChild(aframe)
  }, [])

  useEffect(() => {
    if (!arReady || alumni.length === 0) return

    const oldScene = document.getElementById('ar-scene')
    if (oldScene) oldScene.remove()

    const scene = document.createElement('a-scene')
    scene.id = 'ar-scene'
    scene.setAttribute('mindar-image',
      'imageTargetSrc: /targets.mind; autoStart: true; uiLoading: yes; uiScanning: yes; filterMinCF: 0.001; filterBeta: 0.001; warmupTolerance: 5; missTolerance: 10;')
    scene.setAttribute('vr-mode-ui', 'enabled: false')
    scene.setAttribute('device-orientation-permission-ui', 'enabled: false')
    scene.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;'

    scene.addEventListener('targetFound', () => setMapVisible(true))
    scene.addEventListener('targetLost',  () => { setMapVisible(false); setPinPositions([]) })

    const camera = document.createElement('a-camera')
    camera.setAttribute('position', '0 0 0')
    camera.setAttribute('look-controls', 'enabled: false')
    scene.appendChild(camera)

    const target = document.createElement('a-entity')
    target.setAttribute('mindar-image-target', 'targetIndex: 0')

    const groups = computeGroups(alumni)

    groups.forEach(group => {
      const ax = (group.x / 100) - 0.5
      const ay = 0.25 - (group.y / 100) * 0.5
      const count = group.members.length
      const color = '#60a5fa'

      // 3 smooth wave rings — a-ring has no center polygon so no spin artifact
      for (let w = 0; w < 3; w++) {
        const wave = document.createElement('a-ring')
        wave.setAttribute('position', `${ax} ${ay} -0.001`)
        wave.setAttribute('radius-inner', '0.006')
        wave.setAttribute('radius-outer', '0.008')
        wave.setAttribute('segments-theta', '64')
        wave.setAttribute('color', color)
        wave.setAttribute('material', 'transparent: true; opacity: 0')
        wave.setAttribute('animation__s',
          `property: scale; from: 1 1 1; to: 6 6 1; dur: 2200; loop: true; delay: ${w * 730}; easing: linear`)
        wave.setAttribute('animation__o',
          `property: material.opacity; from: 0.5; to: 0; dur: 2200; loop: true; delay: ${w * 730}; easing: linear`)
        target.appendChild(wave)
      }

      // Fixed solid center circle
      const center = document.createElement('a-circle')
      center.setAttribute('position', `${ax} ${ay} 0`)
      center.setAttribute('radius', '0.007')
      center.setAttribute('color', color)
      center.setAttribute('material', 'transparent: false; opacity: 1')

      // White dot in the middle
      const innerDot = document.createElement('a-circle')
      innerDot.setAttribute('position', `${ax} ${ay} 0.001`)
      innerDot.setAttribute('radius', '0.003')
      innerDot.setAttribute('color', '#ffffff')
      innerDot.setAttribute('material', 'transparent: false; opacity: 1')

      // Count badge for grouped pins
      if (count > 1) {
        const badge = document.createElement('a-text')
        badge.setAttribute('value', String(count))
        badge.setAttribute('position', `${ax} ${ay} 0.002`)
        badge.setAttribute('align', 'center')
        badge.setAttribute('color', '#ffffff')
        badge.setAttribute('width', '0.035')
        target.appendChild(badge)
      }

      target.appendChild(center)
      target.appendChild(innerDot)
    })

    scene.appendChild(target)
    document.body.appendChild(scene)

    // Project each pin's 3D AR position → 2D screen coords every frame.
    // Invisible HTML buttons sit at those coords for reliable mobile touch.
    scene.addEventListener('loaded', () => {
      const tick = () => {
        const threeCamera = scene.camera
        const targetEl = document.querySelector('[mindar-image-target]')
        if (threeCamera && targetEl && window.THREE) {
          const obj = targetEl.object3D
          const updated = groups.map(group => {
            const ax = (group.x / 100) - 0.5
            const ay = 0.25 - (group.y / 100) * 0.5
            const vec = new window.THREE.Vector3(ax, ay, 0)
            obj.localToWorld(vec)
            vec.project(threeCamera)
            return {
              screenX: (vec.x + 1) / 2 * window.innerWidth,
              screenY: -(vec.y - 1) / 2 * window.innerHeight,
              members: group.members,
              inView: vec.z < 1,
            }
          })
          setPinPositions(updated)
        }
        animRef.current = requestAnimationFrame(tick)
      }
      tick()
    })

    return () => {
      cancelAnimationFrame(animRef.current)
      const s = document.getElementById('ar-scene')
      if (s) s.remove()
      setPinPositions([])
    }
  }, [arReady, alumni])

  // ── PROFILE VIEW — full screen, hides AR completely ───────────────────────
  if (selected) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: '#080f1e', overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px',
          background: 'rgba(15,23,42,0.98)',
          borderBottom: '1px solid rgba(59,130,246,0.2)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <button
            onPointerDown={() => setSelected(null)}
            style={{
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.4)',
              color: '#60a5fa', borderRadius: 10,
              padding: '8px 16px', fontSize: 14,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            ← Back to Map
          </button>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>
            {selected.length > 1
              ? `${selected.length} alumni · ${selected[0].city}, ${selected[0].country}`
              : `${selected[0].city}, ${selected[0].country}`}
          </span>
        </div>

        <div style={{ padding: '20px 20px 48px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selected.map(a => (
            <div key={a.id} style={{
              background: 'rgba(15,23,42,1)',
              border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: 20, padding: 20,
              boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, fontWeight: 'bold', flexShrink: 0,
                  overflow: 'hidden', color: 'white',
                  boxShadow: '0 0 0 3px rgba(59,130,246,0.35)',
                }}>
                  {a.photo
                    ? <img src={a.photo} alt={a.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : a.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ color: 'white', fontSize: 20, fontWeight: 'bold', lineHeight: 1.2 }}>{a.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 3 }}>Class of {a.batch_year}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: '🏢', label: 'Company',  value: a.company },
                  { icon: '📍', label: 'Location', value: `${a.city}, ${a.country}` },
                  { icon: '🎓', label: 'Batch',    value: a.batch_year },
                ].map(item => (
                  <div key={item.label} style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12, padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>{item.label}</div>
                      <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── AR MAP VIEW ────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}>

      {!arReady && (
        <div style={{
          position: 'fixed', inset: 0, background: '#0a0a0a',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', zIndex: 999,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
          <div style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Loading AR...</div>
        </div>
      )}

      {arReady && !mapVisible && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.75)', color: 'white',
          padding: '10px 20px', borderRadius: 20, fontSize: 13, zIndex: 10,
        }}>
          📷 Point camera at the world map
        </div>
      )}

      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        padding: '12px 16px', pointerEvents: 'auto',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 10,
      }}>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>🎓 Alumni AR Map</span>
        <span style={{
          background: mapVisible ? '#22c55e' : '#3b82f6',
          color: 'white', padding: '4px 12px',
          borderRadius: 20, fontSize: 12, fontWeight: 'bold',
        }}>
          {mapVisible ? `✅ ${alumni.length} Alumni` : 'Scanning...'}
        </span>
      </div>

      {/* Invisible HTML buttons projected over each 3D pin */}
      {pinPositions.map((pin, i) => pin.inView && (
        <button
          key={i}
          onPointerDown={() => setSelected(pin.members)}
          style={{
            position: 'fixed',
            left: pin.screenX - 30,
            top: pin.screenY - 30,
            width: 60, height: 60,
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            zIndex: 50,
            pointerEvents: 'auto',
            WebkitTapHighlightColor: 'transparent',
          }}
        />
      ))}
    </div>
  )
}
