// Archivo para probar Redis independientemente
const redis = require("redis")

async function testRedisConnection() {
  console.log("🧪 === PROBANDO CONEXIÓN REDIS ===")

  const client = redis.createClient({
    url: "redis://localhost:6379",
  })

  try {
    console.log("🔌 Conectando a Redis...")
    await client.connect()

    console.log("📡 Enviando PING...")
    const pong = await client.ping()
    console.log("✅ Respuesta:", pong)

    console.log("💾 Probando SET/GET...")
    await client.set("test", "funcionando")
    const value = await client.get("test")
    console.log("✅ Valor obtenido:", value)

    console.log("🗺️ Probando operaciones geoespaciales...")

    // Limpiar datos previos
    await client.del("test:geo")

    // Agregar ubicación
    const addResult = await client.geoAdd("test:geo", {
      longitude: -58.2342,
      latitude: -32.4877,
      member: "test-location",
    })
    console.log("✅ Ubicación agregada, resultado:", addResult)

    // Probar diferentes sintaxis de geoRadius
    console.log("🔍 Probando geoRadius con sintaxis simple...")
    try {
      // Sintaxis más simple
      const geoResults1 = await client.geoRadius("test:geo", -58.2342, -32.4877, 1, "km")
      console.log("✅ geoRadius simple:", geoResults1)
    } catch (error) {
      console.log("❌ geoRadius simple falló:", error.message)
    }

    console.log("🔍 Probando geoRadius con opciones...")
    try {
      // Con opciones
      const geoResults2 = await client.geoRadius("test:geo", -58.2342, -32.4877, 1, "km", {
        WITHCOORD: true,
        WITHDIST: true,
      })
      console.log("✅ geoRadius con opciones:", geoResults2)
    } catch (error) {
      console.log("❌ geoRadius con opciones falló:", error.message)
    }

    console.log("🔍 Probando geoSearch...")
    try {
      // Usar geoSearch (más moderno)
      const geoResults3 = await client.geoSearch(
        "test:geo",
        {
          longitude: -58.2342,
          latitude: -32.4877,
        },
        {
          radius: 1,
          unit: "km",
        },
      )
      console.log("✅ geoSearch:", geoResults3)
    } catch (error) {
      console.log("❌ geoSearch falló:", error.message)
    }

    console.log("🔍 Probando geoSearch con opciones...")
    try {
      // geoSearch con coordenadas y distancia
      const geoResults4 = await client.geoSearch(
        "test:geo",
        {
          longitude: -58.2342,
          latitude: -32.4877,
        },
        {
          radius: 1,
          unit: "km",
        },
        {
          WITHCOORD: true,
          WITHDIST: true,
        },
      )
      console.log("✅ geoSearch con opciones:", geoResults4)
    } catch (error) {
      console.log("❌ geoSearch con opciones falló:", error.message)
    }

    // Verificar qué hay en la clave
    console.log("🔍 Verificando contenido de test:geo...")
    const allMembers = await client.geoPos("test:geo", "test-location")
    console.log("📍 Posición de test-location:", allMembers)

    // Limpiar
    await client.del("test")
    await client.del("test:geo")

    console.log("🎉 ¡Pruebas completadas!")
    return true
  } catch (error) {
    console.error("❌ Error:", error.message)
    console.error("📋 Stack:", error.stack)
    return false
  } finally {
    await client.quit()
  }
}

testRedisConnection()
