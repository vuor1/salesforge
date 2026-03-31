import Link from 'next/link'

export default function NotAuthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Ei käyttöoikeutta</h1>
        <p className="text-gray-600">Sinulla ei ole oikeuksia tähän sivuun.</p>
        <Link
          href="/dashboard"
          className="inline-block text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Takaisin etusivulle
        </Link>
      </div>
    </div>
  )
}
