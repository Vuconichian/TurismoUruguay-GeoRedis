// Verificar versión de Redis y comandos disponibles
const redis = require("redis")

async function checkRedisVersion() {
  console.log("🔍 === VERIFICANDO REDIS ===")

  const client = redis.createClient({
    url: "redis://localhost:6379",
  })

  try {
    await client.connect()

    // Obtener información del servidor Redis
    const info = await client.info("server")
    console.log("📋 Información del servidor Redis:")
    console.log(info)

    // Verificar versión específica
    const lines = info.split("\r\n")
    const versionLine = lines.find((line) => line.startsWith("redis_version:"))
    if (versionLine) {
      const version = versionLine.split(":")[1]
      console.log("🏷️ Versión de Redis:", version)
    }

    // Probar comandos disponibles
    console.log("\n🧪 Probando comandos disponibles...")

    // Limpiar
    await client.del("version:test")

    // Agregar datos de prueba
    await client.geoAdd("version:test", {
      longitude: -58.2342,
      latitude: -32.4877,
      member: "test",
    })

    // Probar diferentes comandos
    const commands = [
      {
        name: "GEOPOS",
        test: async () => await client.geoPos("version:test", "test"),
      },
      {
        name: "GEODIST",
        test: async () => await client.geoDist("version:test", "test", "test", "km"),
      },
      {
        name: "GEORADIUS (simple)",
        test: async () => await client.sendCommand(["GEORADIUS", "version:test", "-58.2342", "-32.4877", "1", "km"]),
      },
      {
        name: "GEOSEARCH",
        test: async () =>
          await client.sendCommand([
            "GEOSEARCH",
            "version:test",
            "FROMLONLAT",
            "-58.2342",
            "-32.4877",
            "BYRADIUS",
            "1",
            "km",
          ]),
      },
    ]

    for (const cmd of commands) {
      try {
        const result = await cmd.test()
        console.log(`✅ ${cmd.name}:`, result)
      } catch (error) {
        console.log(`❌ ${cmd.name}:`, error.message)
      }
    }

    // Limpiar
    await client.del("version:test")
  } catch (error) {
    console.error("❌ Error:", error.message)
  } finally {
    await client.quit()
  }
}

checkRedisVersion()
