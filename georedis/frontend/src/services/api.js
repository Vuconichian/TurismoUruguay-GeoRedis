const API_BASE_URL = "http://localhost:3001/api"

// Función helper para manejar respuestas
async function handleResponse(response) {
  const contentType = response.headers.get("content-type")

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`

    try {
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json()
        errorMessage = error.error || error.message || errorMessage
      } else {
        const text = await response.text()
        errorMessage = text || errorMessage
      }
    } catch (parseError) {
      console.error("Error parsing error response:", parseError)
    }

    throw new Error(errorMessage)
  }

  if (contentType && contentType.includes("application/json")) {
    return response.json()
  } else {
    return response.text()
  }
}

// Función para verificar conectividad básica
async function testConnection() {
  try {
    const response = await fetch("http://localhost:3001", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
    return response.ok
  } catch (error) {
    console.error("Error de conectividad:", error)
    return false
  }
}

// Obtener ubicaciones por categoría
export async function getLocationsByCategory(category, userLat, userLng, radius = 5) {
  try {
    const url = `${API_BASE_URL}/locations/${encodeURIComponent(category)}?lat=${userLat}&lng=${userLng}&radius=${radius}`
    console.log("🔗 Llamando a:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    const data = await handleResponse(response)
    console.log("✅ Datos recibidos:", data)
    return data.data || []
  } catch (error) {
    console.error("❌ Error fetching locations:", error)
    throw error
  }
}

// Agregar nueva ubicación
export async function addLocation(locationData) {
  try {
    console.log("📤 Enviando ubicación:", locationData)

    // Validar datos antes de enviar
    if (!locationData.name || !locationData.latitude || !locationData.longitude || !locationData.category) {
      throw new Error("Todos los campos son requeridos")
    }

    // Validar que las coordenadas sean números válidos
    const lat = Number.parseFloat(locationData.latitude)
    const lng = Number.parseFloat(locationData.longitude)

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new Error("Las coordenadas deben ser números válidos")
    }

    const payload = {
      name: locationData.name.trim(),
      latitude: lat,
      longitude: lng,
      category: locationData.category,
    }

    console.log("📦 Payload final:", payload)

    const response = await fetch(`${API_BASE_URL}/locations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await handleResponse(response)
    console.log("✅ Ubicación agregada:", data)
    return data.data || data
  } catch (error) {
    console.error("❌ Error adding location:", error)
    throw error
  }
}

// Calcular distancia entre usuario y ubicación
export async function getDistanceToLocation(category, locationId, userLat, userLng) {
  try {
    const url = `${API_BASE_URL}/locations/${encodeURIComponent(category)}/distance/${locationId}?userLat=${userLat}&userLng=${userLng}`
    console.log("🔗 Calculando distancia:", url)

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    })
    const data = await handleResponse(response)
    return data.data
  } catch (error) {
    console.error("❌ Error calculating distance:", error)
    throw error
  }
}

// Poblar datos iniciales (ahora opcional)
export async function seedInitialData() {
  try {
    console.log("🌱 Poblando datos iniciales...")

    const response = await fetch(`${API_BASE_URL}/locations/seed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    const data = await handleResponse(response)
    console.log("✅ Datos poblados:", data)
    return data
  } catch (error) {
    console.error("❌ Error seeding data:", error)
    throw error
  }
}

// Verificar estado de la API
export async function checkApiHealth() {
  try {
    console.log("🏥 Verificando salud de la API...")

    // Primero probar conectividad básica
    const isConnected = await testConnection()
    if (!isConnected) {
      throw new Error("No se puede conectar al servidor backend")
    }

    // Luego probar el endpoint de health
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    const data = await handleResponse(response)
    console.log("✅ API saludable:", data)
    return data
  } catch (error) {
    console.error("❌ Error checking API health:", error)
    throw error
  }
}
