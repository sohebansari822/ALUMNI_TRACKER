import { useEffect, useState } from 'react'
import axios from 'axios'

const API = '/api/alumni/'

function latLngToPercent(lat, lng) {
  const x = 0.2750 * lng + 39.5
  const latRad = lat * Math.PI / 180
  const merc = Math.log(Math.tan(Math.PI / 4 + latRad / 2))
  const y = -35.336 * merc + 60.5
  // Clamp to map bounds — no dot goes outside
  return {
    x: Math.max(2, Math.min(98, x)),
    y: Math.max(2, Math.min(98, y))
  }
}

export default function ARView() {
  const [alumni, setAlumni] = useState([])
  const [selected, setSelected] = useState(null)
  const [arReady, setArReady] = useState(false)
  const [mapVisible, setMapVisible] = useState(false)

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
      'imageTargetSrc: /targets.mind; autoStart: true; uiLoading: yes; uiScanning: yes;')
    scene.setAttribute('vr-mode-ui', 'enabled: false')
    scene.setAttribute('device-orientation-permission-ui', 'enabled: false')
    scene.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;'

    scene.addEventListener('targetFound', () => setMapVisible(true))
    scene.addEventListener('targetLost', () => setMapVisible(false))

    const camera = document.createElement('a-camera')
    camera.setAttribute('position', '0 0 0')
    camera.setAttribute('look-controls', 'enabled: false')
    const cursor = document.createElement('a-entity')
    cursor.setAttribute('cursor', 'rayOrigin: mouse')
    cursor.setAttribute('raycaster', 'objects: .clickable')
    camera.appendChild(cursor)
    scene.appendChild(camera)

    const target = document.createElement('a-entity')
    target.setAttribute('mindar-image-target', 'targetIndex: 0')

    // Group nearby alumni
    const groups = []
    alumni.forEach(a => {
      if (!a.latitude || !a.longitude) return
      const { x, y } = latLngToPercent(a.latitude, a.longitude)
      const existing = groups.find(g =>
        Math.abs(g.x - x) < 3 && Math.abs(g.y - y) < 3
      )
      if (existing) existing.members.push(a)
      else groups.push({ x, y, members: [a] })
    })

    groups.forEach((group) => {
      const ax = (group.x / 100) * 2 - 1
      const ay = 0.5 - (group.y / 100) * 1
      const count = group.members.length

      // --- PARACHUTE / PIN STYLE ---
      // Thin vertical line (stem)
      const stem = document.createElement('a-cylinder')
      stem.setAttribute('position', `${ax} ${ay + 0.018} 0.01`)
      stem.setAttribute('radius', '0.002')
      stem.setAttribute('height', '0.036')
      stem.setAttribute('color', '#ffffff')
      stem.setAttribute('opacity', '0.9')

      // Circle head (thin outline style)
      const head = document.createElement('a-ring')
      head.setAttribute('position', `${ax} ${ay + 0.038} 0.011`)
      head.setAttribute('radius-inner', '0.010')
      head.setAttribute('radius-outer', '0.014')
      head.setAttribute('color', count > 1 ? '#f59e0b' : '#60a5fa')
      head.setAttribute('opacity', '1')

      // Filled center dot
      const center = document.createElement('a-circle')
      center.setAttribute('position', `${ax} ${ay + 0.038} 0.012`)
      center.setAttribute('radius', '0.007')
      center.setAttribute('color', count > 1 ? '#f59e0b' : '#60a5fa')
      center.setAttribute('opacity', '0.6')

      // Count badge
      if (count > 1) {
        const badge = document.createElement('a-text')
        badge.setAttribute('value', `${count}`)
        badge.setAttribute('position', `${ax} ${ay + 0.038} 0.015`)
        badge.setAttribute('align', 'center')
        badge.setAttribute('color', 'white')
        badge.setAttribute('width', '0.08')
        target.appendChild(badge)
      }

      // Invisible click area
      const plane = document.createElement('a-plane')
      plane.setAttribute('position', `${ax} ${ay + 0.025} 0.02`)
      plane.setAttribute('width', '0.06')
      plane.setAttribute('height', '0.08')
      plane.setAttribute('opacity', '0.01')
      plane.setAttribute('class', 'clickable')
      plane.addEventListener('click', () => {
        setSelected(prev =>
          prev && prev[0]?.id === group.members[0]?.id ? null : group.members
        )
      })

      target.appendChild(stem)
      target.appendChild(head)
      target.appendChild(center)
      target.appendChild(plane)
    })

    scene.appendChild(target)
    document.body.appendChild(scene)

    return () => {
      const s = document.getElementById('ar-scene')
      if (s) s.remove()
    }
  }, [arReady, alumni])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}>

      {!arReady && (
        <div style={{
          position: 'fixed', inset: 0, background: '#0a0a0a',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', zIndex: 999
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
          padding: '10px 20px', borderRadius: 20, fontSize: 13,
          pointerEvents: 'none', zIndex: 10
        }}>
          📷 Point camera at the world map
        </div>
      )}

      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        padding: '12px 16px', pointerEvents: 'auto',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 10
      }}>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>🎓 Alumni AR Map</span>
        <span style={{
          background: mapVisible ? '#22c55e' : '#3b82f6',
          color: 'white', padding: '4px 12px',
          borderRadius: 20, fontSize: 12, fontWeight: 'bold'
        }}>
          {mapVisible ? '✅ Map Detected' : `${alumni.length} Alumni`}
        </span>
      </div>

      {selected && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15,23,42,0.97)',
          border: '1px solid #3b82f6',
          borderRadius: 16, padding: 20,
          width: '88%', maxWidth: 360,
          zIndex: 100, color: 'white',
          pointerEvents: 'auto',
          maxHeight: '60vh', overflowY: 'auto',
          boxShadow: '0 0 30px rgba(59,130,246,0.4)'
        }}>
          <button onClick={() => setSelected(null)} style={{
            position: 'absolute', top: 10, right: 14,
            background: 'none', border: 'none',
            color: '#94a3b8', fontSize: 20, cursor: 'pointer'
          }}>✕</button>
          <div style={{ fontSize: 11, color: '#60a5fa', marginBottom: 12, letterSpacing: 1 }}>
            {selected.length > 1 ? `${selected.length} ALUMNI IN THIS AREA` : 'ALUMNI INFO'}
          </div>
          {selected.map((a, i) => (
            <div key={a.id} style={{
              marginBottom: i < selected.length - 1 ? 16 : 0,
              paddingBottom: i < selected.length - 1 ? 16 : 0,
              borderBottom: i < selected.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
            }}>
              <div style={{ fontSize: 17, fontWeight: 'bold', marginBottom: 8 }}>{a.name}</div>
              {[
                { label: '🎓 Batch', value: a.batch_year },
                { label: '🏢 Company', value: a.company },
                { label: '📍 Location', value: `${a.city}, ${a.country}` },
              ].map(item => (
                <div key={item.label} style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '6px 10px', borderRadius: 8, marginBottom: 4,
                  display: 'flex', justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{item.label}</span>
                  <span style={{ fontSize: 12 }}>{item.value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
