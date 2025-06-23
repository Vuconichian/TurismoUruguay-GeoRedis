export default function LocationDetails({ location, distance, category }) {
  const getCategoryColor = (category) => {
    switch (category) {
      case "Cervecerías artesanales":
        return "text-amber-600 bg-amber-50"
      case "Universidades":
        return "text-blue-600 bg-blue-50"
      case "Farmacias":
        return "text-green-600 bg-green-50"
      case "Centros de atención de emergencias":
        return "text-red-600 bg-red-50"
      case "Supermercados":
        return "text-purple-600 bg-purple-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 border-l-4 border-blue-500">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">{location.name}</h3>
          <div
            className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-medium ${getCategoryColor(category)}`}
          >
            {category}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
          <span className="text-blue-600 text-3xl">🧭</span>
          <div>
            <p className="font-semibold text-blue-800 text-xl">Distancia</p>
            <p className="text-blue-600 text-lg">{distance.toFixed(2)} km de tu ubicación</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
          <span className="text-gray-600 text-3xl">📍</span>
          <div>
            <p className="font-semibold text-gray-800 text-xl">Coordenadas</p>
            <p className="text-gray-600 text-lg">
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 text-xl">
          Ver Detalles Completos
        </button>
      </div>
    </div>
  )
}
