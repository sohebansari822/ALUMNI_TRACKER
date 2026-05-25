import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const API = 'http://192.168.1.6:8000/api/alumni/'

// WORLD MAP bounds
const MAP_BOUNDS = {
  north: 85.0,
  south: -85.0,
  west: -180.0,
  east: 180.0,
}

function latLngToPercent(lat, lng) {
  const x = ((lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * 100
  const y = ((MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * 100
  return { x, y }
}

export default function ARView() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [alumni, setAlumni] = useState([])
  const [selected, setSelected] = useState(null)
  const [camReady, setCamReady] = useState(false)
  const [error, setError] = useState('')

  // Map area on screen — adjust these % values to match where your
  // printed map appears in the camera view
  const mapArea = {
    left: '5%',
    top: '15%',
    width: '90%',
    height: '70%',
  }

  useEffect(() => {
    axios.get(API).then(res => setAlumni(res.data))
  }, [])

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setCamReady(true)
        }
      } catch (e) {
        setError('Camera access denied. Please allow camera permission.')
      }
    }
    startCamera()
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>

      {/* CAMERA */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* MAP OVERLAY AREA — dots live inside this box */}
      {camReady && (
        <div style={{
          position: 'absolute',
          left: mapArea.left,
          top: mapArea.top,
          width: mapArea.width,
          height: mapArea.height,
          // Uncomment below line to see the box while calibrating:
          // border: '2px solid red',
        }}>
          {alumni.map(a => {
            if (!a.latitude || !a.longitude) return null
            const { x, y } = latLngToPercent(a.latitude, a.longitude)
            return (
              <div
                key={a.id}
                onClick={() => setSelected(selected?.id === a.id ? null : a)}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
              >
                {/* Outer pulse ring */}
                <div style={{
                  position: 'absolute',
                  width: 28, height: 28,
                  borderRadius: '50%',
                  background: 'rgba(59,130,246,0.4)',
                  animation: 'pulse 1.5s infinite',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)'
                }} />
                {/* Dot */}
                <div style={{
                  width: 14, height: 14,
                  borderRadius: '50%',
                  background: '#3b82f6',
                  border: '2px solid white',
                  boxShadow: '0 0 6px rgba(59,130,246,0.8)',
                  position: 'relative', zIndex: 1
                }} />
                {/* Name tag */}
                <div style={{
                  marginTop: 3,
                  background: 'rgba(0,0,0,0.75)',
                  color: 'white',
                  fontSize: 9,
                  padding: '1px 5px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  border: '1px solid rgba(59,130,246,0.5)'
                }}>
                  {a.name}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CALIBRATION HELPER — shows map boundary box */}
      {camReady && (
        <div style={{
          position: 'absolute',
          left: mapArea.left,
          top: mapArea.top,
          width: mapArea.width,
          height: mapArea.height,
          border: '1px dashed rgba(255,255,255,0.3)',
          pointerEvents: 'none',
          borderRadius: 4,
        }} />
      )}

      {/* INFO POPUP */}
      {selected && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15,23,42,0.97)',
          border: '1px solid #3b82f6',
          borderRadius: 16, padding: 20, width: '88%', maxWidth: 360,
          zIndex: 100, color: 'white',
          boxShadow: '0 0 30px rgba(59,130,246,0.3)'
        }}>
          <button onClick={() => setSelected(null)} style={{
            position: 'absolute', top: 10, right: 14,
            background: 'none', border: 'none', color: '#94a3b8',
            fontSize: 20, cursor: 'pointer'
          }}>✕</button>
          <div style={{ fontSize: 11, color: '#60a5fa', marginBottom: 4, letterSpacing: 1 }}>ALUMNI INFO</div>
          <div style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 14 }}>{selected.name}</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { label: '🎓 Batch Year', value: selected.batch_year },
              { label: '🏢 Company', value: selected.company },
              { label: '📍 Location', value: `${selected.city}, ${selected.country}` },
            ].map(item => (
              <div key={item.label} style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '8px 12px', borderRadius: 8
              }}>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 14 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '12px 16px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span style={{ fontWeight: 'bold', fontSize: 15 }}>🎓 Alumni AR Map</span>
        <span style={{
          background: '#3b82f6', padding: '4px 12px',
          borderRadius: 20, fontSize: 12, fontWeight: 'bold'
        }}>{alumni.length} Alumni</span>
      </div>

      {error && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          background: '#ef4444', padding: 20, borderRadius: 12,
          textAlign: 'center', maxWidth: 300, zIndex: 200
        }}>{error}</div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%,-50%) scale(1); opacity: 0.8; }
          70% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
          100% { transform: translate(-50%,-50%) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  )
}