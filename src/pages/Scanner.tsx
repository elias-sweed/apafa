export default function Scanner() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <h1 className="text-2xl font-bold mb-4">Escáner de Carnets</h1>
      <div className="w-64 h-64 border-4 border-dashed border-gray-500 flex items-center justify-center">
        <p className="text-gray-400">Cámara aquí</p>
      </div>
    </div>
  )
}