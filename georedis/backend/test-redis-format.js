// Script para probar el formato exacto de geoSearch
const { connectRedis, geoSearchLocations } = require("./redisClient")

async function testRedisFormat() {
  console.log("🧪 === PROBANDO FORMATO DE GEOSEARCH ===")

  try {
    const client = await connectRedis()

    // Limpiar datos previos
    await client.del("test:format")

    // Datos de prueba
    const testLocation = {
      id: 999,
      name: "Test Location",
      createdAt: new Date().toISOString(),
    }

    const testLat = -32.4877
    const testLng = -58.2342

    console.log("📍 === AGREGANDO DATOS DE PRUEBA ===")
    console.log("📦 Data:", JSON.stringify(testLocation))
    console.log("📍 Coordenadas:", testLat, testLng)

    // Guardar en Redis
    const addResult = await client.geoAdd("test:format", {
      longitude: testLng,
      latitude: testLat,
      member: JSON.stringify(testLocation),
    })

    console.log("✅ geoAdd resultado:", addResult)

    // Probar diferentes formatos de geoSearch
    console.log("\n🔍 === PROBANDO DIFERENTES FORMATOS ===")

    // 1. Solo miembros
    console.log("\n1️⃣ Solo miembros:")
    const result1 = await client.geoSearch(
      "test:format",
      { longitude: testLng, latitude: testLat },
      { radius: 1, unit: "km" },
    )
    console.log("Resultado:", JSON.stringify(result1, null, 2))

    // 2. Con coordenadas
    console.log("\n2️⃣ Con coordenadas:")
    const result2 = await client.geoSearch(
      "test:format",
      { longitude: testLng, latitude: testLat },
      { radius: 1, unit: "km" },
      { WITHCOORD: true },
    )
    console.log("Resultado:", JSON.stringify(result2, null, 2))

    // 3. Con distancia
    console.log("\n3️⃣ Con distancia:")
    const result3 = await client.geoSearch(
      "test:format",
      { longitude: testLng, latitude: testLat },
      { radius: 1, unit: "km" },
      { WITHDIST: true },
    )
    console.log("Resultado:", JSON.stringify(result3, null, 2))

    // 4. Con coordenadas Y distancia
    console.log("\n4️⃣ Con coordenadas Y distancia:")
    const result4 = await client.geoSearch(
      "test:format",
      { longitude: testLng, latitude: testLat },
      { radius: 1, unit: "km" },
      { WITHCOORD: true, WITHDIST: true },
    )
    console.log("Resultado:", JSON.stringify(result4, null, 2))

    // Analizar el formato del resultado 4
    if (result4.length > 0) {
      console.log("\n🔍 === ANALIZANDO FORMATO COMPLETO ===")
      const item = result4[0]
      console.log("Tipo del item:", typeof item)
      console.log("Es array:", Array.isArray(item))
      console.log("Longitud:", item.length)
      console.log("Elemento 0 (member):", item[0])
      console.log("Elemento 1 (distance):", item[1])
      console.log("Elemento 2 (coordinates):", item[2])

      if (item[2]) {
        console.log("Coordenadas - Longitud:", item[2][0])
        console.log("Coordenadas - Latitud:", item[2][1])
      }
    }

    // Limpiar
    await client.del("test:format")

    console.log("\n🎉 Test completado")
  } catch (error) {
    console.error("❌ Error en test:", error)
  }
}

testRedisFormat()
