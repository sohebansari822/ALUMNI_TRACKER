import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminPanel from './pages/AdminPanel'
import ARView from './pages/ARView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ARView />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App