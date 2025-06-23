"use client"

import { useEffect, useRef, useState } from "react"

export default function Mapa({ userLocation, locations, onMarkerClick, selectedLocation, category }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  console.log("🗺️ === MAPA RENDER ===")
  console.log("📍 userLocation:", userLocation)
  console.log("📍 locations count:", locations?.length || 0)

  // Cargar Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        console.log("📦 Cargando Leaflet...")

        // Verificar si ya está cargado
        if (window.L) {
          console.log("✅ Leaflet ya disponible")
          setLeafletLoaded(true)
          setIsLoading(false)
          return
        }

        // Cargar CSS
        const cssLink = document.createElement("link")
        cssLink.rel = "stylesheet"
        cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        cssLink.onload = () => console.log("✅ CSS de Leaflet cargado")
        document.head.appendChild(cssLink)

        // Cargar JS
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"

        script.onload = () => {
          console.log("✅ Leaflet JS cargado")
          setLeafletLoaded(true)
          setIsLoading(false)
        }

        script.onerror = () => {
          console.error("❌ Error cargando Leaflet")
          setError("Error cargando la librería de mapas")
          setIsLoading(false)
        }

        document.head.appendChild(script)
      } catch (error) {
        console.error("❌ Error en loadLeaflet:", error)
        setError(`Error cargando Leaflet: ${error.message}`)
        setIsLoading(false)
      }
    }

    loadLeaflet()
  }, [])

  // Inicializar mapa
  useEffect(() => {
    if (!leafletLoaded || !window.L || !mapRef.current || !userLocation) {
      console.log("⏳ Esperando condiciones para inicializar mapa...")
      return
    }

    console.log("🗺️ Inicializando mapa...")

    try {
      // Limpiar mapa anterior
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }

      // Crear mapa
      const map = window.L.map(mapRef.current).setView([userLocation.lat, userLocation.lng], 13)
      mapInstanceRef.current = map

      // Agregar tiles
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map)

      // Marcador del usuario
      const userMarker = window.L.marker([userLocation.lat, userLocation.lng])
        .addTo(map)
        .bindPopup("📍 Tu ubicación")
        .openPopup()

      console.log("✅ Mapa inicializado correctamente")
      setError(null)
    } catch (error) {
      console.error("❌ Error inicializando mapa:", error)
      setError(`Error inicializando mapa: ${error.message}`)
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [leafletLoaded, userLocation])

  // Agregar marcadores de ubicaciones
  useEffect(() => {
    if (!leafletLoaded || !window.L || !mapInstanceRef.current || !locations) {
      return
    }

    console.log("📍 Agregando marcadores...", locations.length)

    try {
      // Limpiar marcadores anteriores
      markersRef.current.forEach((marker) => {
        mapInstanceRef.current.removeLayer(marker)
      })
      markersRef.current = []

      // Agregar nuevos marcadores
      locations.forEach((location, index) => {
        if (!location.lat || !location.lng || location.lat === 0 || location.lng === 0) {
          console.warn(`⚠️ Ubicación ${index} tiene coordenadas inválidas:`, location)
          return
        }

        const marker = window.L.marker([location.lat, location.lng])
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div>
              <h3>${location.name}</h3>
              <p>📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</p>
              ${location.distance ? `<p>📏 ${location.distance.toFixed(2)} km</p>` : ""}
            </div>
          `)

        marker.on("click", () => {
          if (onMarkerClick) onMarkerClick(location)
        })

        markersRef.current.push(marker)
      })

      // Círculo de 5km
      const circle = window.L.circle([userLocation.lat, userLocation.lng], {
        color: "blue",
        fillColor: "#30f",
        fillOpacity: 0.1,
        radius: 5000,
      }).addTo(mapInstanceRef.current)

      markersRef.current.push(circle)

      console.log(`✅ ${locations.length} marcadores agregados`)
    } catch (error) {
      console.error("❌ Error agregando marcadores:", error)
    }
  }, [leafletLoaded, locations, userLocation, onMarkerClick])

  // Estados de error y carga
  if (error) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center p-6">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-bold text-red-800 mb-2">Error en el Mapa</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setLeafletLoaded(false)
              setIsLoading(true)
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-lg font-bold text-blue-800 mb-2">Cargando Mapa...</h3>
          <p className="text-blue-600">{!leafletLoaded ? "Descargando Leaflet..." : "Inicializando mapa..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[600px] w-full relative">
      <div ref={mapRef} className="h-full w-full rounded-lg" />

      {/* Info overlay */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
        <div className="text-sm">
          <div className="font-bold text-gray-800">📍 {locations?.length || 0} ubicaciones</div>
          <div className="text-gray-600">📂 {category}</div>
          <div className="text-gray-600">📏 Radio: 5km</div>
        </div>
      </div>
    </div>
  )
}
