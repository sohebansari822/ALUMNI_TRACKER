import { useEffect, useState } from 'react'
import axios from 'axios'

const API = '/api/alumni/'

export default function AdminPanel() {
  const [alumni, setAlumni] = useState([])
  const [form, setForm] = useState({
    name: '', batch_year: '', company: '', city: '', country: ''
  })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const fetchAlumni = async () => {
    const res = await axios.get(API)
    setAlumni(res.data)
  }

  useEffect(() => { fetchAlumni() }, [])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      await axios.post(API, form)
      setMsg('✅ Alumni added successfully!')
      setForm({ name: '', batch_year: '', company: '', city: '', country: '' })
      fetchAlumni()
    } catch {
      setMsg('❌ Error adding alumni.')
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this alumni?')) {
      await axios.delete(`${API}${id}/`)
      fetchAlumni()
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h1 style={{ color: '#60a5fa', marginBottom: 24 }}>🎓 Alumni Admin Panel</h1>

      {/* FORM */}
      <div style={{ background: '#1e1e2e', padding: 24, borderRadius: 12, marginBottom: 32 }}>
        <h2 style={{ marginBottom: 16 }}>Add New Alumni</h2>
        <form onSubmit={handleSubmit}>
          {[
            { label: 'Full Name', name: 'name', type: 'text' },
            { label: 'Batch Year', name: 'batch_year', type: 'number' },
            { label: 'Company', name: 'company', type: 'text' },
            { label: 'City', name: 'city', type: 'text' },
            { label: 'Country', name: 'country', type: 'text' },
          ].map(field => (
            <div key={field.name} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, color: '#94a3b8' }}>{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                required
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '1px solid #334155', background: '#0f172a',
                  color: 'white', fontSize: 14
                }}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8, padding: '10px 24px', background: '#3b82f6',
              color: 'white', border: 'none', borderRadius: 8,
              cursor: 'pointer', fontSize: 15, fontWeight: 'bold'
            }}
          >
            {loading ? 'Saving...' : 'Add Alumni'}
          </button>
          {msg && <p style={{ marginTop: 12, color: msg.includes('✅') ? '#4ade80' : '#f87171' }}>{msg}</p>}
        </form>
      </div>

      {/* TABLE */}
      <div style={{ background: '#1e1e2e', padding: 24, borderRadius: 12 }}>
        <h2 style={{ marginBottom: 16 }}>All Alumni ({alumni.length})</h2>
        {alumni.length === 0 ? <p style={{ color: '#64748b' }}>No alumni added yet.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Batch</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Company</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>City</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Lat/Lng</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {alumni.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '8px' }}>{a.name}</td>
                  <td style={{ padding: '8px' }}>{a.batch_year}</td>
                  <td style={{ padding: '8px' }}>{a.company}</td>
                  <td style={{ padding: '8px' }}>{a.city}</td>
                  <td style={{ padding: '8px', color: '#4ade80', fontSize: 11 }}>
                    {a.latitude?.toFixed(2)}, {a.longitude?.toFixed(2)}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <button
                      onClick={() => handleDelete(a.id)}
                      style={{
                        padding: '4px 10px', background: '#ef4444',
                        border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer'
                      }}
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}