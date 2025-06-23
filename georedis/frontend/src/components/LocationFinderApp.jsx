"use client"

import { useState, useEffect } from "react"
import Navbar from "./Navbar"
import LocationForm from "./LocationForm"
import LocationMap from "./LocationMap"

export default function LocationFinderApp() {
  const [userLocation, setUserLocation] = useState({ lat: -32.484787, lng: -58.232139 })
  const [selectedCategory, setSelectedCategory] = useState("Cervecerias")
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [distance, setDistance] = useState(null)
  const [userName, setUserName] = useState("")

  // Aca buscamos la ubicacion del usuario a partir del navegador
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
        },
      )
    }
  }, [])

  // Load locations from Redis
  useEffect(() => {
    const loadLocations = async () => {
      try {
        // Seed initial data if needed
        await seedInitialData()

        // Get locations from Redis
        const locationsFromRedis = await getLocationsInRadius(
          selectedCategory,
          userLocation.lat,
          userLocation.lng,
          5, // 5km
        )

        setLocations(locationsFromRedis)
      } catch (error) {
        console.error("Error loading locations:", error)
        setLocations([])
      }
    }

    loadLocations()
  }, [userLocation, selectedCategory])

  // Calcula la distancia entre dos puntos usando la formula de Haversine
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Radio de la tierra en km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c // Distancia in km
    return distance
  }

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180)
  }

  const addNewLocation = async (formData) => {
    try {
      const newLocation = {
        id: Date.now(), // generacion simple de ID
        name: formData.name,
        lat: Number.parseFloat(formData.latitude),
        lng: Number.parseFloat(formData.longitude),
      }

      // Importa la funcion storeLocation si no esta importada
      const { storeLocation } = await import("../lib/redis")

      // Guardado en Redis
      await storeLocation(formData.category, newLocation)

      // Recargar ubicaciones
      const locationsFromRedis = await getLocationsInRadius(
        selectedCategory,
        userLocation.lat,
        userLocation.lng,
        5, // 5km
      )

      setLocations(locationsFromRedis)

      return true
    } catch (error) {
      console.error("Error adding location:", error)
      return false
    }
  }

  const handleFormSubmit = async (formData) => {
    setUserName(formData.name)
    setUserLocation({ lat: Number.parseFloat(formData.latitude), lng: Number.parseFloat(formData.longitude) })
    setSelectedCategory(formData.category)

    if (formData.saveLocation) {
      await addNewLocation(formData)
    }
  }

  const handleMarkerClick = (location) => {
    setSelectedLocation(location)
    const distance = calculateDistance(userLocation.lat, userLocation.lng, location.lat, location.lng)
    setDistance(distance)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar activeCategory={selectedCategory} onCategoryChange={(category) => setSelectedCategory(category)} />
      <div className="flex flex-col md:flex-row flex-1 p-4 gap-4">
        <div className="w-full md:w-1/3 bg-white rounded-lg shadow p-4">
          <LocationForm onSubmit={handleFormSubmit} />

          {selectedLocation && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-lg">{selectedLocation.name}</h3>
              <p>Distancia: {distance.toFixed(2)} km</p>
            </div>
          )}
        </div>
        <div className="w-full md:w-2/3 bg-white rounded-lg shadow">
          <LocationMap
            userLocation={userLocation}
            locations={locations}
            onMarkerClick={handleMarkerClick}
            selectedLocation={selectedLocation}
          />
        </div>
      </div>
    </div>
  )
}
