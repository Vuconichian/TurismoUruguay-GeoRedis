// Script para probar la función mejorada de Redis
const { connectRedis, geoSearchLocations } = require("./redisClient")

async function testImprovedRedis() {
  console.log("🧪 === PROBANDO REDIS MEJORADO ===")

  try {
    const client = await connectRedis()

    // Limpiar datos previos
    await client.del("test:improved")

    // Datos de prueba
    const testLocations = [
      {
        data: { id: 1, name: "Cervecería del Puerto" },
        lat: -32.4877,
        lng: -58.2342,
      },
      {
        data: { id: 2, name: "Brewhouse Uruguay" },
        lat: -32.4901,
        lng: -58.2298,
      },
    ]

    console.log("📍 === AGREGANDO DATOS DE PRUEBA ===")

    for (const location of testLocations) {
      console.log(`📍 Agregando: ${location.data.name} en ${location.lat}, ${location.lng}`)

      await client.geoAdd("test:improved", {
        longitude: location.lng,
        latitude: location.lat,
        member: JSON.stringify(location.data),
      })
    }

    console.log("✅ Datos agregados")

    // Probar nuestra función mejorada
    console.log("\n🔍 === PROBANDO FUNCIÓN MEJORADA ===")

    const results = await geoSearchLocations(
      "test:improved",
      -58.2342, // lng centro
      -32.4877, // lat centro
      5, // radio 5km
      "km",
      true, // con coordenadas
      true, // con distancia
    )

    console.log(`📦 === RESULTADOS FINALES ===`)
    console.log(`📊 Cantidad: ${results.length}`)

    results.forEach((result, index) => {
      console.log(`\n📍 Resultado ${index + 1}:`)
      console.log(`   Member: ${result.member}`)
      console.log(
        `   Coordenadas: ${result.coordinates ? `${result.coordinates.latitude}, ${result.coordinates.longitude}` : "null"}`,
      )
      console.log(`   Distancia: ${result.distance}km`)

      // Parsear member para ver los datos
      try {
        const memberData = JSON.parse(result.member)
        console.log(`   Datos parseados: ${memberData.name} (ID: ${memberData.id})`)
      } catch (e) {
        console.log(`   Error parseando member: ${e.message}`)
      }
    })

    // Limpiar
    await client.del("test:improved")

    console.log("\n🎉 Test completado exitosamente")
  } catch (error) {
    console.error("❌ Error en test:", error)
  }
}

testImprovedRedis()
