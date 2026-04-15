export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-700 mb-4"></div>
        <p className="text-primary-600 font-light">Loading events...</p>
      </div>
    </div>
  )
}

