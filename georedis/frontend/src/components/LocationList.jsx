"use client"

import { useState } from "react"

export default function LocationsList({ locations, userLocation, onLocationClick, selectedLocation }) {
  const [error, setError] = useState(null)

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    try {
      const R = 6371
      const dLat = deg2rad(lat2 - lat1)
      const dLon = deg2rad(lon2 - lon1)
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distance = R * c
      return distance
    } catch (error) {
      console.error("❌ Error calculando distancia:", error)
      return 0
    }
  }

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180)
  }

  // Validar props
  if (!userLocation || !userLocation.lat || !userLocation.lng) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-red-800 mb-2">Error de Ubicación</h3>
        <p className="text-red-600">No se pudo obtener tu ubicación actual.</p>
      </div>
    )
  }

  if (!locations) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Cargando ubicaciones...</h3>
      </div>
    )
  }

  if (!Array.isArray(locations)) {
    console.error("❌ Locations no es un array:", locations)
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-red-800 mb-2">Error de Datos</h3>
        <p className="text-red-600">Los datos de ubicaciones no son válidos.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          🔄 Recargar
        </button>
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">📍</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No hay ubicaciones</h3>
        <p className="text-gray-600 mb-2">No se encontraron ubicaciones en esta categoría.</p>
        <p className="text-sm text-gray-500">Intenta agregar una nueva ubicación o poblar datos de ejemplo.</p>
      </div>
    )
  }

  try {
    return (
      <div className="p-6 max-h-[600px] overflow-y-auto">
        <div className="mb-4 text-sm text-gray-600">📊 Mostrando {locations.length} ubicaciones encontradas</div>

        <div className="space-y-4">
          {locations.map((location, index) => {
            try {
              // Validar ubicación individual
              if (!location || typeof location !== "object") {
                console.error(`❌ Ubicación ${index} inválida:`, location)
                return null
              }

              const distance =
                location.distance ||
                calculateDistance(userLocation.lat, userLocation.lng, location.lat || 0, location.lng || 0)

              const isSelected =
                selectedLocation && selectedLocation.id === location.id && selectedLocation.name === location.name

              return (
                <div
                  key={location.id || `location-${index}`}
                  onClick={() => {
                    try {
                      if (onLocationClick && typeof onLocationClick === "function") {
                        onLocationClick(location)
                      }
                    } catch (clickError) {
                      console.error("❌ Error en click de ubicación:", clickError)
                    }
                  }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-800">{location.name || "Sin nombre"}</h4>
                    <span className="text-sm text-blue-600 font-medium">{distance.toFixed(2)} km</span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span>
                        {(location.lat || 0).toFixed(4)}, {(location.lng || 0).toFixed(4)}
                      </span>
                    </div>

                    {location.id && (
                      <div className="flex items-center gap-2">
                        <span>🆔</span>
                        <span>ID: {location.id}</span>
                      </div>
                    )}

                    {location.createdAt && (
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>Agregado: {new Date(location.createdAt).toLocaleDateString("es-ES")}</span>
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <span className="text-xs text-blue-600 font-medium">✓ Seleccionado</span>
                    </div>
                  )}
                </div>
              )
            } catch (itemError) {
              console.error(`❌ Error renderizando ubicación ${index}:`, itemError)
              return (
                <div key={`error-${index}`} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">Error mostrando ubicación {index + 1}</p>
                </div>
              )
            }
          })}
        </div>
      </div>
    )
  } catch (error) {
    console.error("❌ Error general en LocationsList:", error)
    setError(error.message)

    return (
      <div className="p-8 text-center">
        <div className="text-red-500 text-4xl mb-4">💥</div>
        <h3 className="text-xl font-bold text-red-800 mb-2">Error en la Lista</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null)
            window.location.reload()
          }}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          🔄 Recargar
        </button>
      </div>
    )
  }
}
