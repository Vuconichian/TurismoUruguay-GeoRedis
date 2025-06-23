"use client"

import { useState } from "react"

export default function Navbar({ onCategoryChange, activeCategory }) {
  const [activeTab, setActiveTab] = useState(activeCategory || "Cervecerias")

  const categories = ["Cervecerias", "Universidades", "Farmacias", "Centro medico", "Supermercados"]

  const handleCategoryClick = (category) => {
    setActiveTab(category)
    if (onCategoryChange) {
      onCategoryChange(category)
    }
  }

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold">Buscador de Lugares</span>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === category ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden py-2">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-2 py-1 rounded-md text-sm font-medium ${
                  activeTab === category ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
