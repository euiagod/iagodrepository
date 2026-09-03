import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { Feed } from './pages/Feed'
import { Discover } from './pages/Discover'
import { Upload } from './pages/Upload'
import { Profile } from './pages/Profile'
import { CarDetail } from './pages/CarDetail'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--bg)] pb-16 text-[var(--text)]">
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/descobrir" element={<Discover />} />
          <Route path="/publicar" element={<Upload />} />
          <Route path="/perfil/:id" element={<Profile />} />
          <Route path="/carro/:id" element={<CarDetail />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
