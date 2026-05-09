import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import MapView from './components/MapView'
import CityGallery from './components/CityGallery'
import AuthModal from './components/AuthModal'
import { useCities } from './hooks/useCities'
import { useState } from 'react'

function AppContent() {
  const { cities } = useCities()
  const [selectedCity, setSelectedCity] = useState(null)
  const [showAuth, setShowAuth] = useState(false)

  return (
    <div className="app">
      <Navbar onLogin={() => setShowAuth(true)} />
      <MapView cities={cities} onCityClick={(city) => setSelectedCity(city)} />
      {selectedCity && (
        <CityGallery
          city={selectedCity}
          onClose={() => setSelectedCity(null)}
        />
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
