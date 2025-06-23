"use client"

export default function CategoryGrid({ categories, selectedCategory, onCategoryChange, locationCounts }) {
  const getCategoryIcon = (category) => {
    switch (category) {
      case "Cervecerías artesanales":
        return "🍺"
      case "Universidades":
        return "🎓"
      case "Farmacias":
        return "⚕️"
      case "Centros de atención de emergencias":
        return "🚨"
      case "Supermercados":
        return "🛒"
      default:
        return "📍"
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case "Cervecerías artesanales":
        return "from-amber-500 to-orange-600"
      case "Universidades":
        return "from-blue-500 to-indigo-600"
      case "Farmacias":
        return "from-green-500 to-emerald-600"
      case "Centros de atención de emergencias":
        return "from-red-500 to-rose-600"
      case "Supermercados":
        return "from-purple-500 to-violet-600"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`group relative overflow-hidden rounded-3xl p-8 text-black transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
            selectedCategory === category
              ? `bg-gradient-to-br ${getCategoryColor(category)} shadow-2xl scale-105`
              : `bg-gradient-to-br ${getCategoryColor(category)} opacity-80 hover:opacity-100`
          }`}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div
              className={`p-4 rounded-full bg-white/20 backdrop-blur-sm text-6xl ${
                selectedCategory === category ? "bg-white/30" : ""
              }`}
            >
              {getCategoryIcon(category)}
            </div>
            <h3 className="font-bold text-lg leading-tight">{category}</h3>
            {selectedCategory === category && (
              <div className="bg-white/20 px-4 py-2 rounded-full">
                <span className="text-base font-semibold">{locationCounts} lugares</span>
              </div>
            )}
          </div>

          <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-3 -left-3 w-12 h-12 bg-white/10 rounded-full"></div>
        </button>
      ))}
    </div>
  )
}
