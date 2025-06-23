const express = require("express")
const router = express.Router()
const { connectRedis, isRedisConnected, geoSearchLocations } = require("../redisClient")

// Datos mock para cuando Redis no esté disponible
const mockData = {
  "Cervecerías artesanales": [
    { id: 1, name: "7 Colinas de Río", lat: -32.480022, lng: -58.235237, distance: 0.5 },
    { id: 2, name: "Baws", lat: -32.485889, lng: -58.232784, distance: 1.2 },
    { id: 3, name: "Drakkar", lat: -32.480520, lng: -58.233980, distance: 2.1 },
  ],
  Universidades: [
    { id: 4, name: "Universidad Autónoma de Entre Ríos", lat: -32.479124, lng: -58.233190, distance: 0.8 },
    { id: 5, name: "Universidad Nacional de Entre Ríos", lat: -32.480666, lng: -58.262164, distance: 1.5 },
  ],
  Farmacias: [
    { id: 6, name: "Farmacia Central", lat: -32.4889, lng: -58.2356, distance: 0.3 },
    { id: 7, name: "Farmacia del Pueblo", lat: -32.4834, lng: -58.2378, distance: 1.1 },
    { id: 8, name: "Farmacia San Martín", lat: -32.4901, lng: -58.2312, distance: 1.8 },
  ],
  "Centros de atención de emergencias": [
    { id: 9, name: "Hospital Urquiza", lat: -32.480918, lng: -58.260957, distance: 0.6 },
    { id: 10, name: "Centro de Salud Municipal", lat: -32.482405, lng: -58.225673, distance: 1.3 },
    { id: 11, name: "Clínica Uruguay", lat: -32.483581, lng: -58.230212, distance: 2.0 },
  ],
  Supermercados: [
    { id: 12, name: "Supermercado Gran Rex", lat: -32.489025, lng: -58.230427, distance: 0.4 },
    { id: 13, name: "Supermercado Supremo", lat: -32.486240, lng: -58.232716, distance: 1.0 },
    { id: 14, name: "Supermercado Dia", lat: -32.482717, lng: -58.227362, distance: 1.7 },
  ],
}

// Array para almacenar ubicaciones agregadas en memoria (cuando no hay Redis)
const memoryStorage = {}

// Función para calcular distancia usando fórmula de Haversine
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radio de la Tierra en km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return distance
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

// Función para validar datos de ubicación
function validateLocationData(data) {
  console.log("🔍 === VALIDANDO DATOS ===")
  console.log("📥 Datos recibidos:", JSON.stringify(data, null, 2))

  const errors = []

  try {
    if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
      errors.push("El nombre es requerido")
    }

    console.log("📍 Validando latitud:", data.latitude, "tipo:", typeof data.latitude)
    if (data.latitude === undefined || data.latitude === null || data.latitude === "") {
      errors.push("La latitud es requerida")
    } else {
      const lat = Number.parseFloat(data.latitude)
      console.log("📍 Latitud parseada:", lat, "esNaN:", Number.isNaN(lat))
      if (Number.isNaN(lat)) {
        errors.push("La latitud debe ser un número válido")
      } else if (lat < -90 || lat > 90) {
        errors.push("La latitud debe estar entre -90 y 90")
      }
    }

    console.log("📍 Validando longitud:", data.longitude, "tipo:", typeof data.longitude)
    if (data.longitude === undefined || data.longitude === null || data.longitude === "") {
      errors.push("La longitud es requerida")
    } else {
      const lng = Number.parseFloat(data.longitude)
      console.log("📍 Longitud parseada:", lng, "esNaN:", Number.isNaN(lng))
      if (Number.isNaN(lng)) {
        errors.push("La longitud debe ser un número válido")
      } else if (lng < -180 || lng > 180) {
        errors.push("La longitud debe estar entre -180 y 180")
      }
    }

    if (!data.category || typeof data.category !== "string") {
      errors.push("La categoría es requerida")
    }

    console.log("✅ Validación completada. Errores:", errors)
    return errors
  } catch (error) {
    console.error("❌ Error durante validación:", error)
    return ["Error durante la validación de datos"]
  }
}

// GET /api/locations/debug - Endpoint para debug
router.get("/debug", async (req, res) => {
  try {
    console.log("🔍 === DEBUG ENDPOINT ===")

    let redisAvailable = false
    let redisError = null
    const redisData = {}

    try {
      redisAvailable = await isRedisConnected()
      console.log("🔌 Redis disponible:", redisAvailable)

      if (redisAvailable) {
        const client = await connectRedis()
        for (const category of Object.keys(mockData)) {
          try {
            // Usar geoSearch para verificar datos
            const results = await geoSearchLocations(`locations:${category}`, 0, 0, 20000, "km", true, true)
            redisData[category] = {
              count: results.length,
              sample: results.slice(0, 2), // Mostrar muestra de datos
            }
          } catch (error) {
            console.error(`Error accessing Redis for ${category}:`, error)
            redisData[category] = `Error: ${error.message}`
          }
        }
      }
    } catch (error) {
      console.error("❌ Error verificando Redis:", error)
      redisError = error.message
      redisAvailable = false
    }

    const debugInfo = {
      success: true,
      debug: {
        memoryStorage,
        mockDataCategories: Object.keys(mockData),
        redisAvailable,
        redisError,
        redisData,
        memoryCategories: Object.keys(memoryStorage),
        memoryCounts: Object.fromEntries(
          Object.entries(memoryStorage).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0]),
        ),
      },
    }

    console.log("📤 Enviando debug info:", debugInfo)
    res.json(debugInfo)
  } catch (error) {
    console.error("❌ Error en debug:", error)
    res.status(500).json({
      error: "Error en debug",
      details: error.message,
      stack: error.stack,
    })
  }
})

// GET /api/locations/:category - Obtener ubicaciones por categoría dentro de un radio
router.get("/:category", async (req, res) => {
  try {
    const { category } = req.params
    const { lat, lng, radius = 5 } = req.query

    console.log(`📍 === GET LOCATIONS ===`)
    console.log(`📂 Categoría solicitada: "${category}"`)
    console.log(`📍 Usuario en: ${lat}, ${lng}`)
    console.log(`📏 Radio: ${radius}km`)

    if (!lat || !lng) {
      return res.status(400).json({
        error: "Se requieren parámetros lat y lng",
      })
    }

    let redisAvailable = false
    try {
      redisAvailable = await isRedisConnected()
      console.log(`🔌 Redis disponible: ${redisAvailable}`)
    } catch (error) {
      console.error("❌ Error verificando Redis:", error.message)
      redisAvailable = false
    }

    if (redisAvailable) {
      // Usar Redis con nuestra función mejorada
      try {
        console.log("💾 Intentando obtener datos de Redis...")

        const results = await geoSearchLocations(
          `locations:${category}`,
          Number.parseFloat(lng),
          Number.parseFloat(lat),
          Number.parseFloat(radius),
          "km",
          true, // WITHCOORD
          true, // WITHDIST
        )

        console.log(`📦 === PROCESANDO RESULTADOS DE REDIS ===`)
        console.log(`📊 Cantidad de resultados: ${results.length}`)

        const locations = results
          .map((result, index) => {
            console.log(`🔍 === PROCESANDO RESULTADO ${index + 1} ===`)
            console.log(`📦 Resultado:`, JSON.stringify(result, null, 2))

            try {
              // Parsear los datos del member
              const locationData = JSON.parse(result.member)

              const processedLocation = {
                ...locationData,
                lat: result.coordinates ? result.coordinates.latitude : 0,
                lng: result.coordinates ? result.coordinates.longitude : 0,
                distance: result.distance || 0,
              }

              console.log(`✅ Ubicación procesada ${index + 1}:`, processedLocation)
              console.log(`📍 Coordenadas finales: lat=${processedLocation.lat}, lng=${processedLocation.lng}`)

              // Validar que las coordenadas no sean 0
              if (processedLocation.lat === 0 && processedLocation.lng === 0) {
                console.error(`❌ Coordenadas inválidas para ${locationData.name}`)
              }

              return processedLocation
            } catch (parseError) {
              console.error(`❌ Error parseando resultado ${index}:`, parseError)
              return null
            }
          })
          .filter(Boolean) // Remover nulls

        console.log(`✅ === UBICACIONES FINALES ===`)
        console.log(`📊 Total procesadas: ${locations.length}`)
        locations.forEach((loc, i) => {
          console.log(`📍 ${i + 1}. ${loc.name}: ${loc.lat}, ${loc.lng}`)
        })

        return res.json({
          success: true,
          data: locations,
          count: locations.length,
          source: "redis",
          debug: {
            rawResults: results,
            processedCount: locations.length,
          },
        })
      } catch (redisError) {
        console.error("❌ Error con Redis, usando datos mock:", redisError.message)
      }
    }

    // Usar datos mock + memoria (fallback)
    console.log("💾 === USANDO DATOS MOCK + MEMORIA ===")
    let allLocations = [...(mockData[category] || [])]

    if (memoryStorage[category] && Array.isArray(memoryStorage[category])) {
      allLocations = allLocations.concat(memoryStorage[category])
    }

    const userLat = Number.parseFloat(lat)
    const userLng = Number.parseFloat(lng)
    const radiusKm = Number.parseFloat(radius)

    const filteredLocations = allLocations.filter((location) => {
      const distance = calculateDistance(userLat, userLng, location.lat, location.lng)
      location.distance = distance
      return distance <= radiusKm
    })

    console.log(`✅ Ubicaciones filtradas (mock+memory):`, filteredLocations)

    res.json({
      success: true,
      data: filteredLocations,
      count: filteredLocations.length,
      source: "mock+memory",
    })
  } catch (error) {
    console.error("❌ Error en GET locations:", error)
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    })
  }
})

// POST /api/locations - Agregar nueva ubicación
router.post("/", async (req, res) => {
  try {
    console.log("📥 === INICIO POST /api/locations ===")
    console.log("📥 Body completo:", JSON.stringify(req.body, null, 2))

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: "No se recibieron datos",
        received: req.body,
      })
    }

    const { name, latitude, longitude, category } = req.body

    console.log("📍 === DATOS EXTRAÍDOS ===")
    console.log("📝 name:", name, "tipo:", typeof name)
    console.log("📍 latitude:", latitude, "tipo:", typeof latitude)
    console.log("📍 longitude:", longitude, "tipo:", typeof longitude)
    console.log("📂 category:", category, "tipo:", typeof category)

    // Validar datos
    const validationErrors = validateLocationData(req.body)
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Datos inválidos",
        details: validationErrors,
        received: req.body,
      })
    }

    // Convertir coordenadas a números
    const lat = Number.parseFloat(latitude)
    const lng = Number.parseFloat(longitude)

    console.log("📍 === COORDENADAS CONVERTIDAS ===")
    console.log("📍 lat final:", lat, "esNaN:", Number.isNaN(lat))
    console.log("📍 lng final:", lng, "esNaN:", Number.isNaN(lng))

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({
        error: "Coordenadas inválidas después de conversión",
        details: { lat, lng, originalLat: latitude, originalLng: longitude },
      })
    }

    const locationData = {
      id: Date.now(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    }

    console.log("📦 locationData creado:", locationData)

    // Intentar usar Redis
    let redisAvailable = false
    try {
      redisAvailable = await isRedisConnected()
      console.log("🔌 Redis disponible:", redisAvailable)
    } catch (error) {
      console.error("❌ Error verificando Redis:", error.message)
      redisAvailable = false
    }

    if (redisAvailable) {
      try {
        console.log("💾 === GUARDANDO EN REDIS ===")
        console.log("🔑 Key:", `locations:${category}`)
        console.log("📍 Coordenadas para Redis:", { longitude: lng, latitude: lat })
        console.log("📦 Member data:", JSON.stringify(locationData))

        const client = await connectRedis()

        const geoAddResult = await client.geoAdd(`locations:${category}`, {
          longitude: lng,
          latitude: lat,
          member: JSON.stringify(locationData),
        })

        console.log("✅ geoAdd resultado:", geoAddResult)

        // Verificar que se guardó correctamente
        const verification = await geoSearchLocations(`locations:${category}`, lng, lat, 0.1, "km", true, true)
        console.log("🔍 Verificación inmediata:", verification)

        console.log(`✅ Ubicación agregada a Redis: ${name}`)
        return res.status(201).json({
          success: true,
          message: "Ubicación agregada exitosamente a Redis",
          data: {
            ...locationData,
            lat: lat,
            lng: lng,
            category,
          },
          source: "redis",
          debug: {
            geoAddResult,
            verification,
          },
        })
      } catch (redisError) {
        console.error("❌ Error agregando a Redis:", redisError.message)
        console.error("❌ Stack:", redisError.stack)
      }
    }

    // Fallback a memoria
    console.log("💾 === GUARDANDO EN MEMORIA ===")
    if (!memoryStorage[category]) {
      memoryStorage[category] = []
    }

    const newLocation = {
      ...locationData,
      lat: lat,
      lng: lng,
      distance: 0,
    }

    console.log("📦 Ubicación para memoria:", newLocation)
    memoryStorage[category].push(newLocation)

    console.log(`✅ Ubicación agregada a memoria: ${name}`)
    console.log("💾 Estado actual de memoria:", memoryStorage)

    res.status(201).json({
      success: true,
      message: "Ubicación agregada exitosamente a memoria",
      data: {
        ...locationData,
        lat: lat,
        lng: lng,
        category,
      },
      source: "memory",
    })
  } catch (error) {
    console.error("❌ Error en POST locations:", error)
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
      stack: error.stack,
    })
  }
})

// POST /api/locations/seed - Poblar datos iniciales
router.post("/seed", async (req, res) => {
  try {
    console.log("🌱 === SEED ENDPOINT ===")

    let redisAvailable = false
    try {
      redisAvailable = await isRedisConnected()
      console.log("🔌 Redis disponible:", redisAvailable)
    } catch (error) {
      console.error("❌ Error verificando Redis:", error.message)
      redisAvailable = false
    }

    if (!redisAvailable) {
      // Fallback a memoria
      console.log("💾 Copiando mock data a memoria...")
      let totalCopied = 0

      for (const [category, locations] of Object.entries(mockData)) {
        if (!memoryStorage[category]) {
          memoryStorage[category] = []
        }
        // Limpiar y reemplazar
        memoryStorage[category] = [...locations]
        totalCopied += locations.length
        console.log(`✅ Copiados ${locations.length} elementos a ${category}`)
      }

      console.log("💾 Estado final de memoria:", memoryStorage)

      return res.json({
        success: true,
        message: "Datos mock copiados a memoria",
        source: "memory",
        totalAdded: totalCopied,
        debug: {
          memoryStorage,
        },
      })
    }

    // Usar Redis - limpiar y repoblar
    const client = await connectRedis()

    // Limpiar datos existentes
    for (const category of Object.keys(mockData)) {
      await client.del(`locations:${category}`)
    }

    let totalAdded = 0
    for (const [category, locations] of Object.entries(mockData)) {
      console.log(`🌱 Poblando categoría: ${category}`)
      for (const location of locations) {
        const locationData = {
          id: location.id,
          name: location.name,
          createdAt: new Date().toISOString(),
        }

        console.log(`📍 Agregando: ${location.name} en ${location.lat}, ${location.lng}`)

        await client.geoAdd(`locations:${category}`, {
          longitude: location.lng,
          latitude: location.lat,
          member: JSON.stringify(locationData),
        })

        totalAdded++
      }
    }

    console.log(`✅ ${totalAdded} ubicaciones agregadas a Redis`)
    res.json({
      success: true,
      message: "Datos iniciales agregados exitosamente a Redis",
      totalAdded,
      source: "redis",
    })
  } catch (error) {
    console.error("❌ Error en seed:", error)
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    })
  }
})

module.exports = router
