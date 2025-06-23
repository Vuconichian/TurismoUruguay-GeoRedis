"use client"

import { useState } from "react"

export default function Formulario({ onSubmit, categories }) {
  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: "",
    category: "Cervecerías artesanales",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido"
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres"
    }

    // Validar latitud
    if (!formData.latitude) {
      newErrors.latitude = "La latitud es requerida"
    } else {
      const lat = Number.parseFloat(formData.latitude)
      if (Number.isNaN(lat)) {
        newErrors.latitude = "La latitud debe ser un número válido"
      } else if (lat < -90 || lat > 90) {
        newErrors.latitude = "La latitud debe estar entre -90 y 90"
      }
    }

    // Validar longitud
    if (!formData.longitude) {
      newErrors.longitude = "La longitud es requerida"
    } else {
      const lng = Number.parseFloat(formData.longitude)
      if (Number.isNaN(lng)) {
        newErrors.longitude = "La longitud debe ser un número válido"
      } else if (lng < -180 || lng > 180) {
        newErrors.longitude = "La longitud debe estar entre -180 y 180"
      }
    }

    // Validar categoría
    if (!formData.category) {
      newErrors.category = "La categoría es requerida"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    console.log("📝 Datos del formulario:", formData)

    // Validar formulario
    if (!validateForm()) {
      console.log("❌ Errores de validación:", errors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      console.log("📤 Enviando datos al servidor...")

      const result = await onSubmit({
        name: formData.name.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        category: formData.category,
      })

      if (result) {
        console.log("✅ Lugar agregado exitosamente")
        // Limpiar formulario
        setFormData({
          name: "",
          latitude: "",
          longitude: "",
          category: "Cervecerías artesanales",
        })

        // Mostrar mensaje de éxito
        alert("¡Lugar agregado exitosamente!")
      }
    } catch (error) {
      console.error("❌ Error en el formulario:", error)
      setErrors({ submit: `Error al guardar: ${error.message}` })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }))
          console.log("📍 Ubicación actual obtenida:", position.coords)
        },
        (error) => {
          console.error("❌ Error obteniendo ubicación:", error)
          alert("No se pudo obtener tu ubicación actual")
        },
      )
    } else {
      alert("Tu navegador no soporta geolocalización")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">➕</span>
        <h3 className="text-2xl font-bold text-gray-800">Agregar Nuevo Lugar</h3>
      </div>

      {/* Error general */}
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-lg text-red-800">{errors.submit}</p>
        </div>
      )}

      {/* Nombre */}
      <div>
        <label htmlFor="name" className="block text-xl font-semibold text-gray-700 mb-3">
          Nombre del lugar *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Cervecería del Puerto"
          className={`w-full rounded-xl shadow-sm p-4 border text-lg ${
            errors.name
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          }`}
          disabled={isSubmitting}
        />
        {errors.name && <p className="mt-2 text-lg text-red-600">{errors.name}</p>}
      </div>

      {/* Coordenadas */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="latitude" className="block text-xl font-semibold text-gray-700 mb-3">
            Latitud *
          </label>
          <input
            type="number"
            step="any"
            id="latitude"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            placeholder="-32.4877"
            className={`w-full rounded-xl shadow-sm p-4 border text-lg ${
              errors.latitude
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
            disabled={isSubmitting}
          />
          {errors.latitude && <p className="mt-2 text-lg text-red-600">{errors.latitude}</p>}
        </div>
        <div>
          <label htmlFor="longitude" className="block text-xl font-semibold text-gray-700 mb-3">
            Longitud *
          </label>
          <input
            type="number"
            step="any"
            id="longitude"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            placeholder="-58.2342"
            className={`w-full rounded-xl shadow-sm p-4 border text-lg ${
              errors.longitude
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
            disabled={isSubmitting}
          />
          {errors.longitude && <p className="mt-2 text-lg text-red-600">{errors.longitude}</p>}
        </div>
      </div>

      {/* Botón para obtener ubicación actual */}
      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={isSubmitting}
        className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 text-lg font-medium"
      >
        📍 Usar mi ubicación actual
      </button>

      {/* Categoría */}
      <div>
        <label htmlFor="category" className="block text-xl font-semibold text-gray-700 mb-3">
          Categoría *
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={`w-full rounded-xl shadow-sm p-4 border text-lg ${
            errors.category
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          }`}
          disabled={isSubmitting}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && <p className="mt-2 text-lg text-red-600">{errors.category}</p>}
      </div>

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-black py-4 px-8 rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xl"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            Guardando...
          </>
        ) : (
          <>📍 Agregar Lugar</>
        )}
      </button>

      {/* Ayuda */}
      <div className="text-base text-gray-500 space-y-2">
        <p>
          💡 <strong>Tip:</strong> Puedes obtener coordenadas desde Google Maps
        </p>
        <p>🗺️ Haz clic derecho en Google Maps → "¿Qué hay aquí?" para ver las coordenadas</p>
      </div>
    </form>
  )
}
