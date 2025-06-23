"use client"

import React from "react"
import { useState, useEffect } from "react"
import Header from "./components/Header"
import CategoryGrid from "./components/CategoryGrid"
import Formulario from "./Formulario"
import Mapa from "./Mapa"
import LocationDetails from "./components/LocationDetails"
import LocationsList from "./components/LocationList"
import { getLocationsByCategory, addLocation, seedInitialData, checkApiHealth } from "./services/api"
import "./App.css"
import "./index.css"

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error("🚨 Error Boundary:", error, errorInfo)
    this.setState({ error: error })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-100 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center border-4 border-red-500">
            <div className="text-red-500 text-8xl mb-6">💥</div>
            <h2 className="text-4xl font-bold text-red-800 mb-6">¡Algo salió mal!</h2>
            <p className="text-xl text-red-600 mb-8">La aplicación encontró un error inesperado.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-8 py-4 rounded-xl hover:bg-red-600 transition-colors font-bold text-xl border-2 border-red-600"            >
              🔄 Recargar Aplicación
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  const [userLocation, setUserLocation] = useState({ lat: -32.4877, lng: -58.2342 })
  const [selectedCategory, setSelectedCategory] = useState("Cervecerías artesanales")
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [distance, setDistance] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState("checking")
  const [errorMessage, setErrorMessage] = useState("")
  const [showLocationsList, setShowLocationsList] = useState(false)

  const categories = [
    "Cervecerías artesanales",
    "Universidades",
    "Farmacias",
    "Centros de atención de emergencias",
    "Supermercados",
  ]

  // Verificar API
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log("🔄 Verificando conexión API...")
        await checkApiHealth()
        setApiStatus("connected")
        setErrorMessage("")
        console.log("✅ API conectada")
      } catch (error) {
        console.error("❌ Error API:", error.message)
        setApiStatus("error")
        setErrorMessage(error.message)
      }
    }

    checkConnection()
  }, [])

  // Obtener ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserLocation(newLocation)
          console.log("📍 Ubicación actualizada:", newLocation)
        },
        (error) => {
          console.error("❌ Error geolocalización:", error)
          console.log("📍 Usando ubicación por defecto")
        },
      )
    }
  }, [])

  // Cargar ubicaciones
  useEffect(() => {
    if (apiStatus !== "connected") return

    const loadLocations = async () => {
      setIsLoading(true)
      try {
        console.log(`🔍 === CARGANDO UBICACIONES ===`)
        console.log(`📂 Categoría: ${selectedCategory}`)
        console.log(`📍 Usuario: ${userLocation.lat}, ${userLocation.lng}`)

        const locationsData = await getLocationsByCategory(selectedCategory, userLocation.lat, userLocation.lng, 5)

        console.log(`📦 === DATOS RECIBIDOS ===`)
        console.log(`📊 Cantidad: ${locationsData.length}`)
        console.log(`📍 Datos completos:`, locationsData)

        // Verificar coordenadas de cada ubicación
        locationsData.forEach((location, index) => {
          console.log(`📍 Ubicación ${index + 1}: ${location.name}`)
          console.log(`   - lat: ${location.lat} (tipo: ${typeof location.lat})`)
          console.log(`   - lng: ${location.lng} (tipo: ${typeof location.lng})`)
          console.log(`   - distance: ${location.distance}`)
        })

        if (Array.isArray(locationsData)) {
          setLocations(locationsData)
        } else {
          console.error("❌ Datos no válidos:", locationsData)
          setLocations([])
        }
      } catch (error) {
        console.error("❌ Error cargando ubicaciones:", error)
        setLocations([])
        setErrorMessage(`Error: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadLocations()
  }, [userLocation, selectedCategory, apiStatus])

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const deg2rad = (deg) => deg * (Math.PI / 180)

  const handleAddLocation = async (formData) => {
    try {
      console.log("📤 === AGREGANDO UBICACIÓN ===")
      console.log("📝 Datos del formulario:", formData)

      const result = await addLocation({
        name: formData.name,
        latitude: formData.latitude,
        longitude: formData.longitude,
        category: formData.category,
      })

      console.log("✅ Respuesta del servidor:", result)

      // Recargar ubicaciones después de un delay
      setTimeout(async () => {
        console.log("🔄 Recargando ubicaciones...")
        const locationsData = await getLocationsByCategory(selectedCategory, userLocation.lat, userLocation.lng, 5)
        if (Array.isArray(locationsData)) {
          setLocations(locationsData)
        }
      }, 1000)

      setShowForm(false)
      alert(`✅ ${formData.name} agregado exitosamente!`)
      return true
    } catch (error) {
      console.error("❌ Error agregando:", error)
      throw error
    }
  }

  const handleMarkerClick = (location) => {
    console.log("🖱️ Click en:", location.name)
    console.log("📍 Coordenadas:", location.lat, location.lng)
    setSelectedLocation(location)
    const dist = calculateDistance(userLocation.lat, userLocation.lng, location.lat, location.lng)
    setDistance(dist)
  }

  const handleSeedData = async () => {
    try {
      setIsLoading(true)
      console.log("🌱 === POBLANDO DATOS ===")

      const result = await seedInitialData()
      console.log("🌱 Resultado del seed:", result)

      // Esperar un poco y recargar
      setTimeout(async () => {
        console.log("🔄 Recargando después del seed...")
        const locationsData = await getLocationsByCategory(selectedCategory, userLocation.lat, userLocation.lng, 5)
        console.log("📦 Datos después del seed:", locationsData)

        if (Array.isArray(locationsData)) {
          setLocations(locationsData)
        }
      }, 1500)

      alert("✅ Datos poblados!")
    } catch (error) {
      console.error("❌ Error poblando:", error)
      alert(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Estados de carga
  if (apiStatus === "checking") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-3xl shadow-2xl border-4 border-blue-500">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Conectando...</h2>
          <p className="text-xl text-gray-600">Verificando servidor backend</p>
          <div/>
        </div>
      </div>
    )
  }

  if (apiStatus === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-3xl shadow-2xl max-w-lg border-4 border-red-500">
          <div className="text-red-500 text-8xl mb-6">⚠️</div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Error de Conexión</h2>
          <p className="text-xl text-gray-600 mb-6">No se puede conectar con el servidor.</p>
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-xl">
              <p className="text-lg text-red-800">{errorMessage}</p>
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-8 py-4 rounded-xl hover:bg-blue-600 transition-colors border-2 border-blue-600 text-xl font-bold"
            > 
            🔄 Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header />

        <div className="container mx-auto px-6 py-12">
          {/* Titulos */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6">
              Conocé <span className="text-blue-600">Concepción del Uruguay</span>
            </h1>
            <p className="text-2xl text-gray-600 mb-12 max-w-4xl mx-auto">
              Tu mapa turístico para explorar nuestra ciudad
            </p>

            {/* Control de servidor */}
            <div className="flex justify-center items-center gap-4 text-sm flex-wrap">
              <button
                onClick={handleSeedData}
                disabled={isLoading}
                className="bg-blue-500 text-white px-8 py-4 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 border-2 border-blue-600 font-bold text-lg"
              >
                {isLoading ? "Poblando..." : "🌱 Poblar/Recargar datos"}
              </button>

              <button
                onClick={() => setShowLocationsList(!showLocationsList)}
                className="bg-black-500 text-white px-8 py-4 rounded-xl hover:bg-gray-600 transition-colors border-2 border-gray-600 font-bold text-lg"
              >
                {showLocationsList ? "🗺️ Ver Mapa" : "📋 Ver Lista"}
              </button>
            </div>
          </div>

          {/* Categorias */}
          <CategoryGrid
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            locationCounts={locations.length}
          />

          {/* Main */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-16">
            {/* Mapa y Lista */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-blue-200">
                <div className="p-8 bg-gradient-to-r from-blue-600 to-purple-600">
                  <h2 className="text-3xl font-bold mb-3 text-black">
                    {showLocationsList ? "Lista de Ubicaciones" : "Mapa Interactivo"}
                  </h2>
                  <p className="opacity-90 text-xl">
                    {selectedCategory} • {locations.length} encontradas
                    {isLoading && " • Cargando..."}
                  </p>
                </div>
                <div className="p-0">
                  {showLocationsList ? (
                    <LocationsList
                      locations={locations}
                      userLocation={userLocation}
                      onLocationClick={handleMarkerClick}
                      selectedLocation={selectedLocation}
                    />
                  ) : (
                    <Mapa
                      userLocation={userLocation}
                      locations={locations}
                      onMarkerClick={handleMarkerClick}
                      selectedLocation={selectedLocation}
                      category={selectedCategory}
                    />
                  )}
                </div>
              </div>
            </div>

            
            <div className="space-y-8">
              {/* boton de agregar nuevo lugar */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-green-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">¿Conoces un lugar?</h3>
                <p className="text-xl text-gray-600 mb-6">Ayuda a otros turistas agregando lugares de interés</p>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-black py-4 px-8 rounded-2xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-xl hover:shadow-2xl border-2 border-green-600 text-xl"
                >
                  {showForm ? "❌ Cancelar" : "➕ Agregar Lugar"}
                </button>
              </div>

              {/* Formulario */}
              {showForm && (
                <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-yellow-200">
                  <Formulario onSubmit={handleAddLocation} categories={categories} />
                </div>
              )}

              {/* Detalles de ubicaciones */}
              {selectedLocation && distance && (
                <LocationDetails location={selectedLocation} distance={distance} category={selectedCategory} />
              )}

              {/* Estadisticas */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-purple-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">📊 Estadísticas</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl text-gray-600">Lugares encontrados</span>
                    <span className="font-bold text-black-600 text-2xl">{locations.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl text-gray-600">Radio de búsqueda</span>
                    <span className="font-bold text-purple-600 text-2xl">5 km</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl text-gray-600">Vista actual</span>
                    <span className="font-bold text-green-600 text-xl">
                      {showLocationsList ? "📋 Lista" : "🗺️ Mapa"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App
