import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Providers } from './components/Providers'
import { Home } from './pages/Home'
import { Setup } from './pages/Setup'
import { Feed } from './pages/Feed'

function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/:ens" element={<Feed />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  )
}

export default App
