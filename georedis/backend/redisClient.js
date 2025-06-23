const redis = require("redis")

// Configuración para Redis local
const client = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        console.log("❌ Demasiados intentos de reconexión a Redis")
        return false
      }
      console.log(`🔄 Reintentando conexión a Redis (${retries}/3)`)
      return Math.min(retries * 1000, 3000)
    },
    connectTimeout: 5000,
  },
})

client.on("error", (err) => {
  console.error("❌ Redis Error:", err.message)
})

client.on("connect", () => {
  console.log("🔌 Conectando a Redis...")
})

client.on("ready", () => {
  console.log("✅ Redis listo para usar")
})

client.on("end", () => {
  console.log("🔌 Conexión Redis cerrada")
})

// Función para conectar
async function connectRedis() {
  try {
    if (!client.isOpen) {
      console.log("🔌 Abriendo conexión a Redis...")
      await client.connect()
    }
    return client
  } catch (error) {
    console.error("❌ Error conectando a Redis:", error.message)
    throw error
  }
}

// Función para verificar conexión
async function isRedisConnected() {
  try {
    if (!client.isOpen) {
      await connectRedis()
    }
    const result = await client.ping()
    console.log("✅ Redis PING:", result)
    return true
  } catch (error) {
    console.error("❌ Redis PING falló:", error.message)
    return false
  }
}

// Función para cerrar conexión
async function closeRedis() {
  try {
    if (client.isOpen) {
      await client.quit()
      console.log("✅ Redis desconectado")
    }
  } catch (error) {
    console.error("❌ Error cerrando Redis:", error.message)
  }
}

// Función mejorada para buscar ubicaciones geoespaciales
async function geoSearchLocations(key, longitude, latitude, radius, unit = "km", withCoord = false, withDist = false) {
  try {
    const client = await connectRedis()

    console.log(`🔍 === GEOSEARCH MEJORADO ===`)
    console.log(`🔑 Key: ${key}`)
    console.log(`📍 Centro: ${longitude}, ${latitude}`)
    console.log(`📏 Radio: ${radius}${unit}`)

    // Primero obtener los miembros básicos
    const members = await client.geoSearch(
      key,
      { longitude: longitude, latitude: latitude },
      { radius: radius, unit: unit },
    )

    console.log(`📦 Miembros encontrados: ${members.length}`)
    console.log(`📋 Miembros:`, members)

    if (members.length === 0) {
      return []
    }

    // Ahora obtener coordenadas y distancias por separado
    const results = []

    for (const member of members) {
      console.log(`🔍 Procesando miembro: ${member}`)

      let coordinates = null
      let distance = null

      try {
        // Obtener coordenadas si se solicitan
        if (withCoord) {
          const coords = await client.geoPos(key, member)
          if (coords && coords[0]) {
            coordinates = {
              longitude: Number.parseFloat(coords[0].longitude),
              latitude: Number.parseFloat(coords[0].latitude),
            }
            console.log(`📍 Coordenadas obtenidas: ${coordinates.longitude}, ${coordinates.latitude}`)
          }
        }

        // Calcular distancia si se solicita
        if (withDist && coordinates) {
          // Usar fórmula de Haversine para calcular distancia
          distance = calculateHaversineDistance(latitude, longitude, coordinates.latitude, coordinates.longitude)
          console.log(`📏 Distancia calculada: ${distance}km`)
        }

        results.push({
          member: member,
          coordinates: coordinates,
          distance: distance,
        })
      } catch (memberError) {
        console.error(`❌ Error procesando miembro ${member}:`, memberError.message)
        // Agregar el miembro sin coordenadas/distancia
        results.push({
          member: member,
          coordinates: null,
          distance: null,
        })
      }
    }

    console.log(`✅ Resultados procesados: ${results.length}`)
    return results
  } catch (error) {
    console.error("❌ geoSearchLocations error:", error.message)
    console.error("❌ Stack:", error.stack)
    throw error
  }
}

// Función para calcular distancia usando fórmula de Haversine
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radio de la Tierra en km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return Number.parseFloat(distance.toFixed(3))
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

// Función para probar Redis con operaciones geoespaciales
async function testRedis() {
  try {
    console.log("🧪 === PROBANDO REDIS COMPLETO ===")
    const testClient = await connectRedis()

    // Probar operaciones básicas
    await testClient.set("test:key", "test:value")
    const value = await testClient.get("test:key")
    console.log("✅ Test básico:", value === "test:value" ? "PASÓ" : "FALLÓ")

    // Limpiar datos previos
    await testClient.del("test:locations")

    // Probar operaciones geoespaciales
    const testData = { id: 1, name: "Test Location" }
    const testLat = -32.4877
    const testLng = -58.2342

    console.log("📍 === AGREGANDO DATOS DE PRUEBA ===")
    console.log("📦 Data:", JSON.stringify(testData))
    console.log("📍 Coordenadas:", testLat, testLng)

    await testClient.geoAdd("test:locations", {
      longitude: testLng,
      latitude: testLat,
      member: JSON.stringify(testData),
    })

    // Usar nuestra función mejorada
    const geoResults = await geoSearchLocations("test:locations", testLng, testLat, 1, "km", true, true)

    console.log("✅ Test geoespacial:", geoResults.length > 0 ? "PASÓ" : "FALLÓ")
    console.log("📍 Resultados encontrados:", geoResults.length)

    // Limpiar datos de prueba
    await testClient.del("test:key")
    await testClient.del("test:locations")

    console.log("✅ Redis funcionando correctamente")
    return true
  } catch (error) {
    console.error("❌ Error probando Redis:", error.message)
    return false
  }
}

module.exports = {
  client,
  connectRedis,
  isRedisConnected,
  closeRedis,
  testRedis,
  geoSearchLocations,
  calculateHaversineDistance,
}
