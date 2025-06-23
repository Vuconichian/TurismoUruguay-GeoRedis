#!/bin/bash
echo "🧪 === PROBANDO CONEXIÓN REDIS ==="
echo "📋 Información del contenedor:"
docker ps | grep redis-tourism

echo ""
echo "🔌 Probando conexión directa:"
docker exec -it redis-tourism redis-cli ping

echo ""
echo "📡 Probando desde Node.js:"
node test-redis.js
