const express = require("express")
const cors = require("cors")
const { connectRedis } = require("./redisClient")

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"], // Ambas variantes de localhost
    credentials: true,
  }),
)

// Middleware para parsear JSON con mejor manejo de errores
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Logging middleware mejorado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`${timestamp} - ${req.method} ${req.path}`)

  if (req.method === "POST" && req.body) {
    console.log("📦 Body recibido:", JSON.stringify(req.body, null, 2))
  }

  next()
})

// Ruta de prueba básica (sin Redis)
app.get("/", (req, res) => {
  res.json({
    message: "🚀 API de Turismo Concepción del Uruguay",
    status: "running",
    timestamp: new Date().toISOString(),
  })
})

// Ruta de health check (sin Redis)
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
    redis: "checking...",
  })
})

// Conectar a Redis (opcional para testing)
let redisConnected = false
connectRedis()
  .then(() => {
    console.log("✅ Redis connected successfully")
    redisConnected = true
  })
  .catch((err) => {
    console.error("❌ Failed to connect to Redis:", err.message)
    console.log("⚠️  Servidor funcionará sin Redis por ahora")
  })

// Rutas de ubicaciones
app.use("/api/locations", require("./routes/locations"))

// Ruta de health check con Redis
app.get("/api/health/full", async (req, res) => {
  try {
    const client = await connectRedis()
    await client.ping()
    res.json({
      status: "OK",
      message: "API y Redis funcionando",
      redis: "connected",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.json({
      status: "PARTIAL",
      message: "API funcionando, Redis desconectado",
      redis: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
})

// Manejo de errores 404
app.use("*", (req, res) => {
  console.log(`❌ 404 - Ruta no encontrada: ${req.originalUrl}`)
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.originalUrl,
    availableRoutes: ["/", "/api/health", "/api/health/full", "/api/locations"],
  })
})

// Manejo de errores globales mejorado
app.use((err, req, res, next) => {
  console.error("❌ Error global capturado:")
  console.error("Stack:", err.stack)
  console.error("Message:", err.message)
  console.error("Request URL:", req.url)
  console.error("Request Method:", req.method)
  console.error("Request Body:", req.body)

  res.status(500).json({
    error: "Error interno del servidor",
    details: process.env.NODE_ENV === "development" ? err.message : "Error interno",
    timestamp: new Date().toISOString(),
  })
})

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
  console.log(`📍 API de ubicaciones: http://localhost:${PORT}/api/locations`)
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🔍 Health check completo: http://localhost:${PORT}/api/health/full`)
  console.log(`📊 Redis conectado: ${redisConnected ? "✅ Sí" : "❌ No"}`)
})

// Manejo de cierre graceful
process.on("SIGINT", async () => {
  console.log("\n🛑 Cerrando servidor...")
  try {
    const { client } = require("./redisClient")
    if (client && client.isOpen) {
      await client.quit()
      console.log("✅ Redis desconectado")
    }
  } catch (error) {
    console.error("Error cerrando Redis:", error.message)
  }
  process.exit(0)
})

// Manejo de errores no capturados
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err)
  process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason)
})
